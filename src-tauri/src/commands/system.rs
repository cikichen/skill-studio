use serde::Serialize;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppOverview {
    app_name: String,
    version: String,
    workspace_root: String,
    supported_apps: Vec<String>,
    sync_modes: Vec<String>,
}

#[tauri::command]
pub fn ping() -> String {
    String::from("pong")
}

#[tauri::command]
pub fn get_app_overview(state: State<'_, AppState>) -> AppOverview {
    AppOverview {
        app_name: String::from("Skill Studio"),
        version: env!("CARGO_PKG_VERSION").to_string(),
        workspace_root: state.workspace_root.clone(),
        supported_apps: state.supported_apps.clone(),
        sync_modes: state.sync_modes.clone(),
    }
}
