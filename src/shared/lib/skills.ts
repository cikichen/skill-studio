import { invoke } from "@tauri-apps/api/core";
import type {
  AppId,
  DiscoverableSkill,
  ImportSkillSelection,
  InstalledSkill,
  SkillBackupEntry,
  SkillDetail,
  SkillDetailQuery,
  SkillRepo,
  SkillUninstallResult,
  UnmanagedSkill,
} from "../types/skills";

export const skillsApi = {
  getInstalledSkills() {
    return invoke<InstalledSkill[]>("get_installed_skills");
  },
  getSkillBackups() {
    return invoke<SkillBackupEntry[]>("get_skill_backups");
  },
  getSkillRepos() {
    return invoke<SkillRepo[]>("get_skill_repos");
  },
  discoverAvailableSkills() {
    return invoke<DiscoverableSkill[]>("discover_available_skills");
  },
  scanUnmanagedSkills() {
    return invoke<UnmanagedSkill[]>("scan_unmanaged_skills");
  },
  getSkillDetail(query: SkillDetailQuery) {
    return invoke<SkillDetail>("get_skill_detail", { query });
  },
  addSkillRepo(repo: SkillRepo) {
    return invoke<boolean>("add_skill_repo", { repo });
  },
  removeSkillRepo(owner: string, name: string) {
    return invoke<boolean>("remove_skill_repo", { owner, name });
  },
  installUnified(skill: DiscoverableSkill, currentApp: AppId) {
    return invoke<InstalledSkill>("install_skill_unified", {
      skill,
      currentApp,
    });
  },
  importSkillsFromApps(imports: ImportSkillSelection[]) {
    return invoke<InstalledSkill[]>("import_skills_from_apps", { imports });
  },
  installSkillsFromZip(filePath: string, currentApp: AppId) {
    return invoke<InstalledSkill[]>("install_skills_from_zip", {
      filePath,
      currentApp,
    });
  },
  uninstallUnified(id: string) {
    return invoke<SkillUninstallResult>("uninstall_skill_unified", { id });
  },
  deleteBackup(backupId: string) {
    return invoke<boolean>("delete_skill_backup", { backupId });
  },
  restoreBackup(backupId: string, currentApp: AppId) {
    return invoke<InstalledSkill>("restore_skill_backup", {
      backupId,
      currentApp,
    });
  },
  toggleApp(id: string, app: AppId, enabled: boolean) {
    return invoke<boolean>("toggle_skill_app", { id, app, enabled });
  },
};

