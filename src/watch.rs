use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use anyhow::{Context, Result, bail};
use chrono::{DateTime, Local};
use notify::event::{CreateKind, ModifyKind, RemoveKind};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};

const EVENT_QUEUE_LIMIT: usize = 1_024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChangeKind {
    Created,
    FolderCreated,
    Modified,
    Renamed,
    Removed,
    FolderRemoved,
    Metadata,
    Other,
}

impl ChangeKind {
    pub fn label(self) -> &'static str {
        match self {
            Self::Created => "创建文件",
            Self::FolderCreated => "创建文件夹",
            Self::Modified => "修改文件内容",
            Self::Renamed => "修改文件/文件夹名称",
            Self::Removed => "删除文件",
            Self::FolderRemoved => "删除文件夹",
            Self::Metadata => "修改文件属性",
            Self::Other => "文件/文件夹变更",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Change {
    pub kind: ChangeKind,
    pub paths: Vec<PathBuf>,
    pub time: DateTime<Local>,
}

impl Change {
    pub fn new(kind: ChangeKind, paths: Vec<PathBuf>) -> Self {
        Self {
            kind,
            paths,
            time: Local::now(),
        }
    }

    pub fn from_event(event: Event) -> Option<Self> {
        if event.paths.is_empty() {
            return None;
        }
        let kind = match event.kind {
            EventKind::Create(CreateKind::Folder) => ChangeKind::FolderCreated,
            EventKind::Create(_) => ChangeKind::Created,
            EventKind::Modify(ModifyKind::Name(_)) => ChangeKind::Renamed,
            EventKind::Modify(ModifyKind::Metadata(_)) => ChangeKind::Metadata,
            EventKind::Modify(_) => ChangeKind::Modified,
            EventKind::Remove(RemoveKind::Folder) => ChangeKind::FolderRemoved,
            EventKind::Remove(_) => ChangeKind::Removed,
            EventKind::Any | EventKind::Other => ChangeKind::Other,
            EventKind::Access(_) => return None,
        };
        Some(Self::new(kind, event.paths))
    }
}

pub fn validate_folder(path: &Path) -> Result<PathBuf> {
    let path = path
        .canonicalize()
        .with_context(|| format!("无法访问文件夹：{}", path.display()))?;
    if !path.is_dir() {
        bail!("请选择文件夹，暂不支持监听单个文件");
    }
    Ok(path)
}

/// Each session owns its watcher and event queue. Dropping it stops watching
/// and discards queued events, so a new directory cannot inherit old events.
pub struct WatchSession {
    _watcher: RecommendedWatcher,
    receiver: async_channel::Receiver<notify::Result<Event>>,
    dropped: Arc<AtomicUsize>,
}

impl WatchSession {
    pub fn start(path: &Path) -> Result<Self> {
        let path = validate_folder(path)?;
        let (sender, receiver) = async_channel::bounded(EVENT_QUEUE_LIMIT);
        let dropped = Arc::new(AtomicUsize::new(0));
        let callback_dropped = dropped.clone();
        let mut watcher = notify::recommended_watcher(move |event| {
            if let Err(async_channel::TrySendError::Full(_)) = sender.try_send(event) {
                callback_dropped.fetch_add(1, Ordering::Relaxed);
            }
        })
        .context("无法初始化文件监听器")?;
        watcher
            .watch(&path, RecursiveMode::Recursive)
            .with_context(|| format!("无法监听：{}", path.display()))?;
        Ok(Self {
            _watcher: watcher,
            receiver,
            dropped,
        })
    }

    pub fn drain(&self) -> Vec<Result<Change>> {
        let mut changes = Vec::new();
        for _ in 0..EVENT_QUEUE_LIMIT {
            let Ok(event) = self.receiver.try_recv() else {
                break;
            };
            match event {
                Ok(event) => {
                    if event.need_rescan() {
                        changes.push(Err(anyhow::anyhow!(
                            "系统通知部分文件事件已丢失，变更记录可能不完整"
                        )));
                    }
                    if let Some(change) = Change::from_event(event) {
                        changes.push(Ok(change));
                    }
                }
                Err(error) => changes.push(Err(error.into())),
            }
        }
        let dropped = self.dropped.swap(0, Ordering::Relaxed);
        if dropped > 0 {
            changes.push(Err(anyhow::anyhow!(
                "变更过于频繁，已跳过 {dropped} 条事件"
            )));
        }
        changes
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify::event::{AccessKind, DataChange, RenameMode};
    use std::fs;
    use std::time::{Duration, Instant};

    #[test]
    fn maps_changes_and_preserves_both_rename_paths() {
        let change = Change::from_event(
            Event::new(EventKind::Modify(ModifyKind::Name(RenameMode::Both)))
                .add_path("before.txt".into())
                .add_path("after.txt".into()),
        )
        .unwrap();
        assert_eq!(change.kind, ChangeKind::Renamed);
        assert_eq!(change.paths.len(), 2);
        let change = Change::from_event(
            Event::new(EventKind::Modify(ModifyKind::Data(DataChange::Content)))
                .add_path("file".into()),
        )
        .unwrap();
        assert_eq!(change.kind, ChangeKind::Modified);
        assert!(
            Change::from_event(
                Event::new(EventKind::Access(AccessKind::Any)).add_path("file".into())
            )
            .is_none()
        );
        assert!(Change::from_event(Event::new(EventKind::Any)).is_none());
    }

    #[test]
    fn rejects_files_and_missing_paths() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("file.txt");
        fs::write(&file, "hello").unwrap();
        assert!(validate_folder(directory.path()).is_ok());
        assert!(WatchSession::start(&file).is_err());
        assert!(WatchSession::start(&directory.path().join("missing")).is_err());
    }

    fn wait_for(session: &WatchSession, path: &Path, kind: ChangeKind) -> Vec<Change> {
        let deadline = Instant::now() + Duration::from_secs(8);
        let mut received = Vec::new();
        while Instant::now() < deadline {
            received.extend(session.drain().into_iter().map(Result::unwrap));
            if received.iter().any(|change| {
                change.kind == kind && change.paths.iter().any(|event_path| event_path == path)
            }) {
                return received;
            }
            std::thread::sleep(Duration::from_millis(40));
        }
        panic!("No filesystem event received for {}", path.display());
    }

    #[test]
    fn recursively_watches_and_isolates_restarted_sessions() {
        let first = tempfile::tempdir().unwrap();
        let second = tempfile::tempdir().unwrap();
        let first_root = first.path().canonicalize().unwrap();
        let second_root = second.path().canonicalize().unwrap();
        let nested = first_root.join("nested");
        fs::create_dir(&nested).unwrap();
        let session = WatchSession::start(first.path()).unwrap();
        let original = nested.join("original.txt");
        fs::write(&original, "created").unwrap();
        wait_for(&session, &original, ChangeKind::Created);
        fs::write(&original, "changed").unwrap();
        wait_for(&session, &original, ChangeKind::Modified);
        let renamed = nested.join("renamed.txt");
        fs::rename(&original, &renamed).unwrap();
        wait_for(&session, &renamed, ChangeKind::Renamed);
        fs::remove_file(&renamed).unwrap();
        wait_for(&session, &renamed, ChangeKind::Removed);
        drop(session);
        let session = WatchSession::start(second.path()).unwrap();
        fs::write(&original, "old directory").unwrap();
        let fresh = second_root.join("fresh.txt");
        fs::write(&fresh, "new directory").unwrap();
        let received = wait_for(&session, &fresh, ChangeKind::Created);
        assert!(received.iter().all(|change| {
            change
                .paths
                .iter()
                .all(|path| path.starts_with(&second_root))
        }));
        std::thread::sleep(Duration::from_millis(250));
        assert!(
            session
                .drain()
                .into_iter()
                .filter_map(Result::ok)
                .all(|change| change
                    .paths
                    .iter()
                    .all(|path| path.starts_with(second.path().canonicalize().unwrap())))
        );
    }
}
