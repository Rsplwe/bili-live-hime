use tauri::AppHandle;

use crate::{connection::SocketClient, AppState};

#[tauri::command]
pub async fn comment_connect(
    host: String,
    port: u16,
    uid: u64,
    room: u32,
    token: String,
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut conn_state = state.lock().await;
    if let Some(handle) = &conn_state.handle {
        if !handle.is_finished() {
            return Err("Already connected".to_string());
        }
    }
    let handle = tokio::spawn(async move {
        let client = SocketClient::new(app_handle);
        if let Err(e) = client.connection(host, port, uid, room, token).await {
            eprintln!("Connection error: {}", e);
        }
    });

    conn_state.handle = Some(handle);

    Ok("Connecting...".to_string())
}

#[tauri::command]
pub async fn comment_disconnect(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let mut conn_state = state.lock().await;

    if let Some(handle) = conn_state.handle.take() {
        handle.abort();
        Ok("Disconnected".to_string())
    } else {
        Err("Not connected".to_string())
    }
}

#[tauri::command]
pub async fn comment_is_connected(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let conn_state = state.lock().await;

    Ok(match &conn_state.handle {
        Some(handle) => !handle.is_finished(),
        None => false,
    })
}
