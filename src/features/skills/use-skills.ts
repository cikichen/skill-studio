import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { skillsApi } from "../../shared/lib/skills";
import type {
  AppId,
  DiscoverableSkill,
  ImportSkillSelection,
  SkillBackupEntry,
  SkillDetailInput,
  SkillRepo,
  UnmanagedSkill,
} from "../../shared/types/skills";

const skillsQueryKeys = {
  root: ["skills"] as const,
  installed: ["skills", "installed"] as const,
  backups: ["skills", "backups"] as const,
  repos: ["skills", "repos"] as const,
  discoverable: ["skills", "discoverable"] as const,
  unmanaged: ["skills", "unmanaged"] as const,
  detail: (input: SkillDetailInput) => ["skills", "detail", input] as const,
};

type QueryActivationOptions = {
  enabled?: boolean;
};

function invalidateSkillsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKeys: ReadonlyArray<readonly unknown[]>
) {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

const fastQueryOptions = {
  staleTime: 60_000,
} as const;

const slowQueryOptions = {
  staleTime: 15_000,
  placeholderData: keepPreviousData,
} as const;

export function useInstalledSkills() {
  return useQuery({
    queryKey: skillsQueryKeys.installed,
    queryFn: () => skillsApi.getInstalledSkills(),
    ...fastQueryOptions,
  });
}

export function useSkillBackups() {
  return useQuery({
    queryKey: skillsQueryKeys.backups,
    queryFn: () => skillsApi.getSkillBackups(),
    ...fastQueryOptions,
  });
}

export function useSkillRepos() {
  return useQuery({
    queryKey: skillsQueryKeys.repos,
    queryFn: () => skillsApi.getSkillRepos(),
    ...fastQueryOptions,
  });
}

export function useDiscoverableSkills(options?: QueryActivationOptions) {
  return useQuery({
    queryKey: skillsQueryKeys.discoverable,
    queryFn: () => skillsApi.discoverAvailableSkills(),
    enabled: options?.enabled ?? true,
    ...slowQueryOptions,
  });
}

export function useUnmanagedSkills(options?: QueryActivationOptions) {
  return useQuery({
    queryKey: skillsQueryKeys.unmanaged,
    queryFn: () => skillsApi.scanUnmanagedSkills(),
    enabled: options?.enabled ?? true,
    ...slowQueryOptions,
  });
}

export function useSkillDetail(input: SkillDetailInput | null, options?: QueryActivationOptions) {
  return useQuery({
    queryKey: input ? skillsQueryKeys.detail(input) : ["skills", "detail", "idle"],
    queryFn: () => {
      if (!input) {
        throw new Error("Skill detail input is required");
      }
      return skillsApi.getSkillDetail(input);
    },
    enabled: (options?.enabled ?? true) && input !== null,
    ...slowQueryOptions,
  });
}

export function useInstallSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      skill,
      currentApp,
    }: {
      skill: DiscoverableSkill;
      currentApp: AppId;
    }) => skillsApi.installUnified(skill, currentApp),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
        skillsQueryKeys.discoverable,
        skillsQueryKeys.unmanaged,
      ]);
    },
  });
}

export function useImportSkillsFromApps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imports: ImportSkillSelection[]) =>
      skillsApi.importSkillsFromApps(imports),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
        skillsQueryKeys.unmanaged,
      ]);
    },
  });
}

export function useInstallSkillsFromZip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      filePath,
      currentApp,
    }: {
      filePath: string;
      currentApp: AppId;
    }) => skillsApi.installSkillsFromZip(filePath, currentApp),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
        skillsQueryKeys.unmanaged,
      ]);
    },
  });
}

export function useUninstallSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => skillsApi.uninstallUnified(id),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
        skillsQueryKeys.backups,
        skillsQueryKeys.discoverable,
        skillsQueryKeys.unmanaged,
      ]);
    },
  });
}

export function useDeleteSkillBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (backupId: string) => skillsApi.deleteBackup(backupId),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.backups,
      ]);
    },
  });
}

export function useRestoreSkillBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      backupId,
      currentApp,
    }: {
      backupId: string;
      currentApp: AppId;
    }) => skillsApi.restoreBackup(backupId, currentApp),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
        skillsQueryKeys.backups,
        skillsQueryKeys.unmanaged,
      ]);
    },
  });
}

export function useToggleSkillApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      app,
      enabled,
    }: {
      id: string;
      app: AppId;
      enabled: boolean;
    }) => skillsApi.toggleApp(id, app, enabled),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.installed,
      ]);
    },
  });
}

export function useAddSkillRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repo: SkillRepo) => skillsApi.addSkillRepo(repo),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.repos,
        skillsQueryKeys.discoverable,
      ]);
    },
  });
}

export function useRemoveSkillRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ owner, name }: { owner: string; name: string }) =>
      skillsApi.removeSkillRepo(owner, name),
    onSuccess: () => {
      invalidateSkillsQueries(queryClient, [
        skillsQueryKeys.repos,
        skillsQueryKeys.discoverable,
      ]);
    },
  });
}

export type { SkillBackupEntry, UnmanagedSkill };
