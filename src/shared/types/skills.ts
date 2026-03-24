export type AppId = "claude" | "codex" | "gemini" | "opencode" | "openclaw";

export type SkillApps = {
  claude: boolean;
  codex: boolean;
  gemini: boolean;
  opencode: boolean;
  openclaw: boolean;
};

export type InstalledSkill = {
  id: string;
  name: string;
  description?: string | null;
  directory: string;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
  readmeUrl?: string | null;
  apps: SkillApps;
  installedAt: number;
};

export type SkillUninstallResult = {
  backupPath?: string | null;
};

export type SkillBackupEntry = {
  backupId: string;
  backupPath: string;
  createdAt: number;
  skill: InstalledSkill;
};

export type DiscoverableSkill = {
  key: string;
  name: string;
  description: string;
  directory: string;
  readmeUrl?: string | null;
  repoOwner: string;
  repoName: string;
  repoBranch: string;
};

export type SkillRepo = {
  owner: string;
  name: string;
  branch: string;
  enabled: boolean;
};

export type UnmanagedSkill = {
  directory: string;
  name: string;
  description?: string | null;
  foundIn: string[];
  path: string;
};

export type ImportSkillSelection = {
  directory: string;
  apps: SkillApps;
};
