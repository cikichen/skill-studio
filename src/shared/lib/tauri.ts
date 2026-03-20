import { invoke } from "@tauri-apps/api/core";
import type { AppOverview, ManifestValidationResult } from "../types/app";

export async function pingBackend() {
  return invoke<string>("ping");
}

export async function getAppOverview() {
  return invoke<AppOverview>("get_app_overview");
}

export async function validateSkillManifest(rawManifest: string) {
  return invoke<ManifestValidationResult>("validate_skill_manifest", {
    rawManifest,
  });
}

export async function readSkillManifestFile(path: string) {
  return invoke<ManifestValidationResult>("read_skill_manifest_file", {
    path,
  });
}
