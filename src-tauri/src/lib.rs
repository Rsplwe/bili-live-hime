mod commands;
mod connection;
mod utils;

use crate::commands::{comment_connect, comment_disconnect, comment_is_connected};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct ConnectionState {
    handle: Option<tokio::task::JoinHandle<()>>,
}

pub type AppState = Arc<Mutex<ConnectionState>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new(Mutex::new(ConnectionState { handle: None })))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            comment_connect,
            comment_disconnect,
            comment_is_connected
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
