use crate::core::skills::workspace_root_display;

#[derive(Debug, Clone)]
pub struct AppState {
    pub workspace_root: String,
    pub supported_apps: Vec<String>,
    pub sync_modes: Vec<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            workspace_root: workspace_root_display(),
            supported_apps: vec![
                String::from("claude"),
                String::from("codex"),
                String::from("gemini"),
                String::from("opencode"),
                String::from("openclaw"),
            ],
            sync_modes: vec![
                String::from("auto"),
                String::from("symlink"),
                String::from("copy"),
            ],
        }
    }
}
