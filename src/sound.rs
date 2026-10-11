use std::io::Cursor;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, SyncSender};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use rodio::{Decoder, OutputStream, Sink};

const SOUND_DATA: &[u8] = include_bytes!("../assets/notify.mp3");

/// A single bounded audio worker prevents one thread/stream per filesystem event.
pub struct SoundPlayer {
    sender: SyncSender<()>,
    errors: Receiver<String>,
    stopping: Arc<AtomicBool>,
    worker: Option<JoinHandle<()>>,
}

impl Default for SoundPlayer {
    fn default() -> Self {
        let (sender, receiver) = mpsc::sync_channel(1);
        let (error_sender, errors) = mpsc::sync_channel(1);
        let stopping = Arc::new(AtomicBool::new(false));
        let worker_stopping = stopping.clone();
        let worker = thread::spawn(move || {
            let mut last_play: Option<Instant> = None;
            while !worker_stopping.load(Ordering::Relaxed) {
                if receiver.recv_timeout(Duration::from_millis(100)).is_err() {
                    continue;
                }
                if worker_stopping.load(Ordering::Relaxed) {
                    break;
                }
                if last_play.is_some_and(|last| last.elapsed() < Duration::from_millis(500)) {
                    continue;
                }
                last_play = Some(Instant::now());
                let play = || -> anyhow::Result<()> {
                    let (_stream, handle) = OutputStream::try_default()?;
                    let sink = Sink::try_new(&handle)?;
                    sink.append(Decoder::new_mp3(Cursor::new(SOUND_DATA))?);
                    while !sink.empty() && !worker_stopping.load(Ordering::Relaxed) {
                        thread::sleep(Duration::from_millis(50));
                    }
                    sink.stop();
                    Ok(())
                };
                if let Err(error) = play() {
                    let _ = error_sender.try_send(format!("提示音无法播放：{error}"));
                }
            }
        });
        Self {
            sender,
            errors,
            stopping,
            worker: Some(worker),
        }
    }
}

impl SoundPlayer {
    pub fn play(&self) {
        let _ = self.sender.try_send(());
    }

    pub fn take_error(&self) -> Option<String> {
        self.errors.try_recv().ok()
    }
}

impl Drop for SoundPlayer {
    fn drop(&mut self) {
        self.stopping.store(true, Ordering::Relaxed);
        let _ = self.sender.try_send(());
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bundled_sound_decodes_without_external_files() {
        assert!(Decoder::new_mp3(Cursor::new(SOUND_DATA)).is_ok());
    }

    #[test]
    fn idle_audio_worker_shuts_down_without_an_audio_device() {
        let player = SoundPlayer::default();
        drop(player);
    }
}
