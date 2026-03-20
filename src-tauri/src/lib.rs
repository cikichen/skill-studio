mod commands;
mod core;
mod state;

use commands::{
  manifest::{read_skill_manifest_file, validate_skill_manifest},
  system::{get_app_overview, ping},
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(AppState::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      ping,
      get_app_overview,
      validate_skill_manifest,
      read_skill_manifest_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
