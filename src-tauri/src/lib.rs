use std::borrow::Cow;
use std::io::{self, BufReader, Cursor, Read};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::mpsc::{self, Receiver};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::{fs, fs::File, thread};

use include_dir::{include_dir, Dir};
use notify::event::{
    AccessKind, AccessMode, CreateKind, DataChange, ModifyKind, RemoveKind, RenameMode,
};
use notify::{
    recommended_watcher, Event, EventKind, ReadDirectoryChangesWatcher, RecursiveMode, Watcher,
};
use once_cell::sync::Lazy;
use rodio::OutputStreamHandle;
use rodio::{source::Source, Decoder, OutputStream, Sink};
use rust_embed::Embed;
use serde::{Deserialize, Serialize};
use serde_json::{json, Deserializer, Serializer, Value};
use tauri::async_runtime::Mutex as AsyncMutex;
use tauri::path::BaseDirectory;
#[allow(unused)]
use tauri::{
    App, AppHandle, Context, Emitter, Listener, Manager, RunEvent, Runtime, State, WebviewUrl,
};

// #[derive(Embed)]
// #[folder = "assets/"]
// struct Asset;

static Assets: Dir = include_dir!("./assets");

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

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

static SOUND_PATH: &str = "/Users/litao/Documents/workspace/file-watch/notify.mp3";
// static AUDIO_PLAYER: Lazy<Arc<AudioPlayer>> = Lazy::new(|| Arc::new(AudioPlayer::new(SOUND_PATH)));

// struct AudioPlayer {
//     stream: OutputStream,
//     handle: OutputStreamHandle,
//     sink: Sink,
//     source: Arc<Mutex<Decoder<BufReader<File>>>>,
// }

// impl AudioPlayer {
//     fn new(path: &str) -> Self {
//         // let (stream, handle) = OutputStream::try_default().unwrap();
//         let file = File::open(path).unwrap();
//         let source = Arc::new(Mutex::new(Decoder::new(BufReader::new(file)).unwrap()));
//         let sink = Sink::try_new(&handle).unwrap();

//         AudioPlayer {
//             stream,
//             handle,
//             sink,
//             source,
//         }
//     }
//     fn play_sound(&self) {
//         let source = Arc::clone(&self.source);
//         let stream_handle = self.handle;
//         thread::spawn(move || {
//             let decoder = source.lock().unwrap();
//             let source = decoder; // Clone the decoder (if necessary)
//             let _ = stream_handle.play_raw(source.convert_samples());
//             std::thread::sleep(std::time::Duration::from_secs(2));
//             // stream_handle.append(source.convert_samples());
//             // stream_handle.sleep_until_end(); // Wait until sound is done playing
//         });
//     }
// }

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
            watch_folder,
            cancel_watch_folder,
            fetch_file_profile
        ])
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap().clone();
            // let file = Asset::get("notify.mp3").unwrap();
            // let f = file.data;
            // let sound_path = app
            //     .path()
            //     .resolve("assets/notify.mp3", BaseDirectory::Resource)?;
            thread::spawn(move || {
                for res in rx {
                    match res {
                        Ok(event) => {
                            // println!("event: {:?} and {:?}", event.kind, event.paths);
                            let paths = event.paths;
                            let data = FileChangeEventPayload {
                                change_type: format!(
                                    "{}",
                                    (|| {
                                        match event.kind {
                                            EventKind::Create(CreateKind::File) => {
                                                return "创建文件";
                                            }
                                            EventKind::Create(CreateKind::Folder) => {
                                                return "创建文件夹";
                                            }
                                            EventKind::Create(CreateKind::Any) => {
                                                play_sound();
                                                return "创建文件/文件夹";
                                            }
                                            EventKind::Create(CreateKind::Other) => {
                                                return "创建文件/文件夹2";
                                            }
                                            EventKind::Access(AccessKind::Open(
                                                AccessMode::Any,
                                            )) => {
                                                return "打开文件";
                                            }
                                            EventKind::Modify(ModifyKind::Name(RenameMode::To)) => {
                                                play_sound();
                                                return "修改文件名称";
                                            }
                                            EventKind::Modify(ModifyKind::Name(
                                                RenameMode::From,
                                            )) => {
                                                return "";
                                            }
                                            EventKind::Modify(ModifyKind::Data(
                                                DataChange::Content,
                                            )) => {
                                                return "修改文件内容";
                                            }
                                            EventKind::Modify(ModifyKind::Any) => {
                                                if !paths.is_empty() {
                                                    let path = &paths[0];
                                                    if path.is_dir() {
                                                        return "";
                                                    }
                                                    play_sound();
                                                    return "修改文件";
                                                }
                                                return "";
                                            }
                                            EventKind::Remove(RemoveKind::File) => {
                                                return "删除文件";
                                            }
                                            EventKind::Remove(RemoveKind::Folder) => {
                                                return "删除文件夹";
                                            }
                                            EventKind::Remove(RemoveKind::Any) => {
                                                play_sound();
                                                return "删除文件/文件夹";
                                            }
                                            any => return "",
                                        }
                                    })()
                                ),
                                paths: paths
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
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, _event| match &_event {
        tauri::RunEvent::WindowEvent {
            event: tauri::WindowEvent::CloseRequested { api, .. },
            label,
            ..
        } => {}
        _ => (),
    });
}

fn play_sound() {
    thread::spawn(move || {
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        // let file = Assets.get_file("notify.mp3").unwrap().contents();
        // let file = BufReader::new(File::open(sound_path).unwrap());
        // let reader = BufReader::new(file);
        // let source = Decoder::new(reader).unwrap();
        let sound_data = include_bytes!("../assets/notify.mp3");
        let source = Decoder::new_mp3(Cursor::new(&sound_data[..])).unwrap();
        let _ = stream_handle.play_raw(source.convert_samples());
        std::thread::sleep(std::time::Duration::from_secs(2));
    });
}

#[tauri::command]
async fn watch_folder(path_to_watch: String, state: State<'_, AppState>) -> Result<String, Error> {
    let mut watcher = state.watcher.lock().await;
    let r2 = watcher.watch(Path::new(path_to_watch.as_str()), RecursiveMode::Recursive);
    if r2.is_err() {
        // let resp: BizResponse = BizResponse::new(101, "watch failed", "");
        // return Ok(resp.to_str());
        return Ok(json!({
            "code": 101,
            "msg": "watch failed",
            "data": "",
        })
        .to_string());
    }
    // let resp: BizResponse = BizResponse::new(0, "", "");
    // return Ok(resp.to_str());
    return Ok(json!({
        "code": 0,
        "msg": "",
        "data": "",
    })
    .to_string());
}

#[tauri::command]
async fn cancel_watch_folder(
    path_to_watch: String,
    state: State<'_, AppState>,
) -> Result<String, Error> {
    let mut watcher = state.watcher.lock().await;
    let r2 = watcher.unwatch(Path::new(path_to_watch.as_str()));
    if r2.is_err() {
        // let resp: BizResponse = BizResponse::new(101, "unwatch failed", "");
        // return Ok(resp.to_str());
        return Ok(json!({
            "code": 101,
            "msg": "unwatch failed",
            "data": "",
        })
        .to_string());
    }
    // let resp: BizResponse = BizResponse::new(0, "", "");
    return Ok(json!({
        "code": 0,
        "msg": "",
        "data": "",
    })
    .to_string());
}

#[tauri::command]
fn fetch_file_profile(
    path: String,
    state: State<'_, AppState>,
) -> Result<std::string::String, Error> {
    let r0 = PathBuf::from_str(path.as_str());
    if r0.is_err() {
        // let resp: BizResponse = BizResponse::new(101, "build path failed", "");
        // return Ok(resp.to_str());
        return Ok(json!({
            "code": 101,
            "msg": "build path failed",
            "data": None::<String>,
        })
        .to_string());
    }
    let path = r0.unwrap();
    if !path.exists() {
        // let resp: BizResponse = BizResponse::new(101, "file not existing", "");
        // return Ok(resp.to_str());
        return Ok(json!({
            "code": 101,
            "msg": "file not existing",
            "data": None::<String>,
        })
        .to_string());
    }
    let r1 = fs::metadata(path);
    if r1.is_err() {
        // let resp: BizResponse = BizResponse::new(101, "read meta failed", "");
        // return Ok(resp.to_str());
        return Ok(json!({
            "code": 101,
            "msg": "read meta failed",
            "data": None::<String>,
        })
        .to_string());
    }
    let metadata = r1.unwrap();
    let file_type = if metadata.is_dir() {
        "Directory".to_string()
    } else if metadata.is_file() {
        "File".to_string()
    } else {
        "Other".to_string()
    };
    // let data = FileProfileResp {
    //     file_type: file_type,
    // };
    // let resp = BizResponse::new(0, "", &data.to_str());
    // return Ok(resp.to_str());
    return Ok(json!({
        "code": 0,
        "msg": "",
        "data": {
            "file_type": file_type,
        },
    })
    .to_string());
}
