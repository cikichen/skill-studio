import { useMemo, useState } from "react";
import { CheckCircle2, Inbox, Compass } from "lucide-react";
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
  Badge,
  EmptyPanel,
  PageIntro,
  StatCard,
  inputClassName as sharedInputClassName,
  primaryButtonClassName as sharedPrimaryButtonClassName,
  secondaryButtonClassName,
} from "../../shared/components/workbench-ui";
import {
  getAppLabels,
  getLocaleForLanguage,
  useI18n,
} from "../../shared/lib/i18n";

const APP_IDS: AppId[] = ["claude", "codex", "gemini", "opencode", "openclaw"];

const surfacePanelClassName =
  "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/95 lg:p-6";

const sectionCardClassName =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600";

const itemCardClassName =
  "rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600";

const neutralButtonClassName = secondaryButtonClassName;

const primaryButtonClassName = sharedPrimaryButtonClassName;

const appToggleBaseClassName =
  "rounded-md border px-2.5 py-0.5 text-[11px] transition disabled:cursor-not-allowed disabled:opacity-60";

const inputClassName = sharedInputClassName;

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
        <div className="h-[220px] rounded-2xl bg-slate-200/40 dark:bg-[#0f172a]/50" />
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
    <section className="space-y-8">
      <PageIntro
        eyebrow={t("已安装", "Installed")}
        title={t("统一技能清单", "Unified skill inventory")}
        description={t(
          "集中查看已安装技能、来源、启用应用与安装时间；下方保留跨区搜索、批量导入和本地 ZIP 安装入口。",
          "Review installed skills, source, enabled apps, and install time in one place while keeping cross-section search, batch import, and ZIP install flows close by."
        )}
        aside={
          <>
            <StatCard
              icon={CheckCircle2}
              label={t("已安装", "Installed")}
              value={formatCount(filteredInstalledSkills.length, installedSkills.length)}
              helper={t("受管技能", "Managed skills")}
              tone="blue"
            />
            <StatCard
              icon={Inbox}
              label={t("未托管", "Unmanaged")}
              value={formatCount(filteredUnmanagedSkills.length, unmanagedSkills.length)}
              helper={t("可导入候选", "Import candidates")}
              tone="amber"
            />
            <StatCard
              icon={Compass}
              label={t("发现", "Discovery")}
              value={formatCount(filteredDiscoverableSkills.length, discoverableSkills.length)}
              helper={t("仓库候选", "Repo candidates")}
              tone="violet"
            />
          </>
        }
        actions={
          <>
            <Badge tone="blue">{t("与 cc-switch 能力对齐", "cc-switch parity")}</Badge>
            <Badge tone="slate">
              {t("当前安装目标", "Install target")}: {appLabels[currentApp]}
            </Badge>
            <Badge tone="slate">
              {selectedUnmanagedSkills.length > 0
                ? `${t("批量导入", "Batch import")}: ${selectedUnmanagedSkills.length}`
                : t("批量导入未选择", "Batch import: none")}
            </Badge>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] 2xl:grid-cols-[minmax(0,1.6fr)_400px]">
        <div className="space-y-6">
          <div className="space-y-5">

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          {successFeedback ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-emerald-800 dark:text-emerald-50">
                    {successFeedback.title}
                  </div>
                  {successFeedback.details.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-emerald-700 dark:text-emerald-100/90">
                      {successFeedback.details.map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessFeedback(null)}
                  className="rounded-md border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-transparent dark:text-emerald-100 dark:hover:bg-emerald-500/10"
                >
                  {t("关闭", "Dismiss")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <div className={sectionCardClassName}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {t("快速筛选技能", "Quick find skills")}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-slate-500/80 dark:text-slate-400/80">
                    {t(
                      "支持按名称、路径或来源应用筛选。",
                      "Filter by name, path, or source app."
                    )}
                  </p>
                </div>
                {hasSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={secondaryButtonClassName}
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
                className={`mt-4 ${inputClassName}`}
              />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
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
          </div>

          <div className="mt-2 space-y-4">
            {isLoading ? (
              <EmptyPanel
                title={t("正在加载已安装技能", "Loading installed skills")}
                description={t(
                  "正在从 Rust 命令获取迁移后的技能清单。",
                  "Fetching the migrated skills inventory from Rust commands."
                )}
              />
            ) : installedSkills.length === 0 ? (
              <EmptyPanel
                title={t("还没有已安装技能", "No installed skills yet")}
                description={t(
                  "可通过发现列表、未托管导入或 ZIP 安装，把技能加入本地 Skill Studio 存储。",
                  "Use discovery, unmanaged import, or ZIP install to add skills into the local Skill Studio store."
                )}
              />
            ) : filteredInstalledSkills.length === 0 ? (
              <EmptyPanel
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
                    className={itemCardClassName}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                            {skill.name}
                          </h4>
                          <Badge tone="slate">{skill.directory}</Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                          {t("来源", "Source")}: {source}
                        </p>
                        <p className="mt-1.5 text-sm leading-snug text-slate-600 dark:text-slate-400">
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
                                  appToggleBaseClassName,
                                  enabled
                                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-100"
                                    : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
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
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {t("文档", "Docs")}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleUninstall(skill)}
                            disabled={uninstallSkillMutation.isPending}
                            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
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

        <div className={surfacePanelClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
                <div className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                  {t("未托管", "Unmanaged")}
                </div>
              <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t("导入已有本地技能", "Import existing local skills")}
              </h4>
            </div>
            <Badge tone="slate">
              {t("候选项", "Candidates")}: {formatCount(
                filteredUnmanagedSkills.length,
                unmanagedSkills.length
              )}
            </Badge>
          </div>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t(
              "扫描 ~/.skill-studio、~/.cc-switch 以及受支持应用的技能目录，寻找已包含 SKILL.md 但尚未被 Skill Studio 跟踪的技能。",
              "Scan ~/.skill-studio, ~/.cc-switch, and supported app skill folders for directories that already contain SKILL.md but are not yet tracked by Skill Studio."
            )}
          </p>

          <div className={sectionCardClassName}>
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
                    <p className="mt-1 text-[11px] font-medium text-slate-500/80 dark:text-slate-400/80">
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
                  className={neutralButtonClassName}
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
                  className={neutralButtonClassName}
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
                  className={primaryButtonClassName}
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
              <EmptyPanel
                title={t("正在扫描未托管技能", "Scanning unmanaged skills")}
                description={t(
                  "正在检查应用目录、Skill Studio 工作区和 cc-switch SSOT，寻找可导入项。",
                  "Checking app folders, the Skill Studio workspace, and cc-switch SSOT for import candidates."
                )}
              />
            ) : unmanagedSkills.length === 0 ? (
              <EmptyPanel
                title={t("未发现未托管技能", "No unmanaged skills found")}
                description={t(
                  "当本地存在但尚未进入受管已安装列表的技能时，它们会显示在这里。",
                  "Existing local skills will appear here when they exist outside the managed installed list."
                )}
              />
            ) : filteredUnmanagedSkills.length === 0 ? (
              <EmptyPanel
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
                        "rounded-xl border bg-white dark:bg-[#0f172a]/70 hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4",
                        isSelected ? "border-blue-300 dark:border-blue-500/40" : "border-gray-200 dark:border-slate-800",
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
                          className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900"
                        />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {skill.name}
                          </div>
                           <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {skill.directory} ·{" "}
                            {skill.foundIn
                              .map(formatSourceLabel)
                              .join(isZh ? "、" : ", ")}
                          </div>
                        </div>
                      </div>
                      <Badge tone="slate">{t("本地", "Local")}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-snug text-slate-600 dark:text-slate-400">
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
                               appToggleBaseClassName,
                               enabled
                                 ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-100"
                                  : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
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
                        className={primaryButtonClassName}
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
        <div className={surfacePanelClassName}>
              <div className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                {t("安装目标", "Install target")}
              </div>
          <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("新安装的默认应用", "Default app for new installs")}
          </h4>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
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
                  "rounded-md border px-4 py-2 text-sm transition",
                  currentApp === app
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-100"
                    : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                {appLabels[app]}
              </button>
            ))}
          </div>
        </div>

        <div className={surfacePanelClassName}>
              <div className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                {t("ZIP 安装", "ZIP install")}
              </div>
          <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("从本地压缩包安装", "Install from local archive")}
          </h4>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
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
                className={`min-w-0 h-11 flex-1 ${inputClassName}`}
              />
              <button
                type="button"
                onClick={handleChooseZip}
                disabled={installSkillsFromZipMutation.isPending}
                className={`h-11 ${neutralButtonClassName}`}
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
              className={`h-11 ${primaryButtonClassName}`}
            >
              {isZh
                ? `安装 ZIP 到 ${appLabels[currentApp]}`
                : `Install ZIP to ${appLabels[currentApp]}`}
            </button>
          </div>
        </div>

        <div className={surfacePanelClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
                <div className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                  {t("发现", "Discovery")}
                </div>
              <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t("可用技能", "Available skills")}
              </h4>
            </div>
            <Badge tone="slate">
              {t("覆盖数", "Coverage")}: {formatCount(
                filteredDiscoverableSkills.length,
                discoverableSkills.length
              )}
            </Badge>
          </div>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
            {isZh
              ? `当前有 ${repos.length} 个已配置仓库通过迁移后的 API 层提供。`
              : `${repos.length} configured repositories are currently exposed through the migrated API layer.`}
          </p>

          <div className="mt-6 space-y-3">
            {discoverableLoading ? (
              <EmptyPanel
                title={t("正在加载可发现技能", "Loading discoverable skills")}
                description={t(
                  "正在获取基于仓库的技能候选项。",
                  "Fetching repository-backed skill candidates."
                )}
              />
            ) : discoverableSkills.length === 0 ? (
              <EmptyPanel
                title={t("暂无可发现技能", "No discoverable skills")}
                description={t(
                  "请在 Sources 中添加或启用仓库以填充该列表。",
                  "Add or enable repositories in Sources to populate this list."
                )}
              />
            ) : filteredDiscoverableSkills.length === 0 ? (
              <EmptyPanel
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
                    className="rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {skill.name}
                        </div>
                         <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                           {skill.repoOwner}/{skill.repoName} · {skill.directory}
                         </div>
                      </div>
                      <Badge tone="violet">{skill.repoBranch}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-snug text-slate-600 dark:text-slate-400">
                      {skill.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skill.readmeUrl ? (
                        <a
                          href={skill.readmeUrl}
                          target="_blank"
                          rel="noreferrer"
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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
                        className={primaryButtonClassName}
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
  </section>
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
