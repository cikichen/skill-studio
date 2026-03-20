use std::fs;

use crate::core::manifest::{validate_manifest_content, ManifestValidationResult};

#[tauri::command]
pub fn validate_skill_manifest(raw_manifest: String) -> ManifestValidationResult {
    validate_manifest_content(&raw_manifest)
}

#[tauri::command]
pub fn read_skill_manifest_file(path: String) -> Result<ManifestValidationResult, String> {
    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read manifest file '{path}': {error}"))?;

    Ok(validate_manifest_content(&content))
}
