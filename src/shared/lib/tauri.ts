import { queryOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import type { AppOverview, ManifestValidationResult } from "../types/app";
import { getSupportedAppIds } from "../types/skills";

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
