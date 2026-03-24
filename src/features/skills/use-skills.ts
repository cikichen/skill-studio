import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { skillsApi } from "../../shared/lib/skills";
import type {
  AppId,
  DiscoverableSkill,
  ImportSkillSelection,
  SkillBackupEntry,
  SkillRepo,
  UnmanagedSkill,
} from "../../shared/types/skills";

export function useInstalledSkills() {
  return useQuery({
    queryKey: ["skills", "installed"],
    queryFn: () => skillsApi.getInstalledSkills(),
  });
}

export function useSkillBackups() {
  return useQuery({
    queryKey: ["skills", "backups"],
    queryFn: () => skillsApi.getSkillBackups(),
  });
}

export function useSkillRepos() {
  return useQuery({
    queryKey: ["skills", "repos"],
    queryFn: () => skillsApi.getSkillRepos(),
  });
}

export function useDiscoverableSkills() {
  return useQuery({
    queryKey: ["skills", "discoverable"],
    queryFn: () => skillsApi.discoverAvailableSkills(),
  });
}

export function useUnmanagedSkills() {
  return useQuery({
    queryKey: ["skills", "unmanaged"],
    queryFn: () => skillsApi.scanUnmanagedSkills(),
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
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "discoverable"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "unmanaged"] });
    },
  });
}

export function useImportSkillsFromApps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imports: ImportSkillSelection[]) =>
      skillsApi.importSkillsFromApps(imports),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "unmanaged"] });
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
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "unmanaged"] });
    },
  });
}

export function useUninstallSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => skillsApi.uninstallUnified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "discoverable"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "backups"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "unmanaged"] });
    },
  });
}

export function useDeleteSkillBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (backupId: string) => skillsApi.deleteBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "backups"] });
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
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "backups"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "unmanaged"] });
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
      queryClient.invalidateQueries({ queryKey: ["skills", "installed"] });
    },
  });
}

export function useAddSkillRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repo: SkillRepo) => skillsApi.addSkillRepo(repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "repos"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "discoverable"] });
    },
  });
}

export function useRemoveSkillRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ owner, name }: { owner: string; name: string }) =>
      skillsApi.removeSkillRepo(owner, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "repos"] });
      queryClient.invalidateQueries({ queryKey: ["skills", "discoverable"] });
    },
  });
}

export type { SkillBackupEntry, UnmanagedSkill };
