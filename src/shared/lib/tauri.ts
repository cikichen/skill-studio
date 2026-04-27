import { queryOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import type { AppOverview, DetectedApp, ManifestValidationResult } from "../types/app";
import { getDetectedInstalledAppIds, getSupportedAppIds } from "../types/skills";

export async function pingBackend() {
  return invoke<string>("ping");
}

export async function getAppOverview() {
  return invoke<AppOverview>("get_app_overview");
}

export const appOverviewQueryOptions = queryOptions({
  queryKey: ["app", "overview"],
  queryFn: getAppOverview,
});

export function useAppOverview() {
  return useQuery(appOverviewQueryOptions);
}

export function useSupportedAppIds() {
  const overviewQuery = useAppOverview();

  return {
    ...overviewQuery,
    data: getSupportedAppIds(overviewQuery.data?.supportedApps),
  };
}

export function useDetectedApps() {
  const overviewQuery = useAppOverview();

  return {
    ...overviewQuery,
    data: overviewQuery.data?.detectedApps ?? ([] as DetectedApp[]),
  };
}

export function useInstalledAppIds() {
  const overviewQuery = useAppOverview();

  return {
    ...overviewQuery,
    data: getDetectedInstalledAppIds(overviewQuery.data?.detectedApps),
  };
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
