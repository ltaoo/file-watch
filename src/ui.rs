use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};

use file_watch::{
    history::{HISTORY_LIMIT, History},
    sound::SoundPlayer,
    watch::{ChangeKind, WatchSession, validate_folder},
};
use gpui::{
    App, ClipboardItem, Context, Entity, ExternalPaths, FocusHandle, FontWeight, Hsla, IntoElement,
    PathPromptOptions, Render, Subscription, Task, Window, actions, div, prelude::*, px, rgb,
    uniform_list,
};
use gpuikit::{
    DefaultIcons,
    elements::{
        button::button,
        checkbox::{Checkbox, CheckboxChanged, checkbox},
    },
    layout::h_stack,
    theme::{ActiveTheme, GlobalTheme, Theme, ThemeVariant, Themeable},
};

actions!(file_watch, [OpenFolder, ToggleWatch, ClearRecords, Quit]);

/// Carry the original light background and neutral cards into gpuikit's theme.
pub fn init_theme(cx: &mut App) {
    let mut theme = Theme::new(
        "FileWatch",
        ThemeVariant::Light,
        rgb(0x111827).into(),
        rgb(0xf8f9fa).into(),
        rgb(0xffffff).into(),
        rgb(0xe5e7eb).into(),
        rgb(0x2563eb).into(),
    );
    theme.fg_muted_color = Some(rgb(0x4b5563).into());
    theme.surface_secondary_color = Some(rgb(0xf3f4f6).into());
    theme.surface_tertiary_color = Some(rgb(0xe5e7eb).into());
    cx.set_global(GlobalTheme(Arc::new(theme)));
}

pub struct FileWatch {
    folder: Option<PathBuf>,
    session: Option<WatchSession>,
    history: History,
    status: String,
    error: bool,
    choosing: bool,
    focus: FocusHandle,
    sound_enabled: bool,
    sound: SoundPlayer,
    sound_checkbox: Entity<Checkbox>,
    root_check_after: Instant,
    _subscriptions: Vec<Subscription>,
    _poll_task: Task<()>,
}

impl FileWatch {
    pub fn new(
        initial_folder: Option<PathBuf>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let focus = cx.focus_handle();
        window.focus(&focus, cx);
        let sound_checkbox = cx.new(|_| checkbox("sound-enabled", true).label("提示音"));
        let subscription = cx.subscribe(&sound_checkbox, |this, _, event: &CheckboxChanged, cx| {
            this.sound_enabled = event.checked;
            cx.notify();
        });
        let executor = cx.background_executor().clone();
        let poll_task = cx.spawn(async move |this, cx| {
            loop {
                executor.timer(Duration::from_millis(100)).await;
                if this.update(cx, |this, cx| this.poll_events(cx)).is_err() {
                    break;
                }
            }
        });
        let mut view = Self {
            folder: None,
            session: None,
            history: History::default(),
            status: "选择或拖入一个文件夹，然后开始监听".into(),
            error: false,
            choosing: false,
            focus,
            sound_enabled: true,
            sound: SoundPlayer::default(),
            sound_checkbox,
            root_check_after: Instant::now(),
            _subscriptions: vec![subscription],
            _poll_task: poll_task,
        };
        if let Some(folder) = initial_folder {
            view.select_folder(folder, cx);
        }
        view
    }

    fn set_status(&mut self, status: impl Into<String>, error: bool, cx: &mut Context<Self>) {
        self.status = status.into();
        self.error = error;
        cx.notify();
    }

    fn select_folder(&mut self, folder: PathBuf, cx: &mut Context<Self>) {
        match validate_folder(&folder) {
            Ok(folder) => {
                // Only stop the current session after validating the replacement.
                self.session = None;
                self.folder = Some(folder);
                self.history.clear();
                self.set_status("文件夹已选择，点击「开始监听」", false, cx);
            }
            Err(error) => self.set_status(format!("{error:#}"), true, cx),
        }
    }

    fn choose_folder(&mut self, _: &OpenFolder, _: &mut Window, cx: &mut Context<Self>) {
        if self.choosing {
            return;
        }
        self.choosing = true;
        cx.notify();
        let prompt = cx.prompt_for_paths(PathPromptOptions {
            files: false,
            directories: true,
            multiple: false,
            prompt: Some("选择监听文件夹".into()),
        });
        cx.spawn(async move |this, cx| {
            let result = prompt.await;
            let _ = this.update(cx, |this, cx| {
                this.choosing = false;
                match result {
                    Ok(Ok(Some(paths))) if paths.len() == 1 => {
                        this.select_folder(paths[0].clone(), cx)
                    }
                    Ok(Ok(None)) => cx.notify(),
                    Ok(Ok(Some(_))) => this.set_status("一次只能选择一个文件夹", true, cx),
                    Ok(Err(error)) => {
                        this.set_status(format!("无法打开文件夹选择器：{error:#}"), true, cx)
                    }
                    Err(error) => this.set_status(format!("文件夹选择器已关闭：{error}"), true, cx),
                }
            });
        })
        .detach();
    }

    fn toggle_watch(&mut self, _: &ToggleWatch, _: &mut Window, cx: &mut Context<Self>) {
        if self.session.is_some() {
            // Preserve changes already delivered before stopping the watcher.
            self.poll_events(cx);
            self.session = None;
            self.set_status("已停止监听，变更记录已保留", false, cx);
            return;
        }
        let Some(folder) = &self.folder else {
            self.set_status("先选择一个文件夹", true, cx);
            return;
        };
        match WatchSession::start(folder) {
            Ok(session) => {
                self.session = Some(session);
                self.set_status("正在递归监听文件夹及其子文件夹", false, cx);
            }
            Err(error) => self.set_status(format!("{error:#}"), true, cx),
        }
    }

    fn clear_records(&mut self, _: &ClearRecords, _: &mut Window, cx: &mut Context<Self>) {
        self.history.clear();
        cx.notify();
    }

    fn poll_events(&mut self, cx: &mut Context<Self>) {
        let changes = self
            .session
            .as_ref()
            .map(WatchSession::drain)
            .unwrap_or_default();
        let mut changed = false;
        for change in changes {
            match change {
                Ok(change) => {
                    self.history.push(change);
                    changed = true;
                }
                Err(error) => self.set_status(format!("监听异常：{error:#}"), true, cx),
            }
        }
        if changed {
            if self.sound_enabled {
                self.sound.play();
            }
            cx.notify();
        }
        if self.session.is_some() && Instant::now() >= self.root_check_after {
            self.root_check_after = Instant::now() + Duration::from_secs(1);
            if self.folder.as_ref().is_some_and(|folder| !folder.is_dir()) {
                self.session = None;
                self.set_status("监听文件夹已被移走或删除，请重新选择文件夹", true, cx);
            }
        }
        if let Some(error) = self.sound.take_error() {
            self.set_status(error, true, cx);
        }
    }

    fn drop_folder(&mut self, paths: &ExternalPaths, _: &mut Window, cx: &mut Context<Self>) {
        if paths.paths().len() != 1 {
            self.set_status("一次只能拖入一个文件夹", true, cx);
            return;
        }
        self.select_folder(paths.paths()[0].clone(), cx);
    }

    fn render_record(&self, index: usize, cx: &App) -> impl IntoElement + use<> {
        let theme = cx.theme();
        let record = &self.history.records[index];
        let color: Hsla = match record.kind {
            ChangeKind::Created | ChangeKind::FolderCreated => theme.success(),
            ChangeKind::Removed | ChangeKind::FolderRemoved => theme.danger(),
            ChangeKind::Renamed => theme.warning(),
            _ => theme.info(),
        };
        let paths = record
            .paths
            .iter()
            .map(|path| path.display().to_string())
            .collect::<Vec<_>>()
            .join(" → ");
        let copy_paths = record
            .paths
            .iter()
            .map(|path| path.display().to_string())
            .collect::<Vec<_>>()
            .join("\n");
        div().id(("record", index)).h(px(100.)).px_6().py_2().child(
            div()
                .size_full()
                .flex()
                .flex_col()
                .gap_2()
                .p_3()
                .rounded_md()
                .border_1()
                .border_color(theme.border())
                .bg(theme.surface())
                .child(
                    h_stack()
                        .gap_3()
                        .child(
                            div()
                                .text_sm()
                                .text_color(color)
                                .font_weight(FontWeight::MEDIUM)
                                .child(record.kind.label()),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(theme.fg_muted())
                                .child(record.time.format("%Y/%m/%d %H:%M:%S").to_string()),
                        ),
                )
                .child(
                    div()
                        .id(("record-path", index))
                        .w_full()
                        .min_w_0()
                        .text_sm()
                        .text_color(theme.fg_muted())
                        .truncate()
                        .cursor_pointer()
                        .hover(|style| style.text_color(theme.fg()))
                        .on_click(move |_, _, cx| {
                            cx.write_to_clipboard(ClipboardItem::new_string(copy_paths.clone()))
                        })
                        .child(paths),
                ),
        )
    }
}

impl Render for FileWatch {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = cx.theme().clone();
        let watching = self.session.is_some();
        let folder_name = self
            .folder
            .as_ref()
            .and_then(|folder| folder.file_name())
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_else(|| {
                if self.folder.is_some() {
                    "根目录".into()
                } else {
                    "选择监听文件夹".into()
                }
            });
        let folder_path = self
            .folder
            .as_ref()
            .map(|folder| folder.display().to_string())
            .unwrap_or_else(|| "将文件夹拖入窗口，或点击「选择文件夹」".into());
        let entity = cx.entity().downgrade();
        let drag_background = theme.accent_bg();

        div().id("file-watch").key_context("FileWatch").track_focus(&self.focus)
            .on_action(cx.listener(Self::choose_folder)).on_action(cx.listener(Self::toggle_watch)).on_action(cx.listener(Self::clear_records))
            .size_full().flex().flex_col().bg(theme.bg()).text_color(theme.fg()).text_size(px(14.))
            .on_drop(cx.listener(Self::drop_folder))
            .drag_over::<ExternalPaths>(move |style, _, _, _| style.bg(drag_background))
            .child(
                div().flex_none().p_6().flex().flex_col().gap_4().border_b_1().border_color(theme.border())
                    .child(h_stack().justify_between().child(div().text_xl().font_weight(FontWeight::SEMIBOLD).child("FileWatch"))
                        .child(div().text_sm().text_color(if watching { theme.success() } else { theme.fg_muted() }).child(if watching { "正在监听" } else { "未在监听" })))
                    .child(h_stack().gap_4().child(DefaultIcons::archive().size(px(36.)).text_color(theme.accent()))
                        .child(div().flex_1().min_w_0().flex().flex_col().gap_1()
                            .child(div().text_lg().font_weight(FontWeight::MEDIUM).truncate().child(folder_name))
                            .child(div().text_sm().text_color(theme.fg_muted()).truncate().child(folder_path))))
                    .child(h_stack().gap_3()
                        .child(button("choose-folder", if self.choosing { "选择中…" } else { "选择文件夹" }).disabled(self.choosing)
                            .on_click(cx.listener(|this, _, window, cx| this.choose_folder(&OpenFolder, window, cx))))
                        .child(button("toggle-watch", if watching { "停止监听" } else { "开始监听" }).disabled(self.folder.is_none())
                            .on_click(cx.listener(|this, _, window, cx| this.toggle_watch(&ToggleWatch, window, cx))))
                        .child(div().flex_1())
                        .child(self.sound_checkbox.clone())),
            )
            .child(h_stack().flex_none().px_6().py_3().justify_between()
                .child(div().text_sm().font_weight(FontWeight::MEDIUM).child(format!("变更记录 · {}", self.history.total)))
                .child(button("clear-records", "清空记录").disabled(self.history.records.is_empty())
                    .on_click(cx.listener(|this, _, window, cx| this.clear_records(&ClearRecords, window, cx)))))
            .child(
                div().flex_1().min_h_0().overflow_hidden().when_else(self.history.records.is_empty(),
                    |view| view.child(div().size_full().flex().flex_col().items_center().justify_center().gap_3().text_color(theme.fg_muted())
                        .child(DefaultIcons::activity_log().size(px(28.)))
                        .child(if watching { "等待文件变更" } else { "尚无变更记录" })
                        .child(div().text_sm().child(if watching { "创建、修改、重命名或删除文件后，记录会显示在这里" } else { "选择文件夹后点击「开始监听」" }))),
                    |view| view.child(uniform_list("changes", self.history.records.len(), move |range, _, cx| {
                        let Some(entity) = entity.upgrade() else { return Vec::new() };
                        let this = entity.read(cx);
                        range.filter(|index| *index < this.history.records.len()).map(|index| this.render_record(index, cx)).collect::<Vec<_>>()
                    }).size_full()),
                ),
            )
            .child(div().flex_none().px_6().py_3().border_t_1().border_color(theme.border()).flex().flex_col().gap_1()
                .child(div().text_sm().text_color(if self.error { theme.danger() } else { theme.fg_muted() }).child(self.status.clone()))
                .child(div().text_xs().text_color(theme.fg_muted()).child(format!("保留最近 {HISTORY_LIMIT} 条记录 · 点击路径可复制 · {}O 选择文件夹 · {}Enter 开始/停止", if cfg!(target_os = "macos") { "⌘" } else { "Ctrl+" }, if cfg!(target_os = "macos") { "⌘" } else { "Ctrl+" }))),
            )
    }
}
