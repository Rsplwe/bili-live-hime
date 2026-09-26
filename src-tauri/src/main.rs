// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
fn configure_fcitx5_gtk_input_method() {
    use std::{env, fs};

    // AppImage replaces the system GTK cache with a bundled one. Select Fcitx
    // only when that cache contains the matching GTK3 module.
    let is_fcitx_session = env::var("XMODIFIERS")
        .map(|value| value.split('@').any(|modifier| modifier == "im=fcitx"))
        .unwrap_or(false);
    let bundled_fcitx5_module = env::var_os("GTK_IM_MODULE_FILE")
        .and_then(|cache_path| fs::read_to_string(cache_path).ok())
        .is_some_and(|cache| cache.contains("im-fcitx5.so"));

    if is_fcitx_session && bundled_fcitx5_module {
        env::set_var("GTK_IM_MODULE", "fcitx");
    }
}

fn main() {
    #[cfg(target_os = "linux")]
    configure_fcitx5_gtk_input_method();

    bili_live_hime_lib::run()
}
