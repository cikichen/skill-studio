import { useMemo, useState } from "react";
import { CheckCircle2, Inbox, Compass, Target, Layers } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  useDiscoverableSkills,
  useImportSkillsFromApps,
  useInstallSkill,
  useInstallSkillsFromZip,
  useInstalledSkills,
  useSkillRepos,
  useToggleSkillApp,
  useUninstallSkill,
  useUnmanagedSkills,
} from "./use-skills";
import type {
  AppId,
  DiscoverableSkill,
  InstalledSkill,
  SkillApps,
  UnmanagedSkill,
} from "../../shared/types/skills";
import {
  getAppLabels,
  getLocaleForLanguage,
  useI18n,
} from "../../shared/lib/i18n";

const APP_IDS: AppId[] = ["claude", "codex", "gemini", "opencode", "openclaw"];

type SuccessFeedback = {
  title: string;
  details: string[];
};

export function SkillsPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const [currentApp, setCurrentApp] = useState<AppId>("claude");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] =
    useState<SuccessFeedback | null>(null);
  const [zipPath, setZipPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importSelections, setImportSelections] = useState<
    Record<string, SkillApps>
  >({});
  const [selectedUnmanagedDirectories, setSelectedUnmanagedDirectories] =
    useState<Record<string, true>>({});
  const { data: installedSkills = [], isLoading, error } = useInstalledSkills();
  const { data: repos = [] } = useSkillRepos();
  const {
    data: discoverableSkills = [],
    isLoading: discoverableLoading,
    error: discoverableError,
  } = useDiscoverableSkills();
  const {
    data: unmanagedSkills = [],
    isLoading: unmanagedLoading,
    error: unmanagedError,
  } = useUnmanagedSkills();
  const installSkillMutation = useInstallSkill();
  const importSkillsMutation = useImportSkillsFromApps();
  const installSkillsFromZipMutation = useInstallSkillsFromZip();
  const uninstallSkillMutation = useUninstallSkill();
  const toggleSkillAppMutation = useToggleSkillApp();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedSearchQuery.length > 0;

  const installedByDiscoveryKey = useMemo(
    () =>
      new Map(
        installedSkills.map(
          (skill) => [buildInstalledLookupKey(skill), skill] as const
        )
      ),
    [installedSkills]
  );

  const filteredInstalledSkills = useMemo(
    () =>
      installedSkills.filter((skill) =>
        matchesInstalledSkillSearch(skill, normalizedSearchQuery, appLabels)
      ),
    [installedSkills, normalizedSearchQuery, appLabels]
  );

  const filteredUnmanagedSkills = useMemo(
    () =>
      unmanagedSkills.filter((skill) =>
        matchesUnmanagedSkillSearch(skill, normalizedSearchQuery)
      ),
    [unmanagedSkills, normalizedSearchQuery]
  );

  const filteredDiscoverableSkills = useMemo(
    () =>
      discoverableSkills.filter((skill) =>
        matchesDiscoverableSkillSearch(skill, normalizedSearchQuery)
      ),
    [discoverableSkills, normalizedSearchQuery]
  );

  const selectedUnmanagedSkills = useMemo(
    () =>
      unmanagedSkills.filter(
        (skill) => selectedUnmanagedDirectories[skill.directory]
      ),
    [unmanagedSkills, selectedUnmanagedDirectories]
  );

  const selectedFilteredUnmanagedCount = useMemo(
    () =>
      filteredUnmanagedSkills.filter(
        (skill) => selectedUnmanagedDirectories[skill.directory]
      ).length,
    [filteredUnmanagedSkills, selectedUnmanagedDirectories]
  );

  const allFilteredUnmanagedSelected =
    filteredUnmanagedSkills.length > 0 &&
    filteredUnmanagedSkills.every(
      (skill) => selectedUnmanagedDirectories[skill.directory]
    );

  const errorMessage =
    actionError ??
    getErrorMessage(error) ??
    getErrorMessage(discoverableError) ??
    getErrorMessage(unmanagedError);

  async function handleInstall(skill: DiscoverableSkill) {
    setActionError(null);
    setSuccessFeedback(null);

    try {
      const installedSkill = await installSkillMutation.mutateAsync({
        skill,
        currentApp,
      });
      setSuccessFeedback({
        title: isZh
          ? `已安装 ${installedSkill.name}`
          : `Installed ${installedSkill.name}`,
        details: [
          isZh
            ? `已立即为 ${appLabels[currentApp]} 启用。`
            : `Enabled in ${appLabels[currentApp]} immediately.`,
          isZh
            ? `来源：${skill.repoOwner}/${skill.repoName}（${skill.repoBranch}）。`
            : `Source: ${skill.repoOwner}/${skill.repoName} (${skill.repoBranch}).`,
          isZh
            ? `目录：${installedSkill.directory}。`
            : `Directory: ${installedSkill.directory}.`,
        ],
      });
    } catch (mutationError) {
      setActionError(
        getErrorMessage(mutationError) ??
          t("安装技能失败。", "Failed to install skill.")
      );
    }
  }

  function clearImportStateForDirectories(directories: string[]) {
    if (directories.length === 0) {
      return;
    }

    setImportSelections((currentSelections) => {
      const nextSelections = { ...currentSelections };
      for (const directory of directories) {
        delete nextSelections[directory];
      }
      return nextSelections;
    });

    setSelectedUnmanagedDirectories((currentSelections) => {
      const nextSelections = { ...currentSelections };
      for (const directory of directories) {
        delete nextSelections[directory];
      }
      return nextSelections;
    });
  }

  async function handleImportSkills(skills: UnmanagedSkill[]) {
    setActionError(null);
    setSuccessFeedback(null);

    if (skills.length === 0) {
      setActionError(
        t(
          "请至少选择一个未托管技能进行导入。",
          "Select at least one unmanaged skill to import."
        )
      );
      return;
    }

    try {
      const importedSkills = await importSkillsMutation.mutateAsync(
        skills.map((skill) => ({
          directory: skill.directory,
          apps: getSelectedApps(skill.directory, importSelections, currentApp),
        }))
      );
      const requestedDirectories = skills.map((skill) => skill.directory);
      clearImportStateForDirectories(requestedDirectories);

      if (skills.length === 1) {
        const [skill] = skills;
        const importedSkill = importedSkills[0];

        if (importedSkill) {
          const enabledApps = getEnabledApps(importedSkill.apps, appLabels);
          setSuccessFeedback({
            title: isZh
              ? `已导入 ${importedSkill.name}`
              : `Imported ${importedSkill.name}`,
            details: [
              isZh
                ? `导入来源：${skill.foundIn
                    .map(formatSourceLabel)
                    .join("、")}。`
                : `Imported from: ${skill.foundIn
                    .map(formatSourceLabel)
                    .join(", ")}.`,
              enabledApps.length > 0
                ? isZh
                  ? `已启用到：${enabledApps.join("、")}。`
                  : `Enabled in ${enabledApps.join(", ")}.`
                : t(
                    "已导入，但未启用任何应用。",
                    "Imported without enabling any app."
                  ),
              isZh
                ? `目录：${importedSkill.directory}。`
                : `Directory: ${importedSkill.directory}.`,
            ],
          });
        } else {
          setSuccessFeedback({
            title: isZh
              ? `${skill.name} 已被纳入管理`
              : `${skill.name} is already managed`,
            details: [
              t(
                "检测到了本地技能，但 Skill Studio 已经在跟踪它。",
                "The local skill was detected, but Skill Studio already tracks it."
              ),
            ],
          });
        }

        return;
      }

      const skippedCount = Math.max(skills.length - importedSkills.length, 0);
      setSuccessFeedback({
        title:
          importedSkills.length > 0
            ? isZh
              ? `已导入 ${importedSkills.length} 个已选技能`
              : `Imported ${importedSkills.length} selected skill${
                  importedSkills.length > 1 ? "s" : ""
                }`
            : t("所选技能均已在管理中", "Selected skills are already managed"),
        details: [
          isZh
            ? `本次请求导入 ${skills.length} 个本地技能。`
            : `Requested ${skills.length} local skill${
                skills.length > 1 ? "s" : ""
              }.`,
          importedSkills.length > 0
            ? isZh
              ? `已导入：${summarizeList(
                  importedSkills.map((skill) => skill.name),
                  4,
                  true
                )}。`
              : `Imported: ${summarizeList(
                  importedSkills.map((skill) => skill.name),
                  4,
                  false
                )}.`
            : t(
                "Skill Studio 已经跟踪所有已选技能。",
                "Skill Studio already tracks every selected skill."
              ),
          skippedCount > 0
            ? isZh
              ? `${skippedCount} 个选择因 Skill Studio 已在跟踪而被跳过。`
              : `${skippedCount} selection${
                  skippedCount > 1 ? "s were" : " was"
                } skipped because Skill Studio already tracks them.`
            : t(
                "应用启用状态已遵循每一行当前的开关选择。",
                "App enablement followed each row's current toggle selections."
              ),
        ],
      });
    } catch (mutationError) {
      setActionError(
        getErrorMessage(mutationError) ??
          t("导入未托管技能失败。", "Failed to import unmanaged skill.")
      );
    }
  }

  async function handleImport(skill: UnmanagedSkill) {
    await handleImportSkills([skill]);
  }

  async function handleImportSelected() {
    await handleImportSkills(selectedUnmanagedSkills);
  }

  function handleUnmanagedSelectionToggle(
    directory: string,
    selected: boolean
  ) {
    setSelectedUnmanagedDirectories((currentSelections) => {
      const nextSelections = { ...currentSelections };

      if (selected) {
        nextSelections[directory] = true;
      } else {
        delete nextSelections[directory];
      }

      return nextSelections;
    });
  }

  function handleToggleAllFilteredUnmanaged(selected: boolean) {
    setSelectedUnmanagedDirectories((currentSelections) => {
      const nextSelections = { ...currentSelections };

      for (const skill of filteredUnmanagedSkills) {
        if (selected) {
          nextSelections[skill.directory] = true;
        } else {
          delete nextSelections[skill.directory];
        }
      }

      return nextSelections;
    });
  }

  async function handleChooseZip() {
    setActionError(null);

    try {
      const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [
          { name: t("ZIP 压缩包", "ZIP archives"), extensions: ["zip"] },
        ],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return;
      }

      setZipPath(selectedPath);
    } catch (dialogError) {
      setActionError(
        getErrorMessage(dialogError) ??
          t("打开 ZIP 选择器失败。", "Failed to open ZIP picker.")
      );
    }
  }

  async function handleZipInstall() {
    setActionError(null);
    setSuccessFeedback(null);

    try {
      const trimmedZipPath = zipPath.trim();
      const installedFromZip = await installSkillsFromZipMutation.mutateAsync({
        filePath: trimmedZipPath,
        currentApp,
      });
      setZipPath("");
      setSuccessFeedback({
        title:
          installedFromZip.length === 1
            ? isZh
              ? `已从 ZIP 安装 ${installedFromZip[0].name}`
              : `Installed ${installedFromZip[0].name} from ZIP`
            : isZh
            ? `已从 ZIP 安装 ${installedFromZip.length} 个技能`
            : `Installed ${installedFromZip.length} skills from ZIP`,
        details: [
          isZh
            ? `默认已为 ${appLabels[currentApp]} 启用。`
            : `Enabled in ${appLabels[currentApp]} by default.`,
          isZh
            ? `技能：${summarizeList(
                installedFromZip.map((skill) => skill.name),
                4,
                true
              )}。`
            : `Skills: ${summarizeList(
                installedFromZip.map((skill) => skill.name),
                4,
                false
              )}.`,
          isZh ? `压缩包：${trimmedZipPath}。` : `Archive: ${trimmedZipPath}.`,
        ],
      });
    } catch (mutationError) {
      setActionError(
        getErrorMessage(mutationError) ??
          t("从 ZIP 安装技能失败。", "Failed to install skills from ZIP.")
      );
    }
  }

  async function handleUninstall(skill: InstalledSkill) {
    setActionError(null);
    setSuccessFeedback(null);

    try {
      const uninstallResult = await uninstallSkillMutation.mutateAsync(
        skill.id
      );
      setSuccessFeedback({
        title: isZh ? `已卸载 ${skill.name}` : `Uninstalled ${skill.name}`,
        details: [
          uninstallResult.backupPath
            ? isZh
              ? `备份已保存到 ${uninstallResult.backupPath}。`
              : `Backup saved to ${uninstallResult.backupPath}.`
            : t(
                "后端未返回备份路径。",
                "No backup path was returned by the backend."
              ),
          isZh
            ? `已从受管清单中移除 ${skill.directory}。`
            : `Removed from the managed inventory for ${skill.directory}.`,
        ],
      });
    } catch (mutationError) {
      setActionError(
        getErrorMessage(mutationError) ??
          t("卸载技能失败。", "Failed to uninstall skill.")
      );
    }
  }

  async function handleToggle(
    skill: InstalledSkill,
    app: AppId,
    enabled: boolean
  ) {
    setActionError(null);
    setSuccessFeedback(null);

    try {
      await toggleSkillAppMutation.mutateAsync({ id: skill.id, app, enabled });
      const nextApps: SkillApps = {
        ...skill.apps,
        [app]: enabled,
      };
      const enabledApps = getEnabledApps(nextApps, appLabels);
      setSuccessFeedback({
        title: isZh
          ? `${enabled ? "已启用" : "已停用"} ${skill.name}（${
              appLabels[app]
            }）`
          : `${enabled ? "Enabled" : "Disabled"} ${skill.name} for ${
              appLabels[app]
            }`,
        details: [
          enabled
            ? isZh
              ? `${appLabels[app]} 现在会收到同步后的技能文件。`
              : `${appLabels[app]} will now receive synced skill files.`
            : isZh
            ? `${appLabels[app]} 将不再接收同步后的技能文件。`
            : `${appLabels[app]} will no longer receive synced skill files.`,
          enabledApps.length > 0
            ? isZh
              ? `当前启用应用：${enabledApps.join("、")}。`
              : `Currently active in: ${enabledApps.join(", ")}.`
            : t(
                "该技能已安装，但当前未在任何应用中启用。",
                "The skill is installed but currently inactive in every app."
              ),
        ],
      });
    } catch (mutationError) {
      setActionError(
        getErrorMessage(mutationError) ??
          t("更新技能启用状态失败。", "Failed to update skill activation.")
      );
    }
  }

  function handleImportAppToggle(
    directory: string,
    app: AppId,
    enabled: boolean
  ) {
    setImportSelections((currentSelections) => ({
      ...currentSelections,
      [directory]: {
        ...getSelectedApps(directory, currentSelections, currentApp),
        [app]: enabled,
      },
    }));
  }

  function formatSourceLabel(source: string) {
    const normalized = source.toLowerCase();

    if (normalized === "skill-studio") {
      return t("Skill Studio 工作区", "Skill Studio workspace");
    }

    if (normalized === "cc-switch") {
      return "cc-switch";
    }

    if (APP_IDS.includes(normalized as AppId)) {
      return appLabels[normalized as AppId];
    }

    return source;
  }

  const isAnyLoading = isLoading || discoverableLoading || unmanagedLoading;

  if (isAnyLoading) {
    return (
      <section className="animate-pulse space-y-5">
        <div className="h-[220px] rounded-[28px] bg-slate-200/40 dark:bg-[#0f172a]/50" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="h-[140px] rounded-xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
            <div className="h-[68px] rounded-xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
            <div className="h-[68px] rounded-xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-[160px] rounded-xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
          <div className="h-[160px] rounded-xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] 2xl:grid-cols-[minmax(0,1.6fr)_400px]">
      <div className="space-y-5">
        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
                <span>{t("已安装", "Installed")}</span>
                <span className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-[10px] tracking-[0.18em] text-slate-700 dark:text-slate-300">
                  {t("与 cc-switch 能力对齐", "cc-switch parity")}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                {t("统一技能清单", "Unified skill inventory")}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                {t(
                  "集中查看已安装技能、来源、启用应用与安装时间；下方保留跨区搜索、批量导入和本地 ZIP 安装入口。",
                  "Review installed skills, source, enabled apps, and install time in one place while keeping cross-section search, batch import, and ZIP install flows close by."
                )}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:w-[360px] xl:grid-cols-1">
              <CompactMetricCard
                icon={CheckCircle2}
                iconColor="text-blue-500 dark:text-blue-400"
                iconBg="bg-blue-50 dark:bg-blue-900/20"
                label={t("已安装", "Installed")}
                value={formatCount(
                  filteredInstalledSkills.length,
                  installedSkills.length
                )}
                helper={t("受管技能", "Managed skills")}
              />
              <CompactMetricCard
                icon={Inbox}
                iconColor="text-orange-500 dark:text-orange-400"
                iconBg="bg-orange-50 dark:bg-orange-900/20"
                label={t("未托管", "Unmanaged")}
                value={formatCount(
                  filteredUnmanagedSkills.length,
                  unmanagedSkills.length
                )}
                helper={t("可导入候选", "Import candidates")}
              />
              <CompactMetricCard
                icon={Compass}
                iconColor="text-purple-500 dark:text-purple-400"
                iconBg="bg-purple-50 dark:bg-purple-900/20"
                label={t("发现", "Discovery")}
                value={formatCount(
                  filteredDiscoverableSkills.length,
                  discoverableSkills.length
                )}
                helper={t("仓库候选", "Repo candidates")}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          {successFeedback ? (
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-indigo-900 dark:text-indigo-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-emerald-50">
                    {successFeedback.title}
                  </div>
                  {successFeedback.details.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-indigo-900 dark:text-indigo-100/90">
                      {successFeedback.details.map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessFeedback(null)}
                  className="rounded-full border border-emerald-200/20 px-3 py-1 text-xs text-emerald-50 transition hover:bg-emerald-300/10"
                >
                  {t("关闭", "Dismiss")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {t("快速筛选技能", "Quick find skills")}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                    {t(
                      "按名称、目录、仓库、来源、路径或启用应用，同时过滤已安装、未托管和可发现技能。",
                      "Filter installed, unmanaged, and discoverable skills by name, directory, repo, source, path, or enabled app."
                    )}
                  </p>
                </div>
                {hasSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300"
                  >
                    {t("清空搜索", "Clear search")}
                  </button>
                ) : null}
              </div>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t(
                  "搜索技能、仓库、路径或应用",
                  "Search skills, repos, paths, or apps"
                )}
                className="mt-4 w-full rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-[#0f172a] shadow-sm dark:shadow-inner px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:text-slate-500 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {isZh
                  ? `当前显示已安装 ${formatCount(
                      filteredInstalledSkills.length,
                      installedSkills.length
                    )}，未托管 ${formatCount(
                      filteredUnmanagedSkills.length,
                      unmanagedSkills.length
                    )}，可发现 ${formatCount(
                      filteredDiscoverableSkills.length,
                      discoverableSkills.length
                    )}。`
                  : `Showing ${formatCount(
                      filteredInstalledSkills.length,
                      installedSkills.length
                    )} installed, ${formatCount(
                      filteredUnmanagedSkills.length,
                      unmanagedSkills.length
                    )} unmanaged, and ${formatCount(
                      filteredDiscoverableSkills.length,
                      discoverableSkills.length
                    )} discoverable skills.`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
              <QuickInfoCard
                icon={Target}
                iconColor="text-emerald-500 dark:text-emerald-400"
                iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                title={t("默认安装目标", "Default install target")}
                value={appLabels[currentApp]}
                description={t(
                  "新的仓库安装与 ZIP 安装会立即启用到当前应用。",
                  "New repository and ZIP installs enable the current app immediately."
                )}
              />
              <QuickInfoCard
                icon={Layers}
                iconColor="text-indigo-500 dark:text-indigo-400"
                iconBg="bg-indigo-50 dark:bg-indigo-900/20"
                title={t("批量导入", "Batch import")}
                value={
                  selectedUnmanagedSkills.length > 0
                    ? String(selectedUnmanagedSkills.length)
                    : t("未选择", "None")
                }
                description={t(
                  "批量导入会保留每一行的应用开关状态。",
                  "Batch import preserves each row's per-app toggles."
                )}
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <EmptyState
                title={t("正在加载已安装技能", "Loading installed skills")}
                description={t(
                  "正在从 Rust 命令获取迁移后的技能清单。",
                  "Fetching the migrated skills inventory from Rust commands."
                )}
              />
            ) : installedSkills.length === 0 ? (
              <EmptyState
                title={t("还没有已安装技能", "No installed skills yet")}
                description={t(
                  "可通过发现列表、未托管导入或 ZIP 安装，把技能加入本地 Skill Studio 存储。",
                  "Use discovery, unmanaged import, or ZIP install to add skills into the local Skill Studio store."
                )}
              />
            ) : filteredInstalledSkills.length === 0 ? (
              <EmptyState
                title={t(
                  "没有匹配搜索的已安装技能",
                  "No installed skills match your search"
                )}
                description={t(
                  "试试其他关键词，或清空搜索以查看完整清单。",
                  "Try a different keyword or clear the search to inspect the full installed inventory."
                )}
              />
            ) : (
              filteredInstalledSkills.map((skill) => {
                const enabledApps = getEnabledApps(skill.apps, appLabels);
                const source =
                  skill.repoOwner && skill.repoName
                    ? `${skill.repoOwner}/${skill.repoName}`
                    : t("本地或导入来源", "Local or imported source");

                return (
                  <article
                    key={skill.id}
                    className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                            {skill.name}
                          </h4>
                          <span className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
                            {skill.directory}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                          {t("来源", "Source")}: {source}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                          {skill.description ??
                            t(
                              "暂未提供描述。",
                              "No description available yet."
                            )}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {APP_IDS.map((app) => {
                            const enabled = skill.apps[app];
                            return (
                              <button
                                key={app}
                                type="button"
                                onClick={() =>
                                  handleToggle(skill, app, !enabled)
                                }
                                disabled={toggleSkillAppMutation.isPending}
                                className={[
                                  "rounded-full border px-3 py-1 text-xs transition",
                                  enabled
                                    ? "border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100"
                                    : "border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300",
                                ].join(" ")}
                              >
                                {appLabels[app]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                        <div className="text-sm text-slate-700 dark:text-slate-300 lg:text-right">
                          <div>{t("状态", "Status")}</div>
                          <div className="mt-2 font-medium text-slate-900 dark:text-white">
                            {enabledApps.length > 0
                              ? isZh
                                ? `已启用 ${enabledApps.length} 个应用`
                                : `${enabledApps.length} app${
                                    enabledApps.length > 1 ? "s" : ""
                                  } enabled`
                              : t("已安装但未启用", "Installed but inactive")}
                          </div>
                          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            {t("安装时间", "Installed at")}{" "}
                            {formatUnixTime(skill.installedAt, locale)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {skill.readmeUrl ? (
                            <a
                              href={skill.readmeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300"
                            >
                              {t("文档", "Docs")}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleUninstall(skill)}
                            disabled={uninstallSkillMutation.isPending}
                            className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t("卸载", "Uninstall")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
                {t("未托管", "Unmanaged")}
              </div>
              <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t("导入已有本地技能", "Import existing local skills")}
              </h4>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-3 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 dark:text-slate-400">
                {t("候选项", "Candidates")}
              </div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {formatCount(
                  filteredUnmanagedSkills.length,
                  unmanagedSkills.length
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {t(
              "扫描 ~/.skill-studio、~/.cc-switch 以及受支持应用的技能目录，寻找已包含 SKILL.md 但尚未被 Skill Studio 跟踪的技能。",
              "Scan ~/.skill-studio, ~/.cc-switch, and supported app skill folders for directories that already contain SKILL.md but are not yet tracked by Skill Studio."
            )}
          </p>

          <div className="mt-6 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {selectedUnmanagedSkills.length > 0
                    ? isZh
                      ? `已选择 ${selectedUnmanagedSkills.length} 个本地技能`
                      : `${selectedUnmanagedSkills.length} local skill${
                          selectedUnmanagedSkills.length > 1 ? "s" : ""
                        } selected`
                    : t(
                        "选择一个或多个未托管技能",
                        "Select one or more unmanaged skills"
                      )}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  {selectedUnmanagedSkills.length > 0
                    ? selectedFilteredUnmanagedCount ===
                      selectedUnmanagedSkills.length
                      ? t(
                          "批量导入会保留每一行当前的应用开关选择。",
                          "Batch import preserves each row's current app toggles."
                        )
                      : isZh
                      ? `当前搜索结果中可见 ${selectedFilteredUnmanagedCount} 个已选项。`
                      : `${selectedFilteredUnmanagedCount} selected item${
                          selectedFilteredUnmanagedCount === 1 ? "" : "s"
                        } are visible in the current search.`
                    : t(
                        "可使用行复选框一次导入多个本地技能，同时保留每个技能的应用开关。",
                        "Use row checkboxes to import several local skills in one step while keeping per-skill app toggles."
                      )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleToggleAllFilteredUnmanaged(
                      !allFilteredUnmanagedSelected
                    )
                  }
                  disabled={
                    importSkillsMutation.isPending ||
                    filteredUnmanagedSkills.length === 0
                  }
                  className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {allFilteredUnmanagedSelected
                    ? t("取消当前筛选选择", "Deselect filtered")
                    : t("全选当前筛选结果", "Select all filtered")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUnmanagedDirectories({})}
                  disabled={
                    importSkillsMutation.isPending ||
                    selectedUnmanagedSkills.length === 0
                  }
                  className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("清空已选", "Clear selected")}
                </button>
                <button
                  type="button"
                  onClick={handleImportSelected}
                  disabled={
                    importSkillsMutation.isPending ||
                    selectedUnmanagedSkills.length === 0
                  }
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("导入已选", "Import selected")}
                  {selectedUnmanagedSkills.length > 0
                    ? ` (${selectedUnmanagedSkills.length})`
                    : ""}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {unmanagedLoading ? (
              <EmptyState
                title={t("正在扫描未托管技能", "Scanning unmanaged skills")}
                description={t(
                  "正在检查应用目录、Skill Studio 工作区和 cc-switch SSOT，寻找可导入项。",
                  "Checking app folders, the Skill Studio workspace, and cc-switch SSOT for import candidates."
                )}
              />
            ) : unmanagedSkills.length === 0 ? (
              <EmptyState
                title={t("未发现未托管技能", "No unmanaged skills found")}
                description={t(
                  "当本地存在但尚未进入受管已安装列表的技能时，它们会显示在这里。",
                  "Existing local skills will appear here when they exist outside the managed installed list."
                )}
              />
            ) : filteredUnmanagedSkills.length === 0 ? (
              <EmptyState
                title={t(
                  "没有匹配搜索的未托管技能",
                  "No unmanaged skills match your search"
                )}
                description={t(
                  "可尝试按目录、路径、来源应用或技能名进行匹配。",
                  "Try matching by directory, path, source app, or skill name."
                )}
              />
            ) : (
              filteredUnmanagedSkills.map((skill) => {
                const selectedApps = getSelectedApps(
                  skill.directory,
                  importSelections,
                  currentApp
                );
                const importEnabledCount = countEnabledApps(selectedApps);
                const isSelected =
                  selectedUnmanagedDirectories[skill.directory] === true;

                return (
                  <article
                    key={skill.directory}
                    className={[
                      "rounded-xl border bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4",
                      isSelected ? "border-emerald-400/30" : "border-gray-100 dark:border-slate-800",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) =>
                            handleUnmanagedSelectionToggle(
                              skill.directory,
                              event.target.checked
                            )
                          }
                          disabled={importSkillsMutation.isPending}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950/50 text-emerald-400 focus:ring-emerald-400/40"
                        />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {skill.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                            {skill.directory} ·{" "}
                            {skill.foundIn
                              .map(formatSourceLabel)
                              .join(isZh ? "、" : ", ")}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
                        {t("本地", "Local")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                      {skill.description ??
                        t(
                          "SKILL.md 元数据中暂无描述。",
                          "No description available in SKILL.md metadata."
                        )}
                    </p>
                    <p className="mt-2 break-all text-xs text-slate-400 dark:text-slate-500">
                      {skill.path}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {APP_IDS.map((app) => {
                        const enabled = selectedApps[app];
                        return (
                          <button
                            key={app}
                            type="button"
                            onClick={() =>
                              handleImportAppToggle(
                                skill.directory,
                                app,
                                !enabled
                              )
                            }
                            disabled={importSkillsMutation.isPending}
                            className={[
                              "rounded-full border px-3 py-1 text-xs transition",
                              enabled
                                ? "border-emerald-400/20 bg-emerald-400/10 text-indigo-900 dark:text-indigo-100"
                                : "border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300",
                            ].join(" ")}
                          >
                            {appLabels[app]}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {importEnabledCount > 0
                          ? isZh
                            ? `导入时将启用 ${importEnabledCount} 个应用。`
                            : `Will enable ${importEnabledCount} app${
                                importEnabledCount > 1 ? "s" : ""
                              } on import.`
                          : t(
                              "导入后会保持未启用状态，直到你手动为应用开启。",
                              "Import will keep the skill inactive until you enable an app."
                            )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImport(skill)}
                        disabled={importSkillsMutation.isPending}
                        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("导入技能", "Import skill")}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
            {t("安装目标", "Install target")}
          </div>
          <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("新安装的默认应用", "Default app for new installs")}
          </h4>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {t(
              "这里延续 cc-switch 的统一安装入口：新安装的技能会立即为所选应用启用，已有或导入技能仍可在下方按应用切换。",
              "Selecting a target app mirrors the cc-switch unified install entry: new installs enable the chosen app immediately, while existing or imported skills can be toggled per app below."
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {APP_IDS.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setCurrentApp(app)}
                className={[
                  "rounded-full border px-4 py-2 text-sm transition",
                  currentApp === app
                    ? "border-indigo-200 dark:border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-100"
                    : "border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300",
                ].join(" ")}
              >
                {appLabels[app]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
            {t("ZIP 安装", "ZIP install")}
          </div>
          <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("从本地压缩包安装", "Install from local archive")}
          </h4>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {t(
              `可粘贴本地 ZIP 路径，或使用原生选择器挑选压缩包。压缩包可包含一个或多个基于 SKILL.md 的技能目录，新安装内容默认会为 ${appLabels[currentApp]} 启用。`,
              `Paste a local ZIP path or choose an archive with the native picker. Archives may contain one skill or multiple SKILL.md-based directories, and new installs will enable ${appLabels[currentApp]} by default.`
            )}
          </p>
          <div className="mt-5 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={zipPath}
                onChange={(event) => setZipPath(event.target.value)}
                placeholder={t(
                  "/绝对路径/skills.zip",
                  "/absolute/path/to/skills.zip"
                )}
                className="min-w-0 flex-1 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:text-slate-500 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleChooseZip}
                disabled={installSkillsFromZipMutation.isPending}
                className="rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("选择 ZIP", "Browse ZIP")}
              </button>
            </div>
            <button
              type="button"
              onClick={handleZipInstall}
              disabled={
                installSkillsFromZipMutation.isPending || !zipPath.trim()
              }
              className="w-full rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-900 dark:text-indigo-100 transition hover:bg-indigo-200 dark:bg-indigo-500/20 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isZh
                ? `安装 ZIP 到 ${appLabels[currentApp]}`
                : `Install ZIP to ${appLabels[currentApp]}`}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
                {t("发现", "Discovery")}
              </div>
              <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t("可用技能", "Available skills")}
              </h4>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-3 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 dark:text-slate-400">
                {t("覆盖数", "Coverage")}
              </div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {formatCount(
                  filteredDiscoverableSkills.length,
                  discoverableSkills.length
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {isZh
              ? `当前有 ${repos.length} 个已配置仓库通过迁移后的 API 层提供。`
              : `${repos.length} configured repositories are currently exposed through the migrated API layer.`}
          </p>

          <div className="mt-6 space-y-3">
            {discoverableLoading ? (
              <EmptyState
                title={t("正在加载可发现技能", "Loading discoverable skills")}
                description={t(
                  "正在获取基于仓库的技能候选项。",
                  "Fetching repository-backed skill candidates."
                )}
              />
            ) : discoverableSkills.length === 0 ? (
              <EmptyState
                title={t("暂无可发现技能", "No discoverable skills")}
                description={t(
                  "请在 Sources 中添加或启用仓库以填充该列表。",
                  "Add or enable repositories in Sources to populate this list."
                )}
              />
            ) : filteredDiscoverableSkills.length === 0 ? (
              <EmptyState
                title={t(
                  "没有匹配搜索的可发现技能",
                  "No discoverable skills match your search"
                )}
                description={t(
                  "可尝试按技能名、目录、仓库所有者或分支进行匹配。",
                  "Try matching by skill name, directory, repo owner, or branch."
                )}
              />
            ) : (
              filteredDiscoverableSkills.map((skill) => {
                const installedSkill = installedByDiscoveryKey.get(
                  buildDiscoverableLookupKey(skill)
                );
                const alreadyEnabled =
                  installedSkill?.apps[currentApp] ?? false;
                const buttonLabel = installedSkill
                  ? alreadyEnabled
                    ? isZh
                      ? `已在 ${appLabels[currentApp]} 启用`
                      : `Enabled in ${appLabels[currentApp]}`
                    : isZh
                    ? `为 ${appLabels[currentApp]} 启用`
                    : `Enable in ${appLabels[currentApp]}`
                  : isZh
                  ? `安装到 ${appLabels[currentApp]}`
                  : `Install to ${appLabels[currentApp]}`;

                return (
                  <article
                    key={skill.key}
                    className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {skill.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                          {skill.repoOwner}/{skill.repoName} · {skill.directory}
                        </div>
                      </div>
                      <span className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
                        {skill.repoBranch}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                      {skill.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skill.readmeUrl ? (
                        <a
                          href={skill.readmeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300"
                        >
                          {t("文档", "Docs")}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleInstall(skill)}
                        disabled={
                          installSkillMutation.isPending || alreadyEnabled
                        }
                        className="rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 transition hover:bg-indigo-200 dark:bg-indigo-500/20 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
};

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm px-5 py-10 text-center">
      <div className="text-lg font-bold text-gray-900 dark:text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

type CompactMetricCardProps = {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  helper: string;
};

function CompactMetricCard({ icon: Icon, iconColor, iconBg, label, value, helper }: CompactMetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-1.5 rounded-md ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</div>
      <div className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{helper}</div>
    </div>
  );
}

type QuickInfoCardProps = {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  description: string;
};

function QuickInfoCard({ icon: Icon, iconColor, iconBg, title, value, description }: QuickInfoCardProps) {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-1.5 rounded-md ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</div>
      <div className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">{title}</div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">{description}</div>
    </div>
  );
}

function createEmptyApps(): SkillApps {
  return {
    claude: false,
    codex: false,
    gemini: false,
    opencode: false,
    openclaw: false,
  };
}

function createAppsForCurrentApp(currentApp: AppId): SkillApps {
  return {
    ...createEmptyApps(),
    [currentApp]: true,
  };
}

function getSelectedApps(
  directory: string,
  selections: Record<string, SkillApps>,
  currentApp: AppId
) {
  return selections[directory] ?? createAppsForCurrentApp(currentApp);
}

function countEnabledApps(apps: SkillApps) {
  return Object.values(apps).filter(Boolean).length;
}

function formatCount(filteredCount: number, totalCount: number) {
  return filteredCount === totalCount
    ? String(totalCount)
    : `${filteredCount}/${totalCount}`;
}

function summarizeList(values: string[], maxItems: number, isZh: boolean) {
  if (values.length <= maxItems) {
    return values.join(isZh ? "、" : ", ");
  }

  return isZh
    ? `${values.slice(0, maxItems).join("、")} 等另外 ${
        values.length - maxItems
      } 项`
    : `${values.slice(0, maxItems).join(", ")}, +${
        values.length - maxItems
      } more`;
}

function getEnabledApps(apps: SkillApps, appLabels: Record<AppId, string>) {
  return Object.entries(apps)
    .filter(([, enabled]) => enabled)
    .map(([app]) => appLabels[app as AppId]);
}

function includesQuery(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function matchesInstalledSkillSearch(
  skill: InstalledSkill,
  query: string,
  appLabels: Record<AppId, string>
) {
  if (!query) {
    return true;
  }

  return [
    skill.name,
    skill.directory,
    skill.description,
    skill.repoOwner,
    skill.repoName,
    skill.repoBranch,
    ...getEnabledApps(skill.apps, appLabels),
  ].some((value) => includesQuery(value, query));
}

function matchesDiscoverableSkillSearch(
  skill: DiscoverableSkill,
  query: string
) {
  if (!query) {
    return true;
  }

  return [
    skill.name,
    skill.directory,
    skill.description,
    skill.repoOwner,
    skill.repoName,
    skill.repoBranch,
  ].some((value) => includesQuery(value, query));
}

function matchesUnmanagedSkillSearch(skill: UnmanagedSkill, query: string) {
  if (!query) {
    return true;
  }

  return [
    skill.name,
    skill.directory,
    skill.description,
    skill.path,
    ...skill.foundIn,
  ].some((value) => includesQuery(value, query));
}

function formatUnixTime(value: number, locale: string) {
  return new Date(value * 1000).toLocaleString(locale);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === "string"
    ? error
    : null;
}

function buildInstalledLookupKey(skill: InstalledSkill) {
  if (skill.repoOwner && skill.repoName) {
    return `${skill.repoOwner.toLowerCase()}/${skill.repoName.toLowerCase()}:${skill.directory.toLowerCase()}`;
  }

  return skill.directory.toLowerCase();
}

function buildDiscoverableLookupKey(skill: DiscoverableSkill) {
  return `${skill.repoOwner.toLowerCase()}/${skill.repoName.toLowerCase()}:${skill.directory.toLowerCase()}`;
}
