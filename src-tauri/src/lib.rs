use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::mpsc::{self, Receiver};
use std::time::Duration;
use std::{fs, fs::File, thread};

use notify::{recommended_watcher, Event, ReadDirectoryChangesWatcher, RecursiveMode, Watcher};
use rodio::{source::Source, Decoder, OutputStream};
use serde::{Deserialize, Serialize};
use serde_json::{Deserializer, Serializer};
use tauri::async_runtime::Mutex as AsyncMutex;
#[allow(unused)]
use tauri::{
    App, AppHandle, Context, Emitter, Listener, Manager, RunEvent, Runtime, State, WebviewUrl,
};

#[derive(Debug, Serialize, Deserialize)]
struct BizResponse {
    code: i32,
    msg: String,
    data: String,
}
impl BizResponse {
    fn new(code: i32, msg: &str, data: &str) -> Self {
        Self {
            code,
            msg: String::from(msg),
            data: String::from(data),
        }
    }
    fn to_str(&self) -> String {
        let r = serde_json::to_string(self);
        if r.is_err() {
            let code = 1;
            let msg = "serde failed";
            return format!(r#"{{"code":{},"msg":"{}","data":{}}}"#, code, msg, "");
        }
        return r.unwrap();
    }
}

#[derive(Debug, Serialize, Clone)]
struct FileChangeEventPayload {
    pub change_type: String,
    pub paths: Vec<PathBuf>,
}

#[derive(Debug, Serialize, Clone)]
struct FileProfileResp {
    pub file_type: String,
}
impl FileProfileResp {
    fn to_str(&self) -> String {
        let r = serde_json::to_string(self);
        if r.is_err() {
            let msg = "serde failed";
            return format!(r#"{{"file_type":{}}}"#, msg);
        }
        return r.unwrap();
    }
}

struct AppState {
    // pub rx: AsyncMutex<Receiver<notify::Result<notify::Event>>>,
    pub watcher: AsyncMutex<ReadDirectoryChangesWatcher>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = mpsc::channel::<notify::Result<Event>>();
    let r1 = notify::recommended_watcher(tx);
    if r1.is_err() {
        println!("failed {:?}", r1.unwrap());
        return;
    }
    let mut watcher = r1.unwrap();

    let state = AppState {
        // rx: AsyncMutex::new(rx),
        // window: AsyncMutex<>
        watcher: AsyncMutex::new(watcher),
    };

    let app = tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            play_sound,
            watch_folder,
            cancel_watch_folder,
            fetch_file_profile
        ])
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap().clone();
            thread::spawn(move || {
                // let state = window.app_handle().state::<AppState>();
                // let state = app.state::<AppState>();
                // let rx = state.rx.lock().await;
                for res in rx {
                    match res {
                        Ok(event) => {
                            println!("event: {:?} and {:?}", event.kind, event.paths);
                            play_sound();
                            let data = FileChangeEventPayload {
                                change_type: String::from("ttt"),
                                paths: event
                                    .paths
                                    .into_iter()
                                    .map(|v| {
                                        return v;
                                    })
                                    .collect(),
                            };
                            window.emit("data", data).unwrap();
                        }
                        Err(e) => println!("watch error: {:?}", e),
                    }
                }
            });
            //
            Ok(())
        })
        .on_page_load(move |window, _| {})
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, _event| match &_event {
        tauri::RunEvent::WindowEvent {
            event: tauri::WindowEvent::CloseRequested { api, .. },
            label,
            ..
        } => {
            println!("closing window");
        }
        _ => (),
    });
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn play_sound() -> String {
    let (_stream, stream_handle) = OutputStream::try_default().unwrap();
    let sound_path = "/Users/litao/Documents/workspace/file-watch/notify.mp3";
    let file = BufReader::new(File::open(sound_path).unwrap());
    let source = Decoder::new(file).unwrap();
    let _ = stream_handle.play_raw(source.convert_samples());
    std::thread::sleep(std::time::Duration::from_secs(2));
    return format!("ok");
}

#[tauri::command]
async fn watch_folder(path_to_watch: String, state: State<'_, AppState>) -> Result<String, ()> {
    let mut watcher = state.watcher.lock().await;
    let r2 = watcher.watch(Path::new(path_to_watch.as_str()), RecursiveMode::Recursive);
    if r2.is_err() {
        let resp: BizResponse = BizResponse::new(101, "watch failed", "");
        // return;
        return Ok(resp.to_str());
    }
    let resp: BizResponse = BizResponse::new(0, "", "");
    return Ok(resp.to_str());
}

#[tauri::command]
async fn cancel_watch_folder(
    path_to_watch: String,
    state: State<'_, AppState>,
) -> Result<String, ()> {
    let mut watcher = state.watcher.lock().await;
    let r2 = watcher.unwatch(Path::new(path_to_watch.as_str()));
    if r2.is_err() {
        let resp: BizResponse = BizResponse::new(101, "unwatch failed", "");
        return Ok(resp.to_str());
    }
    let resp: BizResponse = BizResponse::new(0, "", "");
    return Ok(resp.to_str());
}

#[tauri::command]
fn fetch_file_profile(path: String, state: State<'_, AppState>) -> Result<String, ()> {
    let r0 = PathBuf::from_str(path.as_str());
    if r0.is_err() {
        let resp: BizResponse = BizResponse::new(101, "build path failed", "");
        return Ok(resp.to_str());
    }
    let path = r0.unwrap();
    if !path.exists() {
        let resp: BizResponse = BizResponse::new(101, "file not existing", "");
        return Ok(resp.to_str());
    }
    let r1 = fs::metadata(path);
    if r1.is_err() {
        let resp: BizResponse = BizResponse::new(101, "read meta failed", "");
        return Ok(resp.to_str());
    }
    let metadata = r1.unwrap();
    let file_type = if metadata.is_dir() {
        "Directory".to_string()
    } else if metadata.is_file() {
        "File".to_string()
    } else {
        "Other".to_string()
    };
    let data = FileProfileResp {
        file_type: file_type,
    };
    let resp = BizResponse::new(0, "", &data.to_str());
    return Ok(resp.to_str());
}
