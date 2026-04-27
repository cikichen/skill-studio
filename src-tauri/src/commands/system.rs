use serde::Serialize;
use std::env;
use std::path::{Path, PathBuf};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedApp {
    app_id: String,
    installed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    location: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppOverview {
    app_name: String,
    version: String,
    workspace_root: String,
    supported_apps: Vec<String>,
    detected_apps: Vec<DetectedApp>,
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
        detected_apps: detect_apps(),
        sync_modes: state.sync_modes.clone(),
    }
}

fn detect_apps() -> Vec<DetectedApp> {
    [
        detect_claude_app(),
        detect_cli_app("codex", &["codex"]),
        detect_cli_app("gemini", &["gemini"]),
        detect_cli_app("opencode", &["opencode"]),
        detect_cli_app("openclaw", &["openclaw"]),
    ]
    .into_iter()
    .collect()
}

fn detect_claude_app() -> DetectedApp {
    let home_dir = env::var_os("HOME").map(PathBuf::from);
    let candidates = [
        Some(PathBuf::from("/Applications/Claude.app")),
        Some(PathBuf::from("/Applications/Claude Desktop.app")),
        home_dir.as_ref().map(|home| home.join("Applications/Claude.app")),
        home_dir
            .as_ref()
            .map(|home| home.join("Applications/Claude Desktop.app")),
    ];

    for candidate in candidates.into_iter().flatten() {
        if candidate.exists() {
            return DetectedApp {
                app_id: String::from("claude"),
                installed: true,
                location: Some(candidate.display().to_string()),
            };
        }
    }

    detect_cli_app("claude", &["claude"])
}

fn detect_cli_app(app_id: &str, command_names: &[&str]) -> DetectedApp {
    for command_name in command_names {
        if let Some(path) = find_command_in_path(command_name) {
            return DetectedApp {
                app_id: app_id.to_string(),
                installed: true,
                location: Some(path.display().to_string()),
            };
        }
    }

    DetectedApp {
        app_id: app_id.to_string(),
        installed: false,
        location: None,
    }
}

fn find_command_in_path(command_name: &str) -> Option<PathBuf> {
    let path_value = env::var_os("PATH")?;

    env::split_paths(&path_value)
        .map(|directory| directory.join(command_name))
        .find(|candidate| is_executable(candidate))
}

fn is_executable(path: &Path) -> bool {
    path.is_file()
}
