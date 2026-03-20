export type AppOverview = {
  appName: string;
  version: string;
  workspaceRoot: string;
  supportedApps: string[];
  syncModes: string[];
};

export type SkillManifest = {
  schemaVersion: string;
  name: string;
  version: string;
  description?: string | null;
  displayName?: string | null;
  author?: string | null;
  homepage?: string | null;
  repository?: string | null;
  license?: string | null;
  keywords: string[];
  source: {
    kind: string;
    url?: string | null;
    checksum?: string | null;
  };
  entry: {
    path: string;
    runner: string;
  };
  compatibility: {
    apps: string[];
    platforms: string[];
    minAppVersion?: string | null;
    maxAppVersion?: string | null;
  };
  activation: {
    defaultEnabled: boolean;
    requiresRestart: boolean;
  };
};

export type ManifestValidationResult = {
  valid: boolean;
  manifest?: SkillManifest | null;
  errors: string[];
};
