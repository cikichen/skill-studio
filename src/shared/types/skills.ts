export type SkillKind = "installed" | "unmanaged" | "discoverable";

export const APP_IDS = ["claude", "codex", "gemini", "opencode", "openclaw"] as const;

export type AppId = (typeof APP_IDS)[number];

export function isKnownAppId(value: string): value is AppId {
  return (APP_IDS as readonly string[]).includes(value);
}

export function getSupportedAppIds(supportedApps?: readonly string[] | null): AppId[] {
  if (!supportedApps?.length) {
    return [];
  }

  const uniqueAppIds = new Set<AppId>();

  supportedApps.forEach((app) => {
    if (isKnownAppId(app)) {
      uniqueAppIds.add(app);
    }
  });

  return Array.from(uniqueAppIds);
}

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

export type SkillDetail = {
  kind: SkillKind;
  name: string;
  directory: string;
  description?: string | null;
  readmeUrl?: string | null;
  readmeContent: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
  path?: string | null;
  foundIn?: string[] | null;
  installedAt?: number | null;
  apps?: SkillApps | null;
};

export type SkillDetailQuery = {
  kind: SkillKind;
  name: string;
  directory: string;
  description?: string | null;
  readmeUrl?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
  path?: string | null;
  foundIn?: string[] | null;
  installedAt?: number | null;
  apps?: SkillApps | null;
};

export type SkillDetailInput = SkillDetailQuery;

export type ImportSkillSelection = {
  directory: string;
  apps: SkillApps;
};
