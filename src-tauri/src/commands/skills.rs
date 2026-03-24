use crate::core::skills::{
    add_skill_repo as add_repo, delete_skill_backup as delete_backup,
    discover_available_skills as discover_skills, get_installed_skills as get_installed,
    get_skill_backups as get_backups, get_skill_repos as get_repos,
    import_skills_from_apps as import_from_apps, install_skill_unified as install_unified,
    install_skills_from_zip as install_from_zip, remove_skill_repo as remove_repo,
    restore_skill_backup as restore_backup, scan_unmanaged_skills as scan_unmanaged,
    toggle_skill_app as toggle_app, uninstall_skill_unified as uninstall_unified,
    DiscoverableSkill, ImportSkillSelection, InstalledSkill, SkillBackupEntry, SkillRepo,
    SkillUninstallResult, UnmanagedSkill,
};

#[tauri::command]
pub fn get_installed_skills() -> Result<Vec<InstalledSkill>, String> {
    get_installed()
}

#[tauri::command]
pub fn get_skill_backups() -> Result<Vec<SkillBackupEntry>, String> {
    get_backups()
}

#[tauri::command]
pub fn get_skill_repos() -> Result<Vec<SkillRepo>, String> {
    get_repos()
}

#[tauri::command]
pub fn discover_available_skills() -> Result<Vec<DiscoverableSkill>, String> {
    discover_skills()
}

#[tauri::command]
pub fn add_skill_repo(repo: SkillRepo) -> Result<bool, String> {
    add_repo(repo)
}

#[tauri::command]
pub fn remove_skill_repo(owner: String, name: String) -> Result<bool, String> {
    remove_repo(&owner, &name)
}

#[tauri::command]
pub fn install_skill_unified(
    skill: DiscoverableSkill,
    current_app: String,
) -> Result<InstalledSkill, String> {
    install_unified(skill, &current_app)
}

#[tauri::command]
pub fn uninstall_skill_unified(id: String) -> Result<SkillUninstallResult, String> {
    uninstall_unified(&id)
}

#[tauri::command]
pub fn delete_skill_backup(backup_id: String) -> Result<bool, String> {
    delete_backup(&backup_id)
}

#[tauri::command]
pub fn restore_skill_backup(
    backup_id: String,
    current_app: String,
) -> Result<InstalledSkill, String> {
    restore_backup(&backup_id, &current_app)
}

#[tauri::command]
pub fn toggle_skill_app(id: String, app: String, enabled: bool) -> Result<bool, String> {
    toggle_app(&id, &app, enabled)
}

#[tauri::command]
pub fn scan_unmanaged_skills() -> Result<Vec<UnmanagedSkill>, String> {
    scan_unmanaged()
}

#[tauri::command]
pub fn import_skills_from_apps(
    imports: Vec<ImportSkillSelection>,
) -> Result<Vec<InstalledSkill>, String> {
    import_from_apps(imports)
}

#[tauri::command]
pub fn install_skills_from_zip(
    file_path: String,
    current_app: String,
) -> Result<Vec<InstalledSkill>, String> {
    install_from_zip(&file_path, &current_app)
}
