import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { open } from "@tauri-apps/plugin-dialog";
import { Archive, FolderInput, GitBranchPlus, Search } from "lucide-react";
import {
  useAddSkillRepo,
  useDiscoverableSkills,
  useImportSkillsFromApps,
  useInstallSkill,
  useInstallSkillsFromZip,
  useRemoveSkillRepo,
  useSkillDetail,
  useSkillRepos,
  useUnmanagedSkills,
} from "../skills/use-skills";
import { getAppLabels, useI18n } from "../../shared/lib/i18n";
import { countEnabledApps, getErrorMessage, stripMarkdownFrontmatter } from "../../shared/lib/format";
import type {
  AppId,
  DiscoverableSkill,
  SkillApps,
  SkillDetail,
  SkillDetailInput,
  SkillRepo,
  UnmanagedSkill,
} from "../../shared/types/skills";
import { isKnownAppId } from "../../shared/types/skills";
import { useSupportedAppIds } from "../../shared/lib/tauri";
import {
  Badge,
  EmptyPanel,
  InlineAlert,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
  StatCard,
  WorkbenchHeroActions,
  WorkbenchOverview,
  dangerButtonClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  workbenchActionDockClassName,
  workbenchDetailFieldClassName,
  workbenchDetailPanelClassName,
  workbenchHeaderCardClassName,
  workbenchListItemClassName,
  workbenchMarkdownPanelClassName,
  workbenchSectionClassName,
  workbenchSegmentTriggerClassName,
  workbenchSelectedSurfaceClassName,
  workbenchSegmentedTrackClassName,
  workbenchToggleBaseClassName,
} from "../../shared/components/workbench-ui";

const toolbarShellClassName = workbenchSegmentedTrackClassName;
const toolbarChipBaseClassName = workbenchSegmentTriggerClassName;
const activeSurfaceClassName = workbenchSelectedSurfaceClassName;
const activeToggleClassName = workbenchSelectedSurfaceClassName;
const drawerSurfaceClassName =
  "flex h-full w-full max-w-[460px] flex-col border-l border-slate-200/85 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] dark:border-slate-700/85 dark:bg-slate-950/84 dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.8)]";
const INITIAL_VISIBLE_COUNT = 80;
const LOAD_MORE_COUNT = 80;

type SourceItemKind = "discoverable" | "unmanaged";
type SourceFilter = "all" | SourceItemKind;

const EMPTY_REPOS: SkillRepo[] = [];
const EMPTY_DISCOVERABLE_SKILLS: DiscoverableSkill[] = [];
const EMPTY_UNMANAGED_SKILLS: UnmanagedSkill[] = [];
const EMPTY_SUPPORTED_APP_IDS: AppId[] = [];

type SourceListEntry = {
  key: string;
  kind: SourceItemKind;
  name: string;
  description?: string | null;
  summary: string;
  meta: string;
  sourceLabel: string;
  detailInput: SkillDetailInput;
  discoverableSkill?: DiscoverableSkill;
  unmanagedSkill?: UnmanagedSkill;
};

export function SourcesPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const t = useCallback((zh: string, en: string) => (isZh ? zh : en), [isZh]);

  const reposQuery = useSkillRepos();
  const supportedAppsQuery = useSupportedAppIds();
  const discoverableQuery = useDiscoverableSkills();
  const unmanagedQuery = useUnmanagedSkills();
  const addRepoMutation = useAddSkillRepo();
  const removeRepoMutation = useRemoveSkillRepo();
  const installSkillMutation = useInstallSkill();
  const importSkillsMutation = useImportSkillsFromApps();
  const installSkillsFromZipMutation = useInstallSkillsFromZip();

  const [activeFilter, setActiveFilter] = useState<SourceFilter>("all");
  const [currentApp, setCurrentApp] = useState<AppId>("claude");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [zipPath, setZipPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingRepoKey, setPendingRepoKey] = useState<string | null>(null);
  const [pendingImportDirectory, setPendingImportDirectory] = useState<string | null>(null);
  const [pendingInstallKey, setPendingInstallKey] = useState<string | null>(null);
  const [pendingZipInstall, setPendingZipInstall] = useState(false);
  const [importSelections, setImportSelections] = useState<Record<string, SkillApps>>({});
  const [isZipToolsOpen, setIsZipToolsOpen] = useState(false);
  const [isRepoManagerOpen, setIsRepoManagerOpen] = useState(false);
  const [visibleListCount, setVisibleListCount] = useState(INITIAL_VISIBLE_COUNT);

  const repos = reposQuery.data ?? EMPTY_REPOS;
  const discoverableSkills = discoverableQuery.data ?? EMPTY_DISCOVERABLE_SKILLS;
  const unmanagedSkills = unmanagedQuery.data ?? EMPTY_UNMANAGED_SKILLS;
  const supportedAppIds = supportedAppsQuery.data ?? EMPTY_SUPPORTED_APP_IDS;
  const reposReady = reposQuery.data !== undefined;
  const discoverableReady = discoverableQuery.data !== undefined;
  const unmanagedReady = unmanagedQuery.data !== undefined;

  useEffect(() => {
    if (!supportedAppIds.length) {
      return;
    }

    if (!supportedAppIds.includes(currentApp)) {
      setCurrentApp(supportedAppIds[0]);
    }
  }, [currentApp, supportedAppIds]);

  const effectiveCurrentApp = supportedAppIds.includes(currentApp) ? currentApp : null;

  const normalizedInputQuery = searchQuery.trim().toLowerCase();
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const isSearchPending = normalizedInputQuery !== normalizedSearchQuery;

  const discoverableEntries = useMemo<SourceListEntry[]>(
    () =>
      discoverableSkills
        .filter((skill) => matchesDiscoverableSkillSearch(skill, normalizedSearchQuery))
        .map((skill) => ({
          key: `discoverable:${skill.key}`,
          kind: "discoverable",
          name: skill.name,
          description: skill.description,
          summary: skill.directory,
          meta: `${skill.repoOwner}/${skill.repoName} · ${skill.repoBranch}`,
          sourceLabel: `${skill.repoOwner}/${skill.repoName}`,
          detailInput: {
            kind: "discoverable",
            name: skill.name,
            directory: skill.directory,
            description: skill.description,
            readmeUrl: skill.readmeUrl,
            repoOwner: skill.repoOwner,
            repoName: skill.repoName,
            repoBranch: skill.repoBranch,
          },
          discoverableSkill: skill,
        })),
    [discoverableSkills, normalizedSearchQuery]
  );

  const unmanagedEntries = useMemo<SourceListEntry[]>(
    () =>
      unmanagedSkills
        .filter((skill) => matchesUnmanagedSkillSearch(skill, normalizedSearchQuery))
        .map((skill) => ({
          key: `unmanaged:${skill.directory}`,
          kind: "unmanaged",
          name: skill.name,
          description: skill.description,
          summary: skill.directory,
          meta: t("待导入", "Ready to import"),
          sourceLabel: skill.foundIn.map((source) => formatSourceLabel(source, appLabels, isZh)).join(isZh ? "、" : ", "),
          detailInput: {
            kind: "unmanaged",
            name: skill.name,
            directory: skill.directory,
            description: skill.description,
            path: skill.path,
            foundIn: skill.foundIn,
          },
          unmanagedSkill: skill,
        })),
    [unmanagedSkills, normalizedSearchQuery, appLabels, isZh, t]
  );

  const allEntries = useMemo(() => [...discoverableEntries, ...unmanagedEntries], [discoverableEntries, unmanagedEntries]);

  const visibleEntries = useMemo(() => {
    if (activeFilter === "all") {
      return allEntries;
    }
    return allEntries.filter((item) => item.kind === activeFilter);
  }, [activeFilter, allEntries]);

  useEffect(() => {
    setVisibleListCount(INITIAL_VISIBLE_COUNT);
  }, [activeFilter, normalizedSearchQuery, visibleEntries.length]);

  useEffect(() => {
    if (visibleEntries.length === 0) {
      setSelectedItemKey(null);
      return;
    }

    if (selectedItemKey && visibleEntries.some((item) => item.key === selectedItemKey)) {
      return;
    }

    setSelectedItemKey(visibleEntries[0].key);
  }, [visibleEntries, selectedItemKey]);

  const renderedEntries = useMemo(
    () => visibleEntries.slice(0, visibleListCount),
    [visibleEntries, visibleListCount]
  );
  const hasMoreEntries = renderedEntries.length < visibleEntries.length;

  const selectedEntry = visibleEntries.find((item) => item.key === selectedItemKey) ?? null;
  const selectedDetailQuery = useSkillDetail(selectedEntry?.detailInput ?? null, {
    enabled: selectedEntry !== null,
  });
  const selectedDetail = selectedDetailQuery.data ?? selectedEntry?.detailInput ?? null;

  const errorMessage =
    error ??
    getErrorMessage(reposQuery.error) ??
    getErrorMessage(discoverableQuery.error) ??
    getErrorMessage(unmanagedQuery.error) ??
    getErrorMessage(supportedAppsQuery.error) ??
    getErrorMessage(selectedDetailQuery.error);

  const handleLoadMore = useCallback(() => {
    setVisibleListCount((current) => current + LOAD_MORE_COUNT);
  }, []);

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
  }

  async function handleChooseZip() {
    setError(null);
    setSuccessMessage(null);

    try {
      const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [{ name: t("ZIP 压缩包", "ZIP archives"), extensions: ["zip"] }],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return;
      }

      setZipPath(selectedPath);
      setIsZipToolsOpen(true);
    } catch (dialogError) {
      setError(getErrorMessage(dialogError) ?? t("打开 ZIP 选择器失败。", "Failed to open ZIP picker."));
    }
  }

  async function handleZipInstall() {
    if (!effectiveCurrentApp) {
      setError(t("当前没有可用宿主，无法从 ZIP 安装。", "No supported host is available for ZIP installation right now."));
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setPendingZipInstall(true);

    try {
      const installedFromZip = await installSkillsFromZipMutation.mutateAsync({
        filePath: zipPath.trim(),
        currentApp: effectiveCurrentApp,
      });
      setZipPath("");
      setIsZipToolsOpen(false);
      setSuccessMessage(
        installedFromZip.length === 1
          ? t(
              `已从 ZIP 安装 ${installedFromZip[0].name}，并默认启用到 ${appLabels[effectiveCurrentApp]}。`,
              `Installed ${installedFromZip[0].name} from ZIP and enabled it in ${appLabels[effectiveCurrentApp]}.`
            )
          : t(
              `已从 ZIP 安装 ${installedFromZip.length} 个技能，并默认启用到 ${appLabels[effectiveCurrentApp]}。`,
              `Installed ${installedFromZip.length} skills from ZIP and enabled them in ${appLabels[effectiveCurrentApp]}.`
            )
      );
    } catch (mutationError) {
      setError(getErrorMessage(mutationError) ?? t("从 ZIP 安装技能失败。", "Failed to install skills from ZIP."));
    } finally {
      setPendingZipInstall(false);
    }
  }

  async function handleInstall(skill: DiscoverableSkill) {
    if (!effectiveCurrentApp) {
      setError(t("当前没有可用宿主，无法安装技能。", "No supported host is available for installation right now."));
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setPendingInstallKey(skill.key);

    try {
      const installedSkill = await installSkillMutation.mutateAsync({ skill, currentApp: effectiveCurrentApp });
      setSuccessMessage(
        t(
          `已安装 ${installedSkill.name}，并默认启用到 ${appLabels[effectiveCurrentApp]}。`,
          `Installed ${installedSkill.name} and enabled it in ${appLabels[effectiveCurrentApp]}.`
        )
      );
    } catch (mutationError) {
      setError(getErrorMessage(mutationError) ?? t("安装技能失败。", "Failed to install skill."));
    } finally {
      setPendingInstallKey(null);
    }
  }

  async function handleImport(skill: UnmanagedSkill) {
    const selectedApps = getSelectedApps(skill.directory, importSelections, supportedAppIds, effectiveCurrentApp);
    const enabledCount = countEnabledApps(selectedApps);

    setError(null);
    setSuccessMessage(null);
    setPendingImportDirectory(skill.directory);

    try {
      const importedSkills = await importSkillsMutation.mutateAsync([
        {
          directory: skill.directory,
          apps: selectedApps,
        },
      ]);

      clearImportStateForDirectories([skill.directory]);
      const importedSkill = importedSkills[0];
      setSuccessMessage(
        importedSkill
          ? enabledCount > 0
            ? t(
                `已导入 ${importedSkill.name}，并启用 ${enabledCount} 个目标应用。`,
                `Imported ${importedSkill.name} and enabled ${enabledCount} target apps.`
              )
            : t(
                `已导入 ${importedSkill.name}，当前保持未启用。`,
                `Imported ${importedSkill.name} and kept it inactive.`
              )
          : t(
              `${skill.directory} 已纳入管理，无需重复导入。`,
              `${skill.directory} is already managed and does not need to be imported again.`
            )
      );
    } catch (mutationError) {
      setError(getErrorMessage(mutationError) ?? t("导入未托管技能失败。", "Failed to import unmanaged skill."));
    } finally {
      setPendingImportDirectory(null);
    }
  }

  const handleImportAppToggle = useCallback(
    (directory: string, app: AppId, enabled: boolean) => {
      setImportSelections((currentSelections) => ({
        ...currentSelections,
        [directory]: {
          ...getSelectedApps(directory, currentSelections, supportedAppIds, effectiveCurrentApp),
          [app]: enabled,
        },
      }));
    },
    [effectiveCurrentApp, supportedAppIds]
  );

  async function handleAddRepo() {
    setError(null);
    const parsed = parseRepoUrl(repoUrl);

    if (!parsed) {
      setError(t("请输入 owner/name 或完整的 GitHub 仓库 URL。", "Use owner/name or a full GitHub repository URL."));
      return;
    }

    try {
      await addRepoMutation.mutateAsync({
        owner: parsed.owner,
        name: parsed.name,
        branch: branch.trim() || "main",
        enabled: true,
      });
      setRepoUrl("");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError) ?? t("添加仓库失败。", "Failed to add repository."));
    }
  }

  async function handleRemoveRepo(repo: SkillRepo) {
    setError(null);
    const repoKey = `${repo.owner}/${repo.name}`;
    setPendingRepoKey(repoKey);

    try {
      await removeRepoMutation.mutateAsync({ owner: repo.owner, name: repo.name });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError) ?? t("移除仓库失败。", "Failed to remove repository."));
    } finally {
      setPendingRepoKey(null);
    }
  }

  const handleSelectItem = useCallback((key: string) => {
    setSelectedItemKey((currentKey) => (currentKey === key ? currentKey : key));
  }, []);

  return (
    <PageLayout className="flex min-h-0 flex-1 flex-col">
      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}
      {successMessage ? <InlineAlert tone="emerald" className="rounded-[18px] px-3.5 py-3">{successMessage}</InlineAlert> : null}

      <WorkbenchOverview
        eyebrow={t("来源", "Sources")}
        title={t("来源工作台", "Source workbench")}
        description={t(
          "在左侧筛选来源技能，右侧直接阅读 README，并把安装或导入动作压缩成底部一条连续流程。",
          "Filter source skills on the left, read the README directly on the right, and keep install or import as one continuous dock at the bottom."
        )}
        stats={
          <>
            <StatCard
              label={t("可发现", "Discoverable")}
              value={discoverableReady ? String(discoverableSkills.length) : "—"}
              helper={t("来自受管仓库", "From managed repositories")}
              tone="violet"
            />
            <StatCard
              label={t("未托管", "Unmanaged")}
              value={unmanagedReady ? String(unmanagedSkills.length) : "—"}
              helper={t("可直接纳入管理", "Ready to import")}
              tone="amber"
            />
            <StatCard
              label={t("当前结果", "Visible")}
              value={String(visibleEntries.length)}
              helper={t("随筛选与搜索变化", "Changes with filters and search")}
              tone="blue"
            />
          </>
        }
        actions={
          <WorkbenchHeroActions className="border-none bg-transparent p-0 dark:bg-transparent">
            <button
              type="button"
              onClick={() => setIsZipToolsOpen((current) => !current)}
              className={secondaryButtonClassName}
            >
              <Archive className="h-3.5 w-3.5" />
              {isZipToolsOpen ? t("收起 ZIP 安装", "Hide ZIP install") : t("ZIP 安装", "ZIP install")}
            </button>
            <button
              type="button"
              onClick={() => setIsRepoManagerOpen(true)}
              className={secondaryButtonClassName}
            >
              <GitBranchPlus className="h-3.5 w-3.5" />
              {t("管理仓库", "Manage repos")}
            </button>
            {discoverableQuery.isFetching || unmanagedQuery.isFetching ? (
              <QueryHint tone="slate">{t("刷新中", "Refreshing")}</QueryHint>
            ) : null}
          </WorkbenchHeroActions>
        }
      />

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.82fr)] 2xl:grid-cols-[minmax(300px,0.74fr)_minmax(0,1.9fr)]">
        <Panel
          eyebrow={t("浏览器", "Browser")}
          title={t("来源目录", "Source catalog")}
          density="compact"
          className="flex h-full min-h-0 flex-col overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className={toolbarShellClassName}>
              <div className="flex flex-col gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("搜索技能、仓库、路径或来源", "Search skills, repos, paths, or origins")}
                    className={`h-8 min-w-0 text-[12px] pl-9 ${inputClassName}`}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", label: t("全部", "All"), count: allEntries.length },
                    { key: "discoverable", label: t("可发现", "Discoverable"), count: discoverableEntries.length },
                    { key: "unmanaged", label: t("未托管", "Unmanaged"), count: unmanagedEntries.length },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key as SourceFilter)}
                      className={[
                        toolbarChipBaseClassName,
                        activeFilter === filter.key ? activeToggleClassName : "text-slate-600 dark:text-slate-300",
                      ].join(" ")}
                    >
                      <span>{filter.label}</span>
                      <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-500 dark:bg-slate-700 dark:text-slate-300">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isSearchPending ? (
                <div className="mt-2 px-1">
                  <QueryHint tone="slate">{t("正在筛选…", "Filtering…")}</QueryHint>
                </div>
              ) : null}
            </div>

            {isZipToolsOpen ? (
              <ZipInstallPanel
                currentApp={effectiveCurrentApp}
                supportedAppIds={supportedAppIds}
                appLabels={appLabels}
                zipPath={zipPath}
                pendingZipInstall={pendingZipInstall}
                onSelectApp={setCurrentApp}
                onChangeZipPath={setZipPath}
                onChooseZip={handleChooseZip}
                onInstall={handleZipInstall}
                isZh={isZh}
              />
            ) : null}

            <SourceListSection
              loading={!discoverableReady || !unmanagedReady}
              emptyText={
                normalizedSearchQuery
                  ? t("没有匹配的来源技能。", "No source skills match the search.")
                  : t("当前没有可浏览的来源技能。", "No source skills are available to browse right now.")
              }
              items={renderedEntries}
              hasMore={hasMoreEntries}
              onLoadMore={handleLoadMore}
              selectedItemKey={selectedItemKey}
              onSelect={handleSelectItem}
              isZh={isZh}
            />
          </div>
        </Panel>

        <Panel
          eyebrow={t("README", "README")}
          title={selectedEntry ? selectedEntry.name : t("来源详情台", "Source detail desk")}
          action={
            selectedEntry && selectedDetailQuery.isFetching ? (
              <QueryHint tone="blue">{t("正在刷新详情", "Refreshing details")}</QueryHint>
            ) : null
          }
          density="compact"
          className="flex h-full min-h-0 flex-col overflow-hidden"
        >
          {!selectedEntry ? (
            <EmptyPanel
              title={t("先选择一个来源技能", "Select a source skill first")}
              description={t(
                "左侧选中条目后，右侧会直接显示 README 内容。",
                "Select an item on the left to show the README content here."
              )}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <div className={workbenchHeaderCardClassName}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={selectedEntry.kind === "discoverable" ? "violet" : "amber"}>
                      {selectedEntry.kind === "discoverable" ? t("可安装", "Installable") : t("可导入", "Importable")}
                    </Badge>
                    <Badge tone="slate">{selectedEntry.sourceLabel}</Badge>
                    <Badge tone="blue">{selectedEntry.meta}</Badge>
                  </div>
                  <div className="mt-2 text-[15px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                    {selectedEntry.name}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{selectedEntry.summary}</div>
                  {selectedEntry.description ? (
                    <p className="mt-2.5 max-w-3xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                      {selectedEntry.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className={`${workbenchDetailPanelClassName} min-h-0 flex-1`}>
                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <SkillDetailContent detail={selectedDetail} appLabels={appLabels} isZh={isZh} />
                </div>
              </div>

              {selectedEntry.kind === "discoverable" && selectedEntry.discoverableSkill ? (
                <DiscoverableSourceActions
                  skill={selectedEntry.discoverableSkill}
                  currentApp={effectiveCurrentApp}
                  supportedAppIds={supportedAppIds}
                  appLabels={appLabels}
                  pendingInstallKey={pendingInstallKey}
                  onSelectApp={setCurrentApp}
                  onInstall={handleInstall}
                  isZh={isZh}
                />
              ) : selectedEntry.unmanagedSkill ? (
                <UnmanagedSourceActions
                  skill={selectedEntry.unmanagedSkill}
                  currentApp={effectiveCurrentApp}
                  supportedAppIds={supportedAppIds}
                  appLabels={appLabels}
                  importSelections={importSelections}
                  pendingImportDirectory={pendingImportDirectory}
                  onToggle={handleImportAppToggle}
                  onImport={handleImport}
                  isZh={isZh}
                />
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {isRepoManagerOpen ? (
        <RepoManagerOverlay
          repoUrl={repoUrl}
          branch={branch}
          repos={repos}
          reposReady={reposReady}
          reposLoading={reposQuery.isLoading}
          addRepoPending={addRepoMutation.isPending}
          pendingRepoKey={pendingRepoKey}
          onClose={() => setIsRepoManagerOpen(false)}
          onRepoUrlChange={setRepoUrl}
          onBranchChange={setBranch}
          onAddRepo={handleAddRepo}
          onRemoveRepo={handleRemoveRepo}
          isZh={isZh}
        />
      ) : null}
    </PageLayout>
  );
}

function SourceListSection({
  loading,
  emptyText,
  items,
  hasMore,
  onLoadMore,
  selectedItemKey,
  onSelect,
  isZh,
}: {
  loading: boolean;
  emptyText: string;
  items: SourceListEntry[];
  hasMore: boolean;
  onLoadMore: () => void;
  selectedItemKey: string | null;
  onSelect: (key: string) => void;
  isZh: boolean;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {loading ? (
        <SectionSkeleton rows={4} compact />
      ) : items.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <MemoizedSourceListItem
              key={item.key}
              item={item}
              selected={item.key === selectedItemKey}
              onSelect={onSelect}
              isZh={isZh}
            />
          ))}

          {hasMore ? (
            <button type="button" onClick={onLoadMore} className={`w-full ${secondaryButtonClassName}`}>
              {isZh ? "继续加载更多" : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

const MemoizedSourceListItem = memo(function SourceListItem({
  item,
  selected,
  onSelect,
  isZh,
}: {
  item: SourceListEntry;
  selected: boolean;
  onSelect: (key: string) => void;
  isZh: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      className={[
        workbenchListItemClassName,
        selected ? activeSurfaceClassName : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
            item.kind === "discoverable"
              ? "border-violet-200/80 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/14 dark:text-violet-200"
              : "border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/14 dark:text-amber-200",
          ].join(" ")}
        >
          {item.kind === "discoverable" ? <Search className="h-3 w-3" /> : <FolderInput className="h-3 w-3" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{item.name}</div>
              <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{item.summary}</div>
            </div>
            <Badge tone={item.kind === "discoverable" ? "violet" : "amber"}>
              {item.kind === "discoverable" ? (isZh ? "安装" : "Install") : isZh ? "导入" : "Import"}
            </Badge>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate font-medium text-slate-600 dark:text-slate-300">{item.sourceLabel}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="truncate">{item.meta}</span>
          </div>
        </div>
      </div>
    </button>
  );
});


function DiscoverableSourceActions({
  skill,
  currentApp,
  supportedAppIds,
  appLabels,
  pendingInstallKey,
  onSelectApp,
  onInstall,
  isZh,
}: {
  skill: DiscoverableSkill;
  currentApp: AppId | null;
  supportedAppIds: AppId[];
  appLabels: Record<AppId, string>;
  pendingInstallKey: string | null;
  onSelectApp: (app: AppId) => void;
  onInstall: (skill: DiscoverableSkill) => void;
  isZh: boolean;
}) {
  const hasSupportedApps = supportedAppIds.length > 0;

  return (
    <div className={workbenchActionDockClassName}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? "安装流程" : "Install workflow"}
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            {isZh
              ? `先确认目标应用，再把 ${skill.name} 直接装入当前工作区。`
              : `Confirm the target app, then install ${skill.name} straight into the current workspace.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onInstall(skill)}
          disabled={pendingInstallKey === skill.key || !currentApp}
          className={primaryButtonClassName}
        >
          {pendingInstallKey === skill.key
            ? (isZh ? "安装中…" : "Installing…")
            : currentApp
              ? isZh
                ? `安装到 ${appLabels[currentApp]}`
                : `Install to ${appLabels[currentApp]}`
              : isZh
                ? "暂无可用宿主"
                : "No supported host"}
        </button>
      </div>

      {hasSupportedApps ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {supportedAppIds.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => onSelectApp(app)}
              disabled={pendingInstallKey === skill.key}
              className={[workbenchToggleBaseClassName, currentApp === app ? activeToggleClassName : ""].join(" ")}
            >
              {appLabels[app]}
            </button>
          ))}
        </div>
      ) : (
        <InlineAlert tone="slate" className="mt-3">
          {isZh ? "当前没有可用宿主，暂时无法安装。" : "No supported hosts are available right now, so installation is temporarily unavailable."}
        </InlineAlert>
      )}
    </div>
  );
}

function UnmanagedSourceActions({
  skill,
  currentApp,
  supportedAppIds,
  appLabels,
  importSelections,
  pendingImportDirectory,
  onToggle,
  onImport,
  isZh,
}: {
  skill: UnmanagedSkill;
  currentApp: AppId | null;
  supportedAppIds: AppId[];
  appLabels: Record<AppId, string>;
  importSelections: Record<string, SkillApps>;
  pendingImportDirectory: string | null;
  onToggle: (directory: string, app: AppId, enabled: boolean) => void;
  onImport: (skill: UnmanagedSkill) => void;
  isZh: boolean;
}) {
  const selectedApps = getSelectedApps(skill.directory, importSelections, supportedAppIds, currentApp);
  const enabledCount = countEnabledApps(selectedApps);
  const isPending = pendingImportDirectory === skill.directory;
  const hasSupportedApps = supportedAppIds.length > 0;

  return (
    <div className={workbenchActionDockClassName}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? "导入流程" : "Import workflow"}
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            {isZh
              ? "把当前目录纳入管理，并按需同步到目标应用。"
              : "Bring this directory under management and sync it to the target apps you want."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onImport(skill)}
          disabled={isPending || !hasSupportedApps}
          className={primaryButtonClassName}
        >
          {isPending ? (isZh ? "导入中…" : "Importing…") : isZh ? `导入到 ${enabledCount} 个应用` : `Import to ${enabledCount} apps`}
        </button>
      </div>

      {hasSupportedApps ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {supportedAppIds.map((app) => {
            const enabled = selectedApps[app];
            return (
              <button
                key={app}
                type="button"
                onClick={() => onToggle(skill.directory, app, !enabled)}
                disabled={isPending}
                className={[workbenchToggleBaseClassName, enabled ? activeToggleClassName : ""].join(" ")}
              >
                {appLabels[app]}
              </button>
            );
          })}
        </div>
      ) : (
        <InlineAlert tone="slate" className="mt-3">
          {isZh ? "当前没有可用宿主，暂时无法导入。" : "No supported hosts are available right now, so import is temporarily unavailable."}
        </InlineAlert>
      )}
    </div>
  );
}

function ZipInstallPanel({
  currentApp,
  supportedAppIds,
  appLabels,
  zipPath,
  pendingZipInstall,
  onSelectApp,
  onChangeZipPath,
  onChooseZip,
  onInstall,
  isZh,
}: {
  currentApp: AppId | null;
  supportedAppIds: AppId[];
  appLabels: Record<AppId, string>;
  zipPath: string;
  pendingZipInstall: boolean;
  onSelectApp: (app: AppId) => void;
  onChangeZipPath: (value: string) => void;
  onChooseZip: () => void;
  onInstall: () => void;
  isZh: boolean;
}) {
  return (
    <div className={workbenchActionDockClassName}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {isZh ? "ZIP 接入" : "ZIP intake"}
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            {isZh
              ? "选定目标应用后，从本地 ZIP 直接导入并完成默认启用。"
              : "Choose the target app, then import from a local ZIP and enable it by default."}
          </p>
        </div>
        <button
          type="button"
          onClick={onInstall}
          disabled={pendingZipInstall || !zipPath.trim() || !currentApp}
          className={primaryButtonClassName}
        >
          {pendingZipInstall
            ? (isZh ? "安装中…" : "Installing…")
            : currentApp
              ? isZh
                ? `安装到 ${appLabels[currentApp]}`
                : `Install to ${appLabels[currentApp]}`
              : isZh
                ? "暂无可用宿主"
                : "No supported host"}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? "目标应用" : "Target app"}
          </div>
          {supportedAppIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {supportedAppIds.map((app) => (
                <button
                  key={app}
                  type="button"
                  onClick={() => onSelectApp(app)}
                  className={[workbenchToggleBaseClassName, currentApp === app ? activeToggleClassName : ""].join(" ")}
                >
                  {appLabels[app]}
                </button>
              ))}
            </div>
          ) : (
            <InlineAlert tone="slate">
              {isZh ? "当前没有可用宿主，暂时无法从 ZIP 安装。" : "No supported hosts are available right now, so ZIP installation is temporarily unavailable."}
            </InlineAlert>
          )}
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? "ZIP 文件" : "ZIP file"}
          </div>
          <div className="flex flex-col gap-2 xl:flex-row">
            <input
              value={zipPath}
              onChange={(event) => onChangeZipPath(event.target.value)}
              placeholder={isZh ? "/绝对路径/skills.zip" : "/absolute/path/to/skills.zip"}
              className={`min-w-0 flex-1 ${inputClassName}`}
            />
            <button type="button" onClick={onChooseZip} disabled={pendingZipInstall} className={secondaryButtonClassName}>
              {isZh ? "选择 ZIP" : "Browse ZIP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepoManagerOverlay({
  repoUrl,
  branch,
  repos,
  reposReady,
  reposLoading,
  addRepoPending,
  pendingRepoKey,
  onClose,
  onRepoUrlChange,
  onBranchChange,
  onAddRepo,
  onRemoveRepo,
  isZh,
}: {
  repoUrl: string;
  branch: string;
  repos: SkillRepo[];
  reposReady: boolean;
  reposLoading: boolean;
  addRepoPending: boolean;
  pendingRepoKey: string | null;
  onClose: () => void;
  onRepoUrlChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onAddRepo: () => void;
  onRemoveRepo: (repo: SkillRepo) => void;
  isZh: boolean;
}) {
  const t = (zh: string, en: string) => (isZh ? zh : en);

  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-slate-950/28">
      <div className={drawerSurfaceClassName}>
        <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {t("仓库抽屉", "Repository drawer")}
              </div>
              <div className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
                {t("管理来源仓库", "Manage source repositories")}
              </div>
              <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">
                {t(
                  "这里集中处理仓库接入与移除，主工作台保持浏览与动作连续性。",
                  "Handle repository add and removal here so the main workbench stays focused on browsing and actions."
                )}
              </p>
            </div>
            <button type="button" onClick={onClose} className={secondaryButtonClassName}>
              {t("关闭", "Close")}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <div className={workbenchSectionClassName}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {t("新增仓库", "Add repository")}
            </div>
            <div className="mt-3 grid gap-2.5">
              <input
                value={repoUrl}
                onChange={(event) => onRepoUrlChange(event.target.value)}
                placeholder={isZh ? "owner/name 或 https://github.com/owner/name" : "owner/name or https://github.com/owner/name"}
                className={inputClassName}
              />
              <div className="flex gap-2">
                <input
                  value={branch}
                  onChange={(event) => onBranchChange(event.target.value)}
                  placeholder={t("分支", "Branch")}
                  className={inputClassName}
                />
                <button type="button" onClick={onAddRepo} disabled={addRepoPending} className={primaryButtonClassName}>
                  {addRepoPending ? t("添加中…", "Adding…") : t("添加仓库", "Add repo")}
                </button>
              </div>
            </div>
          </div>

          <div className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {!reposReady && reposLoading ? (
                <SectionSkeleton rows={3} compact />
              ) : repos.length === 0 ? (
                <EmptyPanel
                  title={t("还没有配置仓库", "No repositories yet")}
                  description={t(
                    "添加仓库后，左侧目录会出现对应的可发现技能。",
                    "After adding a repository, discoverable skills from it will appear in the left catalog."
                  )}
                />
              ) : (
                repos.map((repo) => {
                  const repoKey = `${repo.owner}/${repo.name}`;
                  const isPending = pendingRepoKey === repoKey;

                  return (
                    <article key={repoKey} className={workbenchDetailFieldClassName}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{repoKey}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{repo.branch}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveRepo(repo)}
                          disabled={isPending}
                          className={dangerButtonClassName}
                        >
                          {isPending ? t("移除中…", "Removing…") : t("移除", "Remove")}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillDetailContent({
  detail,
  appLabels,
  isZh,
}: {
  detail: SkillDetailInput | SkillDetail | null;
  appLabels: Record<AppId, string>;
  isZh: boolean;
}) {
  if (!detail) {
    return null;
  }

  const readmeContent =
    "readmeContent" in detail ? stripMarkdownFrontmatter(detail.readmeContent) : null;

  if (readmeContent) {
    return (
      <div className={workbenchMarkdownPanelClassName}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
      </div>
    );
  }

  const detailDescription = detail.description?.trim();
  const enabledApps = detail.apps ? getEnabledApps(detail.apps, appLabels) : [];
  const source =
    detail.repoOwner && detail.repoName
      ? `${detail.repoOwner}/${detail.repoName}`
      : detail.kind === "unmanaged" && detail.foundIn && detail.foundIn.length > 0
        ? detail.foundIn.map((item) => formatSourceLabel(item, appLabels, isZh)).join(isZh ? "、" : ", ")
        : null;

  const detailFields = [
    source ? { label: isZh ? "来源" : "Source", value: source } : null,
    detail.path ? { label: isZh ? "路径" : "Path", value: detail.path, mono: true } : null,
    { label: isZh ? "目录" : "Directory", value: detail.directory, mono: true },
    detail.foundIn && detail.foundIn.length > 0
      ? {
          label: isZh ? "发现于" : "Found in",
          value: detail.foundIn.map((item) => formatSourceLabel(item, appLabels, isZh)).join(isZh ? "、" : ", "),
        }
      : null,
    enabledApps.length > 0
      ? {
          label: isZh ? "启用应用" : "Enabled apps",
          value: enabledApps.join(isZh ? "、" : ", "),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: ReactNode; mono?: boolean }>;

  if (detailFields.length === 0 && !detailDescription) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {isZh ? "当前还没有可显示的 README 或详情字段。" : "No README or detail fields are available yet."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {detailDescription ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{detailDescription}</p> : null}

      {detailFields.length > 0 ? (
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? "当前详情" : "Current details"}
          </div>
          <div className="grid gap-2.5 lg:grid-cols-2">
            {detailFields.map((field) => (
              <DetailField key={field.label} label={field.label} value={field.value} mono={field.mono} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className={workbenchDetailFieldClassName}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</div>
      <div
        className={[
          "mt-2 text-sm text-slate-800 dark:text-slate-100",
          mono ? "break-all font-mono text-[13px] text-slate-600 dark:text-slate-300" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function createEmptyApps(supportedAppIds?: readonly AppId[]): SkillApps {
  const apps: SkillApps = {
    claude: false,
    codex: false,
    gemini: false,
    opencode: false,
    openclaw: false,
  };

  if (!supportedAppIds?.length) {
    return apps;
  }

  (Object.keys(apps) as AppId[]).forEach((app) => {
    if (!supportedAppIds.includes(app)) {
      apps[app] = false;
    }
  });

  return apps;
}

function createAppsForCurrentApp(currentApp: AppId | null, supportedAppIds?: readonly AppId[]): SkillApps {
  const apps = createEmptyApps(supportedAppIds);

  if (currentApp) {
    apps[currentApp] = true;
  }

  return apps;
}

function getSelectedApps(
  directory: string,
  selections: Record<string, SkillApps>,
  supportedAppIds?: readonly AppId[],
  currentApp?: AppId | null
) {
  return selections[directory] ?? createAppsForCurrentApp(currentApp ?? null, supportedAppIds);
}

function getEnabledApps(apps: SkillApps, appLabels: Record<AppId, string>, supportedAppIds?: readonly AppId[]) {
  const targetApps = supportedAppIds?.length ? supportedAppIds : (Object.keys(apps) as AppId[]);

  return targetApps.filter((app) => apps[app]).map((app) => appLabels[app]);
}

function formatSourceLabel(source: string, appLabels: Record<AppId, string>, isZh: boolean) {
  const normalized = source.toLowerCase();

  if (normalized === "skill-studio") {
    return isZh ? "Skill Studio 工作区" : "Skill Studio workspace";
  }

  if (normalized === "cc-switch") {
    return "cc-switch";
  }

  if (isKnownAppId(normalized)) {
    return appLabels[normalized];
  }

  return source;
}

function includesQuery(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function matchesDiscoverableSkillSearch(skill: DiscoverableSkill, query: string) {
  if (!query) {
    return true;
  }

  return [skill.name, skill.directory, skill.description, skill.repoOwner, skill.repoName, skill.repoBranch].some((value) => includesQuery(value, query));
}

function matchesUnmanagedSkillSearch(skill: UnmanagedSkill, query: string) {
  if (!query) {
    return true;
  }

  return [skill.name, skill.directory, skill.description, skill.path, ...skill.foundIn].some((value) => includesQuery(value, query));
}

function parseRepoUrl(input: string) {
  const cleaned = input.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  const parts = cleaned.split("/").filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  return {
    owner: parts[0],
    name: parts[1],
  };
}
