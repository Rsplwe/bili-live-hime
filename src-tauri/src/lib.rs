mod commands;
mod connection;
mod utils;

use crate::commands::{comment_connect, comment_disconnect, comment_is_connected};
use std::sync::Arc;
use tauri::{Manager, RunEvent};
use tokio::sync::Mutex;

pub struct ConnectionState {
    handle: Option<tokio::task::JoinHandle<()>>,
}

pub type AppState = Arc<Mutex<ConnectionState>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(AppState::new(Mutex::new(ConnectionState { handle: None })))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            comment_connect,
            comment_disconnect,
            comment_is_connected
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(move |_app_handle, _event| match &_event {
        RunEvent::ExitRequested { .. } => {
            let app_state = _app_handle.state::<AppState>();
            tauri::async_runtime::block_on(async {
                let mut conn_state = app_state.lock().await;
                if let Some(handle) = conn_state.handle.take() {
                    handle.abort();
                    println!("Connection task aborted");
                }
            });
        }
        _ => (),
    });
}
