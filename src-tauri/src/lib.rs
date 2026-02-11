use tauri::command;
use std::io::Read;

#[command]
async fn brotli_decode(data: Vec<u8>) -> Result<Vec<u8>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut decompressed = Vec::new();
        let mut reader = brotli::Decompressor::new(&data[..], 4096);
        
         reader
            .read_to_end(&mut decompressed)
            .map_err(|e| e.to_string())?;

        Ok(decompressed)
    })
    .await
    .map_err(|e| e.to_string())?
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![brotli_decode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
