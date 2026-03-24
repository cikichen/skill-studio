use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Cursor, Read};
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const DEFAULT_REPOS: [(&str, &str, &str); 2] = [
    ("anthropics", "skills", "main"),
    ("ComposioHQ", "awesome-claude-skills", "master"),
];
const MAX_BACKUPS: usize = 20;
const APP_IDS: [&str; 5] = ["claude", "codex", "gemini", "opencode", "openclaw"];

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SkillApps {
    pub claude: bool,
    pub codex: bool,
    pub gemini: bool,
    pub opencode: bool,
    pub openclaw: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledSkill {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub directory: String,
    pub repo_owner: Option<String>,
    pub repo_name: Option<String>,
    pub repo_branch: Option<String>,
    pub readme_url: Option<String>,
    pub apps: SkillApps,
    pub installed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillUninstallResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backup_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillBackupEntry {
    pub backup_id: String,
    pub backup_path: String,
    pub created_at: i64,
    pub skill: InstalledSkill,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoverableSkill {
    pub key: String,
    pub name: String,
    pub description: String,
    pub directory: String,
    pub readme_url: Option<String>,
    pub repo_owner: String,
    pub repo_name: String,
    pub repo_branch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRepo {
    pub owner: String,
    pub name: String,
    pub branch: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnmanagedSkill {
    pub directory: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub found_in: Vec<String>,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSkillSelection {
    pub directory: String,
    pub apps: SkillApps,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SkillBackupMetadata {
    skill: InstalledSkill,
    backup_created_at: i64,
    #[serde(default)]
    source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SkillMetadata {
    name: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SkillsStore {
    repos: Vec<SkillRepo>,
    installed: Vec<InstalledSkill>,
}

impl Default for SkillsStore {
    fn default() -> Self {
        Self {
            repos: DEFAULT_REPOS
                .into_iter()
                .map(|(owner, name, branch)| SkillRepo {
                    owner: owner.to_string(),
                    name: name.to_string(),
                    branch: branch.to_string(),
                    enabled: true,
                })
                .collect(),
            installed: Vec::new(),
        }
    }
}

pub fn workspace_root_display() -> String {
    skills_workspace_dir().display().to_string()
}

pub fn get_installed_skills() -> Result<Vec<InstalledSkill>, String> {
    let mut installed = load_store()?.installed;
    installed.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(installed)
}

pub fn get_skill_backups() -> Result<Vec<SkillBackupEntry>, String> {
    list_backup_entries()
}

pub fn get_skill_repos() -> Result<Vec<SkillRepo>, String> {
    Ok(load_store()?.repos)
}

pub fn add_skill_repo(repo: SkillRepo) -> Result<bool, String> {
    let mut store = load_store()?;

    let exists = store.repos.iter().any(|current| {
        current.owner.eq_ignore_ascii_case(&repo.owner)
            && current.name.eq_ignore_ascii_case(&repo.name)
    });

    if exists {
        return Err(format!(
            "Repository already exists: {}/{}",
            repo.owner, repo.name
        ));
    }

    store.repos.push(repo);
    save_store(&store)?;
    Ok(true)
}

pub fn remove_skill_repo(owner: &str, name: &str) -> Result<bool, String> {
    let mut store = load_store()?;
    let initial_count = store.repos.len();

    store.repos.retain(|repo| {
        !(repo.owner.eq_ignore_ascii_case(owner) && repo.name.eq_ignore_ascii_case(name))
    });

    if store.repos.len() == initial_count {
        return Err(format!("Repository not found: {owner}/{name}"));
    }

    save_store(&store)?;
    Ok(true)
}

pub fn install_skill_unified(
    skill: DiscoverableSkill,
    current_app: &str,
) -> Result<InstalledSkill, String> {
    let mut store = load_store()?;
    let source_relative = sanitize_skill_source_path(&skill.directory)?;
    let install_directory = install_directory_from_relative_path(&source_relative, &skill.directory)?;

    if let Some(index) = store
        .installed
        .iter()
        .position(|installed| installed_matches_discoverable(installed, &skill, &install_directory))
    {
        let mut updated = store.installed[index].clone();
        updated.name = skill.name.clone();
        updated.description = if skill.description.is_empty() {
            None
        } else {
            Some(skill.description.clone())
        };
        updated.directory = install_directory.clone();
        updated.repo_owner = Some(skill.repo_owner.clone());
        updated.repo_name = Some(skill.repo_name.clone());
        updated.repo_branch = Some(skill.repo_branch.clone());
        updated.readme_url = skill.readme_url.clone();

        let ssot_path = skills_ssot_dir()?.join(&updated.directory);
        if !ssot_path.exists() {
            let resolved_branch = download_skill_source(&skill, &source_relative, &install_directory, true)?;
            updated.repo_branch = Some(resolved_branch);
        }

        set_app_enabled(&mut updated.apps, current_app, true)?;
        materialize_skill_files(&updated)?;
        sync_to_app_dir(&updated.directory, current_app)?;

        store.installed[index] = updated.clone();
        save_store(&store)?;
        return Ok(updated);
    }

    if store
        .installed
        .iter()
        .any(|installed| installed.directory.eq_ignore_ascii_case(&install_directory))
    {
        return Err(format!(
            "Skill already exists, uninstall current version first: {}",
            install_directory
        ));
    }

    let resolved_branch = download_skill_source(&skill, &source_relative, &install_directory, true)?;
    let readme_url = Some(build_skill_doc_url(
        &skill.repo_owner,
        &skill.repo_name,
        &resolved_branch,
        &extract_doc_path_from_url(skill.readme_url.as_deref()).unwrap_or_else(|| {
            format!("{}/SKILL.md", skill.directory.trim_end_matches('/'))
        }),
    ));

    let installed_skill = InstalledSkill {
        id: skill.key.clone(),
        name: skill.name.clone(),
        description: if skill.description.is_empty() {
            None
        } else {
            Some(skill.description.clone())
        },
        directory: install_directory.clone(),
        repo_owner: Some(skill.repo_owner.clone()),
        repo_name: Some(skill.repo_name.clone()),
        repo_branch: Some(resolved_branch),
        readme_url,
        apps: apps_for_install(current_app)?,
        installed_at: current_unix_timestamp(),
    };

    materialize_skill_files(&installed_skill)?;
    sync_to_app_dir(&installed_skill.directory, current_app)?;

    store.installed.push(installed_skill.clone());
    store
        .installed
        .sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    save_store(&store)?;

    Ok(installed_skill)
}

pub fn uninstall_skill_unified(id: &str) -> Result<SkillUninstallResult, String> {
    let mut store = load_store()?;
    let index = store
        .installed
        .iter()
        .position(|skill| installed_skill_matches_id(skill, id))
        .ok_or_else(|| format!("Installed skill not found: {id}"))?;

    let skill = store.installed[index].clone();
    let backup_path = create_uninstall_backup(&skill)?;

    for app in APP_IDS {
        let _ = remove_from_app(&skill.directory, app);
    }

    let ssot_path = skills_ssot_dir()?.join(&skill.directory);
    if ssot_path.exists() || is_symlink(&ssot_path) {
        remove_path(&ssot_path)?;
    }

    store.installed.remove(index);
    save_store(&store)?;

    Ok(SkillUninstallResult {
        backup_path: backup_path.map(|path| path.display().to_string()),
    })
}

pub fn delete_skill_backup(backup_id: &str) -> Result<bool, String> {
    let backup_path = backup_path_for_id(backup_id)?;
    if !backup_path.exists() {
        return Err(format!("Skill backup not found: {backup_id}"));
    }

    fs::remove_dir_all(&backup_path)
        .map_err(|error| format!("Failed to delete backup {}: {error}", backup_path.display()))?;
    Ok(true)
}

pub fn restore_skill_backup(backup_id: &str, current_app: &str) -> Result<InstalledSkill, String> {
    let backup_path = backup_path_for_id(backup_id)?;
    let metadata = read_backup_metadata(&backup_path)?;
    let backup_skill_dir = backup_path.join("skill");
    let backup_skill_md = backup_skill_dir.join("SKILL.md");
    if !backup_skill_md.exists() {
        return Err(format!(
            "Skill backup is invalid or missing SKILL.md: {}",
            backup_path.display()
        ));
    }

    let mut store = load_store()?;
    if store.installed.iter().any(|skill| {
        installed_skill_matches_id(skill, &metadata.skill.id)
            || skill.directory.eq_ignore_ascii_case(&metadata.skill.directory)
    }) {
        return Err(format!(
            "Skill already exists, uninstall current version first: {}",
            metadata.skill.directory
        ));
    }

    let mut restored_skill = metadata.skill;
    restored_skill.installed_at = current_unix_timestamp();
    restored_skill.apps = apps_for_install(current_app)?;

    let restore_path = skills_ssot_dir()?.join(&restored_skill.directory);
    if restore_path.exists() || is_symlink(&restore_path) {
        return Err(format!("Restore target already exists: {}", restore_path.display()));
    }

    copy_dir_recursive(&backup_skill_dir, &restore_path)?;
    materialize_skill_files(&restored_skill)?;
    if let Err(error) = sync_to_app_dir(&restored_skill.directory, current_app) {
        let _ = fs::remove_dir_all(&restore_path);
        return Err(error);
    }

    store.installed.push(restored_skill.clone());
    store
        .installed
        .sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    save_store(&store)?;

    Ok(restored_skill)
}

pub fn toggle_skill_app(id: &str, app: &str, enabled: bool) -> Result<bool, String> {
    let mut store = load_store()?;
    let index = store
        .installed
        .iter()
        .position(|skill| installed_skill_matches_id(skill, id))
        .ok_or_else(|| format!("Installed skill not found: {id}"))?;

    let mut skill = store.installed[index].clone();
    if enabled {
        materialize_skill_files(&skill)?;
        sync_to_app_dir(&skill.directory, app)?;
    } else {
        remove_from_app(&skill.directory, app)?;
    }

    set_app_enabled(&mut skill.apps, app, enabled)?;
    store.installed[index] = skill;
    save_store(&store)?;
    Ok(true)
}

pub fn scan_unmanaged_skills() -> Result<Vec<UnmanagedSkill>, String> {
    let managed_dirs = load_store()?
        .installed
        .into_iter()
        .map(|skill| skill.directory.to_lowercase())
        .collect::<std::collections::HashSet<_>>();

    let mut scan_sources = Vec::new();
    scan_sources.push((skills_ssot_dir()?, String::from("skill-studio")));
    if let Ok(dir) = cc_switch_ssot_dir() {
        scan_sources.push((dir, String::from("cc-switch")));
    }
    for app in APP_IDS {
        if let Ok(dir) = app_skills_dir(app) {
            scan_sources.push((dir, app.to_string()));
        }
    }

    let mut unmanaged = std::collections::HashMap::<String, UnmanagedSkill>::new();

    for (scan_dir, label) in scan_sources {
        let entries = match fs::read_dir(&scan_dir) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for entry_result in entries {
            let entry = match entry_result {
                Ok(entry) => entry,
                Err(_) => continue,
            };
            let path = entry.path();
            if !(path.is_dir() || is_symlink(&path)) {
                continue;
            }

            let directory = entry.file_name().to_string_lossy().to_string();
            if directory.starts_with('.') || managed_dirs.contains(&directory.to_lowercase()) {
                continue;
            }

            let skill_md = path.join("SKILL.md");
            if !skill_md.exists() {
                continue;
            }

            let (name, description) = read_skill_name_desc(&skill_md, &directory);
            unmanaged
                .entry(directory.to_lowercase())
                .and_modify(|skill| {
                    if !skill.found_in.iter().any(|item| item.eq_ignore_ascii_case(&label)) {
                        skill.found_in.push(label.clone());
                    }
                })
                .or_insert(UnmanagedSkill {
                    directory,
                    name,
                    description,
                    found_in: vec![label.clone()],
                    path: path.display().to_string(),
                });
        }
    }

    let mut unmanaged = unmanaged.into_values().collect::<Vec<_>>();
    unmanaged.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(unmanaged)
}

pub fn import_skills_from_apps(
    imports: Vec<ImportSkillSelection>,
) -> Result<Vec<InstalledSkill>, String> {
    let mut store = load_store()?;
    let ssot_dir = skills_ssot_dir()?;
    let mut search_sources = vec![ssot_dir.clone()];
    if let Ok(dir) = cc_switch_ssot_dir() {
        search_sources.push(dir);
    }
    for app in APP_IDS {
        if let Ok(dir) = app_skills_dir(app) {
            search_sources.push(dir);
        }
    }

    let mut imported = Vec::new();

    for selection in imports {
        let directory = sanitize_install_name(&selection.directory)
            .ok_or_else(|| format!("Invalid skill directory: {}", selection.directory))?;

        if store
            .installed
            .iter()
            .any(|skill| skill.directory.eq_ignore_ascii_case(&directory))
        {
            continue;
        }

        let source_path = search_sources
            .iter()
            .map(|base| base.join(&directory))
            .find(|candidate| candidate.join("SKILL.md").exists())
            .ok_or_else(|| format!("Skill directory not found in import sources: {directory}"))?;

        let destination = ssot_dir.join(&directory);
        if !destination.exists() && !is_symlink(&destination) {
            copy_dir_recursive(&source_path, &destination)?;
        }

        let skill_md = destination.join("SKILL.md");
        let (name, description) = read_skill_name_desc(&skill_md, &directory);
        let skill = InstalledSkill {
            id: format!("local:{directory}"),
            name,
            description,
            directory: directory.clone(),
            repo_owner: None,
            repo_name: None,
            repo_branch: None,
            readme_url: None,
            apps: selection.apps,
            installed_at: current_unix_timestamp(),
        };

        materialize_skill_files(&skill)?;
        for app in APP_IDS {
            if is_app_enabled(&skill.apps, app) {
                sync_to_app_dir(&skill.directory, app)?;
            } else {
                let _ = remove_from_app(&skill.directory, app);
            }
        }

        store.installed.push(skill.clone());
        imported.push(skill);
    }

    if !imported.is_empty() {
        store
            .installed
            .sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
        save_store(&store)?;
    }

    Ok(imported)
}

pub fn install_skills_from_zip(
    file_path: &str,
    current_app: &str,
) -> Result<Vec<InstalledSkill>, String> {
    let zip_path = Path::new(file_path);
    let temp_dir = extract_local_zip(zip_path)?;
    let skill_dirs = scan_skills_in_dir(&temp_dir)?;

    if skill_dirs.is_empty() {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!(
            "No skills with SKILL.md were found in ZIP file: {}",
            zip_path.display()
        ));
    }

    let mut store = load_store()?;
    let ssot_dir = skills_ssot_dir()?;
    let zip_stem = zip_path
        .file_stem()
        .and_then(|name| name.to_str())
        .map(|name| name.to_string());
    let mut installed = Vec::new();

    for skill_dir in skill_dirs {
        let skill_md = skill_dir.join("SKILL.md");
        let meta = parse_skill_metadata(&skill_md).ok();
        let dir_name = skill_dir
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .unwrap_or_default();

        let install_name = if skill_dir == temp_dir || dir_name.is_empty() || dir_name.starts_with('.') {
            meta.as_ref()
                .and_then(|item| item.name.as_deref())
                .and_then(sanitize_install_name)
                .or_else(|| zip_stem.as_deref().and_then(sanitize_install_name))
        } else {
            sanitize_install_name(&dir_name)
                .or_else(|| meta.as_ref().and_then(|item| item.name.as_deref()).and_then(sanitize_install_name))
                .or_else(|| zip_stem.as_deref().and_then(sanitize_install_name))
        }
        .ok_or_else(|| format!("Invalid skill directory: {}", zip_path.display()))?;

        if store
            .installed
            .iter()
            .any(|skill| skill.directory.eq_ignore_ascii_case(&install_name))
        {
            continue;
        }

        let destination = ssot_dir.join(&install_name);
        if destination.exists() || is_symlink(&destination) {
            remove_path(&destination)?;
        }
        copy_dir_recursive(&skill_dir, &destination)?;

        let skill = InstalledSkill {
            id: format!("local:{install_name}"),
            name: meta
                .as_ref()
                .and_then(|item| item.name.clone())
                .unwrap_or_else(|| install_name.clone()),
            description: meta.and_then(|item| item.description),
            directory: install_name.clone(),
            repo_owner: None,
            repo_name: None,
            repo_branch: None,
            readme_url: None,
            apps: apps_for_install(current_app)?,
            installed_at: current_unix_timestamp(),
        };

        materialize_skill_files(&skill)?;
        sync_to_app_dir(&skill.directory, current_app)?;
        store.installed.push(skill.clone());
        installed.push(skill);
    }

    let _ = fs::remove_dir_all(&temp_dir);

    if installed.is_empty() {
        return Err(format!(
            "No importable skills found in ZIP file: {}",
            zip_path.display()
        ));
    }

    store
        .installed
        .sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    save_store(&store)?;

    Ok(installed)
}

pub fn discover_available_skills() -> Result<Vec<DiscoverableSkill>, String> {
    let store = load_store()?;
    let mut skills = Vec::new();

    for repo in store.repos.iter().filter(|repo| repo.enabled) {
        match fetch_repo_skills(repo) {
            Ok(mut repo_skills) => skills.append(&mut repo_skills),
            Err(error) => log::warn!(
                "Failed to fetch skills from {}/{}: {}",
                repo.owner,
                repo.name,
                error
            ),
        }
    }

    deduplicate_discoverable_skills(&mut skills);
    skills.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(skills)
}

fn load_store() -> Result<SkillsStore, String> {
    let path = skills_store_path()?;

    if !path.exists() {
        let default_store = SkillsStore::default();
        save_store(&default_store)?;
        return Ok(default_store);
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read skills store {}: {error}", path.display()))?;

    let store = serde_json::from_str::<SkillsStore>(&content)
        .map_err(|error| format!("Failed to parse skills store {}: {error}", path.display()))?;

    for skill in &store.installed {
        materialize_skill_files(skill)?;
    }

    Ok(store)
}

fn save_store(store: &SkillsStore) -> Result<(), String> {
    let path = skills_store_path()?;
    let content = serde_json::to_string_pretty(store)
        .map_err(|error| format!("Failed to serialize skills store: {error}"))?;

    fs::write(&path, content)
        .map_err(|error| format!("Failed to write skills store {}: {error}", path.display()))
}

fn skills_store_path() -> Result<PathBuf, String> {
    let workspace_dir = skills_workspace_dir();
    fs::create_dir_all(&workspace_dir).map_err(|error| {
        format!(
            "Failed to create skill workspace {}: {error}",
            workspace_dir.display()
        )
    })?;

    Ok(workspace_dir.join("skills-store.json"))
}

fn skills_workspace_dir() -> PathBuf {
    match std::env::var_os("HOME") {
        Some(home) => PathBuf::from(home).join(".skill-studio"),
        None => PathBuf::from(".skill-studio"),
    }
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| String::from("Failed to determine HOME directory"))
}

fn skills_ssot_dir() -> Result<PathBuf, String> {
    let dir = skills_workspace_dir().join("skills");
    fs::create_dir_all(&dir)
        .map_err(|error| format!("Failed to create skills directory {}: {error}", dir.display()))?;
    Ok(dir)
}

fn cc_switch_ssot_dir() -> Result<PathBuf, String> {
    Ok(home_dir()?.join(".cc-switch").join("skills"))
}

fn skills_backup_dir() -> Result<PathBuf, String> {
    let dir = skills_workspace_dir().join("skill-backups");
    fs::create_dir_all(&dir)
        .map_err(|error| format!("Failed to create backup directory {}: {error}", dir.display()))?;
    Ok(dir)
}

fn app_skills_dir(app: &str) -> Result<PathBuf, String> {
    let home = home_dir()?;
    Ok(match app.to_ascii_lowercase().as_str() {
        "claude" => home.join(".claude").join("skills"),
        "codex" => home.join(".codex").join("skills"),
        "gemini" => home.join(".gemini").join("skills"),
        "opencode" => home.join(".config").join("opencode").join("skills"),
        "openclaw" => home.join(".openclaw").join("skills"),
        _ => return Err(format!("Unsupported app type: {app}")),
    })
}

fn current_unix_timestamp() -> i64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs() as i64,
        Err(_) => 0,
    }
}

fn build_skill_doc_url(owner: &str, repo: &str, branch: &str, doc_path: &str) -> String {
    format!("https://github.com/{owner}/{repo}/blob/{branch}/{doc_path}")
}

fn extract_doc_path_from_url(url: Option<&str>) -> Option<String> {
    let url = url?.trim();
    if url.is_empty() {
        return None;
    }

    let marker = if url.contains("/blob/") {
        "/blob/"
    } else if url.contains("/tree/") {
        "/tree/"
    } else {
        return None;
    };

    let (_, tail) = url.split_once(marker)?;
    let (_, path) = tail.split_once('/')?;
    if path.is_empty() {
        None
    } else {
        Some(path.to_string())
    }
}

fn parse_skill_metadata(path: &Path) -> Result<SkillMetadata, String> {
    let content = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read skill metadata {}: {error}", path.display()))?;
    let content = content.trim_start_matches('\u{feff}');

    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return Ok(SkillMetadata {
            name: None,
            description: None,
        });
    }

    serde_yaml::from_str::<SkillMetadata>(parts[1].trim()).map_err(|error| {
        format!(
            "Failed to parse skill metadata {}: {error}",
            path.display()
        )
    })
}

fn build_skill_from_metadata(
    skill_md: &Path,
    directory: &str,
    doc_path: &str,
    repo: &SkillRepo,
) -> Result<DiscoverableSkill, String> {
    let meta = parse_skill_metadata(skill_md)?;

    Ok(DiscoverableSkill {
        key: format!("{}/{}:{}", repo.owner, repo.name, directory),
        name: meta.name.unwrap_or_else(|| directory.to_string()),
        description: meta.description.unwrap_or_default(),
        directory: directory.to_string(),
        readme_url: Some(build_skill_doc_url(
            &repo.owner,
            &repo.name,
            &repo.branch,
            doc_path,
        )),
        repo_owner: repo.owner.clone(),
        repo_name: repo.name.clone(),
        repo_branch: repo.branch.clone(),
    })
}

fn read_skill_name_desc(skill_md: &Path, fallback_name: &str) -> (String, Option<String>) {
    match parse_skill_metadata(skill_md) {
        Ok(meta) => (
            meta.name.unwrap_or_else(|| fallback_name.to_string()),
            meta.description,
        ),
        Err(_) => (fallback_name.to_string(), None),
    }
}

fn fetch_repo_skills(repo: &SkillRepo) -> Result<Vec<DiscoverableSkill>, String> {
    let (temp_dir, resolved_branch) = download_repo(repo)?;
    let mut skills = Vec::new();
    let mut resolved_repo = repo.clone();
    resolved_repo.branch = resolved_branch;

    let result = scan_dir_recursive(&temp_dir, &temp_dir, &resolved_repo, &mut skills);
    let _ = fs::remove_dir_all(&temp_dir);
    result?;

    Ok(skills)
}

fn scan_dir_recursive(
    current_dir: &Path,
    base_dir: &Path,
    repo: &SkillRepo,
    skills: &mut Vec<DiscoverableSkill>,
) -> Result<(), String> {
    let skill_md = current_dir.join("SKILL.md");

    if skill_md.exists() {
        let directory = if current_dir == base_dir {
            repo.name.clone()
        } else {
            current_dir
                .strip_prefix(base_dir)
                .unwrap_or(current_dir)
                .to_string_lossy()
                .replace('\\', "/")
        };

        let doc_path = skill_md
            .strip_prefix(base_dir)
            .unwrap_or(skill_md.as_path())
            .to_string_lossy()
            .replace('\\', "/");

        if let Ok(skill) = build_skill_from_metadata(&skill_md, &directory, &doc_path, repo) {
            skills.push(skill);
        }

        return Ok(());
    }

    for entry in fs::read_dir(current_dir)
        .map_err(|error| format!("Failed to read directory {}: {error}", current_dir.display()))?
    {
        let entry = entry.map_err(|error| {
            format!("Failed to read directory entry {}: {error}", current_dir.display())
        })?;
        let path = entry.path();
        if path.is_dir() {
            scan_dir_recursive(&path, base_dir, repo, skills)?;
        }
    }

    Ok(())
}

fn deduplicate_discoverable_skills(skills: &mut Vec<DiscoverableSkill>) {
    let mut seen = std::collections::HashSet::new();
    skills.retain(|skill| seen.insert(skill.key.to_lowercase()));
}

fn download_skill_source(
    skill: &DiscoverableSkill,
    source_relative: &Path,
    install_directory: &str,
    replace_existing: bool,
) -> Result<String, String> {
    let repo = SkillRepo {
        owner: skill.repo_owner.clone(),
        name: skill.repo_name.clone(),
        branch: skill.repo_branch.clone(),
        enabled: true,
    };

    let ssot_dir = skills_ssot_dir()?;
    let destination = ssot_dir.join(install_directory);
    if replace_existing && (destination.exists() || is_symlink(&destination)) {
        remove_path(&destination)?;
    }

    let (temp_dir, resolved_branch) = download_repo(&repo)?;
    let copy_result = copy_relative_skill_dir(&temp_dir, source_relative, &destination, &skill.directory);
    let _ = fs::remove_dir_all(&temp_dir);
    copy_result?;

    Ok(resolved_branch)
}

fn copy_relative_skill_dir(
    temp_dir: &Path,
    source_relative: &Path,
    destination: &Path,
    raw_directory: &str,
) -> Result<(), String> {
    let source = temp_dir.join(source_relative);
    if !source.exists() {
        return Err(format!(
            "Skill directory not found in downloaded repository: {}",
            source.display()
        ));
    }

    let canonical_temp = temp_dir.canonicalize().unwrap_or_else(|_| temp_dir.to_path_buf());
    let canonical_source = source.canonicalize().map_err(|_| {
        format!(
            "Skill directory not found in downloaded repository: {}",
            source.display()
        )
    })?;

    if !canonical_source.starts_with(&canonical_temp) || !canonical_source.is_dir() {
        return Err(format!("Invalid skill directory: {raw_directory}"));
    }

    copy_dir_recursive(&canonical_source, destination)
}

fn download_repo(repo: &SkillRepo) -> Result<(PathBuf, String), String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|error| format!("Failed to create HTTP client: {error}"))?;

    let temp_dir = tempfile::tempdir().map_err(|error| format!("Failed to create temp dir: {error}"))?;
    let temp_path = temp_dir.path().to_path_buf();
    let _ = temp_dir.keep();

    let mut branches = Vec::new();
    let branch = repo.branch.trim();
    if !branch.is_empty() && !branch.eq_ignore_ascii_case("HEAD") {
        branches.push(branch.to_string());
    }
    if !branches.iter().any(|item| item.eq_ignore_ascii_case("main")) {
        branches.push(String::from("main"));
    }
    if !branches.iter().any(|item| item.eq_ignore_ascii_case("master")) {
        branches.push(String::from("master"));
    }

    let mut last_error = None;
    for branch in branches {
        let url = format!(
            "https://github.com/{}/{}/archive/refs/heads/{}.zip",
            repo.owner, repo.name, branch
        );

        match download_and_extract(&client, &url, &temp_path) {
            Ok(()) => return Ok((temp_path, branch)),
            Err(error) => {
                last_error = Some(error);
                let _ = fs::remove_dir_all(&temp_path);
                fs::create_dir_all(&temp_path).map_err(|create_error| {
                    format!(
                        "Failed to recreate temp directory {}: {create_error}",
                        temp_path.display()
                    )
                })?;
            }
        }
    }

    Err(last_error.unwrap_or_else(|| {
        format!("Failed to download repository {}/{}", repo.owner, repo.name)
    }))
}

fn download_and_extract(
    client: &reqwest::blocking::Client,
    url: &str,
    destination: &Path,
) -> Result<(), String> {
    let response = client
        .get(url)
        .send()
        .map_err(|error| format!("Failed to download {url}: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to download {url}: HTTP {}",
            response.status()
        ));
    }

    let bytes = response
        .bytes()
        .map_err(|error| format!("Failed to read download body from {url}: {error}"))?;
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes))
        .map_err(|error| format!("Failed to read ZIP archive from {url}: {error}"))?;

    if archive.is_empty() {
        return Err(format!("Downloaded ZIP archive is empty: {url}"));
    }

    let root_name = {
        let first_file = archive
            .by_index(0)
            .map_err(|error| format!("Failed to inspect ZIP archive from {url}: {error}"))?;
        let root_name = first_file
            .name()
            .split('/')
            .next()
            .unwrap_or("")
            .to_string();

        if root_name.is_empty() {
            return Err(format!("Downloaded ZIP archive has invalid root directory: {url}"));
        }

        root_name
    };

    let mut symlinks: Vec<(PathBuf, String)> = Vec::new();

    for index in 0..archive.len() {
        let mut file = archive
            .by_index(index)
            .map_err(|error| format!("Failed to read ZIP entry from {url}: {error}"))?;
        let Some(file_path) = file.enclosed_name() else {
            continue;
        };

        let Ok(relative_path) = file_path.strip_prefix(Path::new(&root_name)) else {
            continue;
        };
        if relative_path.as_os_str().is_empty() {
            continue;
        }

        let outpath = destination.join(relative_path);
        if file.is_symlink() {
            let mut target = String::new();
            file.read_to_string(&mut target)
                .map_err(|error| format!("Failed to read symlink entry from {url}: {error}"))?;
            symlinks.push((outpath, target.trim().to_string()));
        } else if file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|error| {
                format!("Failed to create extracted directory {}: {error}", outpath.display())
            })?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    format!(
                        "Failed to create extracted parent directory {}: {error}",
                        parent.display()
                    )
                })?;
            }
            let mut outfile = fs::File::create(&outpath).map_err(|error| {
                format!("Failed to create extracted file {}: {error}", outpath.display())
            })?;
            std::io::copy(&mut file, &mut outfile).map_err(|error| {
                format!("Failed to extract file {}: {error}", outpath.display())
            })?;
        }
    }

    resolve_symlinks_in_dir(destination, &symlinks)
}

fn resolve_symlinks_in_dir(base_dir: &Path, symlinks: &[(PathBuf, String)]) -> Result<(), String> {
    let canonical_base = base_dir
        .canonicalize()
        .unwrap_or_else(|_| base_dir.to_path_buf());

    for (link_path, target) in symlinks {
        let parent = link_path.parent().unwrap_or(base_dir);
        let resolved = parent.join(target);
        let resolved = match resolved.canonicalize() {
            Ok(path) => path,
            Err(_) => continue,
        };

        if !resolved.starts_with(&canonical_base) {
            continue;
        }

        if resolved.is_dir() {
            copy_dir_recursive(&resolved, link_path)?;
        } else if resolved.is_file() {
            if let Some(parent) = link_path.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    format!(
                        "Failed to create symlink target parent {}: {error}",
                        parent.display()
                    )
                })?;
            }
            fs::copy(&resolved, link_path).map_err(|error| {
                format!(
                    "Failed to materialize symlink {} from {}: {error}",
                    link_path.display(),
                    resolved.display()
                )
            })?;
        }
    }

    Ok(())
}

fn extract_local_zip(zip_path: &Path) -> Result<PathBuf, String> {
    let file = fs::File::open(zip_path)
        .map_err(|error| format!("Failed to open ZIP file {}: {error}", zip_path.display()))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|error| format!("Failed to read ZIP file {}: {error}", zip_path.display()))?;

    if archive.is_empty() {
        return Err(format!("ZIP archive is empty: {}", zip_path.display()));
    }

    let temp_dir = tempfile::tempdir().map_err(|error| format!("Failed to create temp dir: {error}"))?;
    let temp_path = temp_dir.path().to_path_buf();
    let _ = temp_dir.keep();
    let mut symlinks: Vec<(PathBuf, String)> = Vec::new();

    for index in 0..archive.len() {
        let mut file = archive
            .by_index(index)
            .map_err(|error| format!("Failed to read ZIP entry from {}: {error}", zip_path.display()))?;
        let Some(file_path) = file.enclosed_name() else {
            continue;
        };

        let outpath = temp_path.join(file_path);
        if file.is_symlink() {
            let mut target = String::new();
            file.read_to_string(&mut target).map_err(|error| {
                format!("Failed to read symlink entry from {}: {error}", zip_path.display())
            })?;
            symlinks.push((outpath, target.trim().to_string()));
        } else if file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|error| {
                format!("Failed to create extracted directory {}: {error}", outpath.display())
            })?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    format!(
                        "Failed to create extracted parent directory {}: {error}",
                        parent.display()
                    )
                })?;
            }
            let mut outfile = fs::File::create(&outpath).map_err(|error| {
                format!("Failed to create extracted file {}: {error}", outpath.display())
            })?;
            std::io::copy(&mut file, &mut outfile)
                .map_err(|error| format!("Failed to extract file {}: {error}", outpath.display()))?;
        }
    }

    resolve_symlinks_in_dir(&temp_path, &symlinks)?;
    Ok(temp_path)
}

fn scan_skills_in_dir(dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut skill_dirs = Vec::new();
    scan_skills_recursive(dir, &mut skill_dirs)?;
    Ok(skill_dirs)
}

fn scan_skills_recursive(current: &Path, results: &mut Vec<PathBuf>) -> Result<(), String> {
    let skill_md = current.join("SKILL.md");
    if skill_md.exists() {
        results.push(current.to_path_buf());
        return Ok(());
    }

    let entries = match fs::read_dir(current) {
        Ok(entries) => entries,
        Err(_) => return Ok(()),
    };

    for entry_result in entries {
        let entry = entry_result
            .map_err(|error| format!("Failed to read directory entry {}: {error}", current.display()))?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let directory = entry.file_name().to_string_lossy().to_string();
        if directory.starts_with('.') {
            continue;
        }

        scan_skills_recursive(&path, results)?;
    }

    Ok(())
}

fn apps_for_install(current_app: &str) -> Result<SkillApps, String> {
    let mut apps = SkillApps::default();
    set_app_enabled(&mut apps, current_app, true)?;
    Ok(apps)
}

fn set_app_enabled(apps: &mut SkillApps, app: &str, enabled: bool) -> Result<(), String> {
    match app.to_ascii_lowercase().as_str() {
        "claude" => apps.claude = enabled,
        "codex" => apps.codex = enabled,
        "gemini" => apps.gemini = enabled,
        "opencode" => apps.opencode = enabled,
        "openclaw" => apps.openclaw = enabled,
        _ => return Err(format!("Unsupported app type: {app}")),
    }

    Ok(())
}

fn is_app_enabled(apps: &SkillApps, app: &str) -> bool {
    match app.to_ascii_lowercase().as_str() {
        "claude" => apps.claude,
        "codex" => apps.codex,
        "gemini" => apps.gemini,
        "opencode" => apps.opencode,
        "openclaw" => apps.openclaw,
        _ => false,
    }
}

fn materialize_skill_files(skill: &InstalledSkill) -> Result<(), String> {
    let skill_dir = skills_ssot_dir()?.join(&skill.directory);
    fs::create_dir_all(&skill_dir)
        .map_err(|error| format!("Failed to create skill directory {}: {error}", skill_dir.display()))?;

    let skill_md_path = skill_dir.join("SKILL.md");
    if !skill_md_path.exists() {
        fs::write(&skill_md_path, build_skill_markdown(skill)).map_err(|error| {
            format!("Failed to write skill file {}: {error}", skill_md_path.display())
        })?;
    }

    let metadata_path = skill_dir.join("skill-studio.json");
    if !metadata_path.exists() {
        fs::write(&metadata_path, build_skill_metadata(skill)?).map_err(|error| {
            format!("Failed to write skill metadata {}: {error}", metadata_path.display())
        })?;
    }

    Ok(())
}

fn build_skill_markdown(skill: &InstalledSkill) -> String {
    let description = skill
        .description
        .as_deref()
        .unwrap_or("Migrated Skill Studio placeholder content.");
    let source = match (&skill.repo_owner, &skill.repo_name) {
        (Some(owner), Some(name)) => format!("{owner}/{name}"),
        _ => String::from("local"),
    };

    format!(
        "# {}\n\n{}\n\n- Directory: {}\n- Source: {}\n- Managed by: Skill Studio\n",
        skill.name, description, skill.directory, source
    )
}

fn build_skill_metadata(skill: &InstalledSkill) -> Result<String, String> {
    serde_json::to_string_pretty(&serde_json::json!({
        "id": skill.id,
        "name": skill.name,
        "directory": skill.directory,
        "repoOwner": skill.repo_owner,
        "repoName": skill.repo_name,
        "repoBranch": skill.repo_branch,
        "readmeUrl": skill.readme_url,
        "installedAt": skill.installed_at,
        "apps": skill.apps,
    }))
    .map_err(|error| format!("Failed to serialize skill metadata: {error}"))
}

fn resolve_uninstall_backup_source(skill: &InstalledSkill) -> Result<Option<PathBuf>, String> {
    let ssot_path = skills_ssot_dir()?.join(&skill.directory);
    if ssot_path.is_dir() {
        return Ok(Some(ssot_path));
    }

    for app in APP_IDS {
        let candidate = app_skills_dir(app)?.join(&skill.directory);
        if candidate.is_dir() {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn create_uninstall_backup(skill: &InstalledSkill) -> Result<Option<PathBuf>, String> {
    let Some(source_path) = resolve_uninstall_backup_source(skill)? else {
        return Ok(None);
    };

    let backup_root = skills_backup_dir()?;
    let backup_path = next_backup_path(&backup_root, &skill.directory);
    let backup_skill_dir = backup_path.join("skill");
    fs::create_dir_all(&backup_skill_dir).map_err(|error| {
        format!(
            "Failed to create backup directory {}: {error}",
            backup_skill_dir.display()
        )
    })?;

    copy_dir_recursive(&source_path, &backup_skill_dir)?;

    let metadata = SkillBackupMetadata {
        skill: skill.clone(),
        backup_created_at: current_unix_timestamp(),
        source_path: source_path.display().to_string(),
    };
    let metadata_path = backup_path.join("metadata.json");
    fs::write(
        &metadata_path,
        serde_json::to_string_pretty(&metadata)
            .map_err(|error| format!("Failed to serialize backup metadata: {error}"))?,
    )
    .map_err(|error| format!("Failed to write backup metadata {}: {error}", metadata_path.display()))?;

    trim_backups(&backup_root)?;
    Ok(Some(backup_path))
}

fn list_backup_entries() -> Result<Vec<SkillBackupEntry>, String> {
    let backup_dir = skills_backup_dir()?;
    let mut entries = Vec::new();

    for entry_result in fs::read_dir(&backup_dir)
        .map_err(|error| format!("Failed to read backup directory {}: {error}", backup_dir.display()))?
    {
        let entry = entry_result
            .map_err(|error| format!("Failed to read backup directory entry: {error}"))?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        match read_backup_metadata(&path) {
            Ok(metadata) => entries.push(SkillBackupEntry {
                backup_id: entry.file_name().to_string_lossy().to_string(),
                backup_path: path.display().to_string(),
                created_at: metadata.backup_created_at,
                skill: metadata.skill,
            }),
            Err(_) => continue,
        }
    }

    entries.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(entries)
}

fn trim_backups(backup_root: &Path) -> Result<(), String> {
    let backups = list_backup_entries()?;
    for backup in backups.into_iter().skip(MAX_BACKUPS) {
        let backup_path = backup_root.join(&backup.backup_id);
        if backup_path.exists() {
            fs::remove_dir_all(&backup_path).map_err(|error| {
                format!("Failed to trim backup {}: {error}", backup_path.display())
            })?;
        }
    }

    Ok(())
}

fn read_backup_metadata(backup_path: &Path) -> Result<SkillBackupMetadata, String> {
    let metadata_path = backup_path.join("metadata.json");
    let content = fs::read_to_string(&metadata_path).map_err(|error| {
        format!(
            "Failed to read backup metadata {}: {error}",
            metadata_path.display()
        )
    })?;

    serde_json::from_str::<SkillBackupMetadata>(&content).map_err(|error| {
        format!(
            "Failed to parse backup metadata {}: {error}",
            metadata_path.display()
        )
    })
}

fn backup_path_for_id(backup_id: &str) -> Result<PathBuf, String> {
    if backup_id.contains('/') || backup_id.contains('\\') || backup_id.contains("..") {
        return Err(format!("Invalid backup id: {backup_id}"));
    }

    Ok(skills_backup_dir()?.join(backup_id))
}

fn next_backup_path(backup_root: &Path, directory: &str) -> PathBuf {
    let base = format!(
        "{}-{}",
        current_unix_timestamp(),
        sanitize_backup_segment(directory)
    );
    let mut candidate = backup_root.join(&base);
    let mut index = 1;

    while candidate.exists() {
        candidate = backup_root.join(format!("{base}-{index}"));
        index += 1;
    }

    candidate
}

fn sanitize_backup_segment(directory: &str) -> String {
    let sanitized = directory
        .chars()
        .map(|char| {
            if char.is_ascii_alphanumeric() || matches!(char, '-' | '_' | '.') {
                char
            } else {
                '-'
            }
        })
        .collect::<String>();

    if sanitized.is_empty() {
        String::from("skill")
    } else {
        sanitized
    }
}

fn copy_dir_recursive(source: &Path, destination: &Path) -> Result<(), String> {
    if !source.is_dir() {
        return Err(format!(
            "Source directory does not exist or is not a directory: {}",
            source.display()
        ));
    }

    fs::create_dir_all(destination).map_err(|error| {
        format!(
            "Failed to create destination directory {}: {error}",
            destination.display()
        )
    })?;

    for entry_result in fs::read_dir(source)
        .map_err(|error| format!("Failed to read source directory {}: {error}", source.display()))?
    {
        let entry = entry_result
            .map_err(|error| format!("Failed to read directory entry {}: {error}", source.display()))?;
        let path = entry.path();
        let target_path = destination.join(entry.file_name());

        if path.is_dir() {
            copy_dir_recursive(&path, &target_path)?;
        } else {
            if let Some(parent) = target_path.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    format!(
                        "Failed to create destination parent {}: {error}",
                        parent.display()
                    )
                })?;
            }
            fs::copy(&path, &target_path).map_err(|error| {
                format!(
                    "Failed to copy {} to {}: {error}",
                    path.display(),
                    target_path.display()
                )
            })?;
        }
    }

    Ok(())
}

#[cfg(unix)]
fn create_symlink(source: &Path, destination: &Path) -> Result<(), String> {
    std::os::unix::fs::symlink(source, destination).map_err(|error| {
        format!(
            "Failed to create symlink {} -> {}: {error}",
            source.display(),
            destination.display()
        )
    })
}

#[cfg(windows)]
fn create_symlink(source: &Path, destination: &Path) -> Result<(), String> {
    std::os::windows::fs::symlink_dir(source, destination).map_err(|error| {
        format!(
            "Failed to create symlink {} -> {}: {error}",
            source.display(),
            destination.display()
        )
    })
}

fn is_symlink(path: &Path) -> bool {
    path.symlink_metadata()
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
}

fn remove_path(path: &Path) -> Result<(), String> {
    if is_symlink(path) {
        #[cfg(unix)]
        {
            fs::remove_file(path)
                .map_err(|error| format!("Failed to remove symlink {}: {error}", path.display()))?;
        }
        #[cfg(windows)]
        {
            fs::remove_dir(path)
                .map_err(|error| format!("Failed to remove symlink {}: {error}", path.display()))?;
        }
    } else if path.is_dir() {
        fs::remove_dir_all(path)
            .map_err(|error| format!("Failed to remove directory {}: {error}", path.display()))?;
    } else if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("Failed to remove file {}: {error}", path.display()))?;
    }

    Ok(())
}

fn sync_to_app_dir(directory: &str, app: &str) -> Result<(), String> {
    let source = skills_ssot_dir()?.join(directory);
    if !source.exists() {
        return Err(format!("Skill does not exist in workspace: {directory}"));
    }

    let app_dir = app_skills_dir(app)?;
    fs::create_dir_all(&app_dir)
        .map_err(|error| format!("Failed to create app skills directory {}: {error}", app_dir.display()))?;

    let destination = app_dir.join(directory);
    if destination.exists() || is_symlink(&destination) {
        remove_path(&destination)?;
    }

    match create_symlink(&source, &destination) {
        Ok(()) => Ok(()),
        Err(error) => {
            log::warn!(
                "Failed to create symlink for {} in {}: {}. Falling back to copy.",
                directory,
                app,
                error
            );
            copy_dir_recursive(&source, &destination)
        }
    }
}

fn remove_from_app(directory: &str, app: &str) -> Result<(), String> {
    let path = app_skills_dir(app)?.join(directory);
    if path.exists() || is_symlink(&path) {
        remove_path(&path)?;
    }
    Ok(())
}

fn sanitize_skill_source_path(directory: &str) -> Result<PathBuf, String> {
    let trimmed = directory.trim();
    if trimmed.is_empty() {
        return Err(format!("Invalid skill directory: {directory}"));
    }

    let mut normalized = PathBuf::new();
    for component in Path::new(trimmed).components() {
        match component {
            Component::Normal(name) => {
                let segment = name.to_string_lossy().trim().to_string();
                if segment.is_empty() || segment == "." || segment == ".." {
                    return Err(format!("Invalid skill directory: {directory}"));
                }
                normalized.push(segment);
            }
            Component::CurDir | Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!("Invalid skill directory: {directory}"));
            }
        }
    }

    if normalized.as_os_str().is_empty() {
        Err(format!("Invalid skill directory: {directory}"))
    } else {
        Ok(normalized)
    }
}

fn sanitize_install_name(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }

    if trimmed == "." || trimmed == ".." || trimmed.starts_with('.') {
        return None;
    }

    if !trimmed
        .chars()
        .all(|char| char.is_ascii_alphanumeric() || matches!(char, '-' | '_' | '.'))
    {
        return None;
    }

    Some(trimmed.to_string())
}

fn install_directory_from_relative_path(path: &Path, raw_directory: &str) -> Result<String, String> {
    path.file_name()
        .and_then(|name| sanitize_install_name(&name.to_string_lossy()))
        .ok_or_else(|| format!("Invalid skill directory: {raw_directory}"))
}

fn installed_matches_discoverable(
    installed: &InstalledSkill,
    skill: &DiscoverableSkill,
    install_directory: &str,
) -> bool {
    if !installed.directory.eq_ignore_ascii_case(install_directory) {
        return false;
    }

    match (&installed.repo_owner, &installed.repo_name) {
        (Some(owner), Some(name)) => {
            owner.eq_ignore_ascii_case(&skill.repo_owner)
                && name.eq_ignore_ascii_case(&skill.repo_name)
        }
        _ => true,
    }
}

fn installed_skill_matches_id(skill: &InstalledSkill, id: &str) -> bool {
    skill.id.eq_ignore_ascii_case(id) || skill.directory.eq_ignore_ascii_case(id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsString;
    use std::path::Path;
    use std::sync::Mutex;

    static HOME_ENV_LOCK: Mutex<()> = Mutex::new(());

    struct HomeGuard {
        original_home: Option<OsString>,
    }

    impl HomeGuard {
        fn set(path: &Path) -> Self {
            let original_home = std::env::var_os("HOME");
            std::env::set_var("HOME", path);
            Self { original_home }
        }
    }

    impl Drop for HomeGuard {
        fn drop(&mut self) {
            if let Some(value) = &self.original_home {
                std::env::set_var("HOME", value);
            } else {
                std::env::remove_var("HOME");
            }
        }
    }

    fn path_exists_or_symlink(path: &Path) -> bool {
        path.exists() || is_symlink(path)
    }

    #[test]
    fn runtime_skills_flow_works_with_real_repo_download_and_app_sync() {
        let _lock = HOME_ENV_LOCK.lock().expect("failed to lock HOME env guard");
        let temp_home = tempfile::tempdir().expect("failed to create temp HOME directory");
        let _guard = HomeGuard::set(temp_home.path());

        let repos = get_skill_repos().expect("failed to load skill repos");
        for repo in &repos {
            match fetch_repo_skills(repo) {
                Ok(skills) => println!(
                    "repo {}/{} -> {} skills",
                    repo.owner,
                    repo.name,
                    skills.len()
                ),
                Err(error) => println!(
                    "repo {}/{} failed: {}",
                    repo.owner,
                    repo.name,
                    error
                ),
            }
        }

        let discoverable = discover_available_skills().expect("failed to discover skills");
        println!("discoverable skills total: {}", discoverable.len());
        assert!(
            !discoverable.is_empty(),
            "expected discover_available_skills to return real repo skills"
        );

        let skill = discoverable
            .iter()
            .find(|skill| {
                skill.repo_owner.eq_ignore_ascii_case("anthropics")
                    && skill.repo_name.eq_ignore_ascii_case("skills")
            })
            .cloned()
            .or_else(|| discoverable.first().cloned())
            .expect("expected at least one discoverable skill");

        let installed = install_skill_unified(skill.clone(), "claude")
            .expect("failed to install discovered skill for claude");

        let ssot_path = skills_ssot_dir()
            .expect("failed to resolve SSOT directory")
            .join(&installed.directory);
        let claude_path = app_skills_dir("claude")
            .expect("failed to resolve claude app directory")
            .join(&installed.directory);

        assert!(
            ssot_path.join("SKILL.md").exists(),
            "expected installed skill to exist in SSOT workspace"
        );
        assert!(
            path_exists_or_symlink(&claude_path),
            "expected installed skill to sync into claude app directory"
        );

        toggle_skill_app(&installed.id, "codex", true)
            .expect("failed to enable installed skill for codex");
        let codex_path = app_skills_dir("codex")
            .expect("failed to resolve codex app directory")
            .join(&installed.directory);
        assert!(
            path_exists_or_symlink(&codex_path),
            "expected enabled codex skill to be synced"
        );

        toggle_skill_app(&installed.id, "codex", false)
            .expect("failed to disable installed skill for codex");
        assert!(
            !path_exists_or_symlink(&codex_path),
            "expected disabled codex skill to be removed from app directory"
        );

        let uninstall_result =
            uninstall_skill_unified(&installed.id).expect("failed to uninstall installed skill");
        let backup_path = uninstall_result
            .backup_path
            .expect("expected uninstall to create a backup path");
        let backup_id = Path::new(&backup_path)
            .file_name()
            .and_then(|name| name.to_str())
            .expect("expected backup directory name")
            .to_string();

        assert!(
            !path_exists_or_symlink(&ssot_path),
            "expected uninstall to remove SSOT skill directory"
        );
        assert!(
            !path_exists_or_symlink(&claude_path),
            "expected uninstall to remove claude synced directory"
        );

        let backups = get_skill_backups().expect("failed to list skill backups");
        assert!(
            backups.iter().any(|entry| entry.backup_id == backup_id),
            "expected uninstall backup to be queryable"
        );

        let restored = restore_skill_backup(&backup_id, "claude")
            .expect("failed to restore backup into claude");
        assert_eq!(restored.directory, installed.directory);
        assert!(
            path_exists_or_symlink(
                &skills_ssot_dir()
                    .expect("failed to resolve SSOT directory after restore")
                    .join(&restored.directory)
            ),
            "expected restore to recreate SSOT skill directory"
        );
        assert!(
            path_exists_or_symlink(
                &app_skills_dir("claude")
                    .expect("failed to resolve claude directory after restore")
                    .join(&restored.directory)
            ),
            "expected restore to sync skill back into claude app directory"
        );

        delete_skill_backup(&backup_id).expect("failed to delete skill backup");
        assert!(
            !path_exists_or_symlink(
                &backup_path_for_id(&backup_id).expect("failed to resolve backup path after delete")
            ),
            "expected deleted backup directory to be removed"
        );
    }
}
