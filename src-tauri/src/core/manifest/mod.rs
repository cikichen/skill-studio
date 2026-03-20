use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillManifest {
    #[serde(default = "default_schema_version")]
    pub schema_version: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub display_name: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub license: Option<String>,
    #[serde(default)]
    pub keywords: Vec<String>,
    pub source: SkillSource,
    pub entry: SkillEntry,
    #[serde(default)]
    pub compatibility: SkillCompatibility,
    #[serde(default)]
    pub activation: SkillActivation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillSource {
    pub kind: String,
    pub url: Option<String>,
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillEntry {
    pub path: String,
    #[serde(default = "default_runner")]
    pub runner: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillCompatibility {
    #[serde(default)]
    pub apps: Vec<String>,
    #[serde(default)]
    pub platforms: Vec<String>,
    pub min_app_version: Option<String>,
    pub max_app_version: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillActivation {
    #[serde(default)]
    pub default_enabled: bool,
    #[serde(default)]
    pub requires_restart: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestValidationResult {
    pub valid: bool,
    pub manifest: Option<SkillManifest>,
    pub errors: Vec<String>,
}

impl SkillManifest {
    pub fn parse_json(content: &str) -> Result<Self, String> {
        serde_json::from_str::<Self>(content).map_err(|error| error.to_string())
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();

        if self.schema_version.trim().is_empty() {
            errors.push(String::from("schemaVersion is required"));
        }

        if self.name.trim().is_empty() {
            errors.push(String::from("name is required"));
        }

        if self.version.trim().is_empty() {
            errors.push(String::from("version is required"));
        }

        if self.source.kind.trim().is_empty() {
            errors.push(String::from("source.kind is required"));
        }

        if self.entry.path.trim().is_empty() {
            errors.push(String::from("entry.path is required"));
        }

        if self.entry.runner.trim().is_empty() {
            errors.push(String::from("entry.runner is required"));
        }

        if self.compatibility.apps.is_empty() {
            errors.push(String::from("compatibility.apps must contain at least one target app"));
        }

        errors
    }
}

pub fn validate_manifest_content(content: &str) -> ManifestValidationResult {
    match SkillManifest::parse_json(content) {
        Ok(manifest) => {
            let errors = manifest.validate();
            ManifestValidationResult {
                valid: errors.is_empty(),
                manifest: Some(manifest),
                errors,
            }
        }
        Err(error) => ManifestValidationResult {
            valid: false,
            manifest: None,
            errors: vec![format!("Invalid skill.json: {error}")],
        },
    }
}

fn default_schema_version() -> String {
    String::from("1.0")
}

fn default_runner() -> String {
    String::from("markdown")
}
