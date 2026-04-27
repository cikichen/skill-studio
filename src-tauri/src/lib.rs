mod commands;
mod core;
mod state;

use commands::{
  manifest::{read_skill_manifest_file, validate_skill_manifest},
  skills::{
    add_skill_repo, delete_skill_backup, discover_available_skills, get_installed_skills,
    get_skill_backups, get_skill_detail, get_skill_repos, import_skills_from_apps,
    install_skill_unified, install_skills_from_zip, remove_skill_repo, restore_skill_backup,
    scan_unmanaged_skills, toggle_skill_app, uninstall_skill_unified,
  },
  system::{get_app_overview, ping},
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
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
      read_skill_manifest_file,
      get_installed_skills,
      get_skill_backups,
      get_skill_detail,
      get_skill_repos,
      discover_available_skills,
      add_skill_repo,
      remove_skill_repo,
      install_skill_unified,
      uninstall_skill_unified,
      delete_skill_backup,
      restore_skill_backup,
      toggle_skill_app,
      scan_unmanaged_skills,
      import_skills_from_apps,
      install_skills_from_zip
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
