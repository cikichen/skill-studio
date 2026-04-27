import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link2, Search } from "lucide-react";
import {
  useInstalledSkills,
  useSkillDetail,
  useToggleSkillApp,
  useUninstallSkill,
} from "./use-skills";
import type {
  AppId,
  InstalledSkill,
  SkillApps,
  SkillDetail,
  SkillDetailInput,
} from "../../shared/types/skills";
import {
  Badge,
  ConfirmActionDialog,
  EmptyPanel,
  InlineAlert,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
  WorkbenchHeroActions,
  WorkbenchOverview,
  dangerButtonClassName,
  inputClassName,
  secondaryButtonClassName,
  workbenchActionDockClassName,
  workbenchDetailFieldClassName,
  workbenchDetailPanelClassName,
  workbenchGlassCardClassName,
  workbenchListItemClassName,
  workbenchMarkdownPanelClassName,
  workbenchSelectedSurfaceClassName,
  workbenchSegmentedTrackClassName,
  workbenchToggleBaseClassName,
} from "../../shared/components/workbench-ui";
import { getAppLabels, getLocaleForLanguage, useI18n } from "../../shared/lib/i18n";
import { useInstalledAppIds } from "../../shared/lib/tauri";
import { countEnabledApps, formatUnixTime, getErrorMessage, stripMarkdownFrontmatter } from "../../shared/lib/format";

const EMPTY_INSTALLED_SKILLS: InstalledSkill[] = [];
const EMPTY_SUPPORTED_APP_IDS: AppId[] = [];
const toolbarShellClassName = workbenchSegmentedTrackClassName;
const activeSurfaceClassName = workbenchSelectedSurfaceClassName;
const activeToggleClassName = workbenchSelectedSurfaceClassName;

type TranslateFn = (zh: string, en: string) => string;

type SuccessFeedback = {
  title: string;
  details: string[];
};

type InstalledListEntry = {
  key: string;
  name: string;
  description?: string | null;
  summary: string;
  meta: string;
  statusLabel: string;
  sourceLabel: string;
  detailInput: SkillDetailInput;
  installedSkill: InstalledSkill;
};

export function SkillsPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const t = useCallback((zh: string, en: string) => (isZh ? zh : en), [isZh]);

  const [actionError, setActionError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<SuccessFeedback | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [pendingToggleKey, setPendingToggleKey] = useState<string | null>(null);
  const [pendingUninstallId, setPendingUninstallId] = useState<string | null>(null);
  const [confirmingUninstallSkill, setConfirmingUninstallSkill] = useState<InstalledSkill | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const installedQuery = useInstalledSkills();
  const installedAppsQuery = useInstalledAppIds();
  const toggleSkillAppMutation = useToggleSkillApp();
  const uninstallSkillMutation = useUninstallSkill();

  const installedSkills = installedQuery.data ?? EMPTY_INSTALLED_SKILLS;
  const supportedAppIds = installedAppsQuery.data ?? EMPTY_SUPPORTED_APP_IDS;
  const normalizedInputQuery = searchQuery.trim().toLowerCase();
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const isSearchPending = normalizedInputQuery !== normalizedSearchQuery;

  const filteredInstalledSkills = useMemo(
    () => installedSkills.filter((skill) => matchesInstalledSkillSearch(skill, normalizedSearchQuery, appLabels, supportedAppIds)),
    [installedSkills, normalizedSearchQuery, appLabels, supportedAppIds]
  );

  const installedEntries = useMemo<InstalledListEntry[]>(
    () =>
      filteredInstalledSkills.map((skill) => {
        const enabledCount = countEnabledApps(skill.apps);

        return {
          key: `installed:${skill.id}`,
          name: skill.name,
          description: skill.description,
          summary: skill.directory,
          meta:
            enabledCount > 0
              ? isZh
                ? `已启用 ${enabledCount} 个应用`
                : `${enabledCount} apps enabled`
              : t("已安装但未启用", "Installed but inactive"),
          statusLabel: t("已安装", "Installed"),
          sourceLabel:
            skill.repoOwner && skill.repoName
              ? `${skill.repoOwner}/${skill.repoName}`
              : t("本地或导入来源", "Local or imported source"),
          detailInput: {
            kind: "installed",
            name: skill.name,
            directory: skill.directory,
            description: skill.description,
            readmeUrl: skill.readmeUrl,
            repoOwner: skill.repoOwner,
            repoName: skill.repoName,
            repoBranch: skill.repoBranch,
            installedAt: skill.installedAt,
            apps: skill.apps,
          },
          installedSkill: skill,
        };
      }),
    [filteredInstalledSkills, isZh, t]
  );

  useEffect(() => {
    if (installedEntries.length === 0) {
      setSelectedItemKey(null);
      return;
    }

    if (selectedItemKey && installedEntries.some((item) => item.key === selectedItemKey)) {
      return;
    }

    setSelectedItemKey(installedEntries[0].key);
  }, [installedEntries, selectedItemKey]);

  const selectedEntry = installedEntries.find((item) => item.key === selectedItemKey) ?? null;
  const selectedDetailQuery = useSkillDetail(selectedEntry?.detailInput ?? null, {
    enabled: selectedEntry !== null,
  });
  const selectedDetail = selectedDetailQuery.data ?? selectedEntry?.detailInput ?? null;

  const errorMessage =
    actionError ??
    getErrorMessage(installedQuery.error) ??
    getErrorMessage(selectedDetailQuery.error);

  async function handleUninstall(skill: InstalledSkill) {
    setActionError(null);
    setSuccessFeedback(null);
    setPendingUninstallId(skill.id);

    try {
      const uninstallResult = await uninstallSkillMutation.mutateAsync(skill.id);
      setSuccessFeedback({
        title: isZh ? `已卸载 ${skill.name}` : `Uninstalled ${skill.name}`,
        details: [
          uninstallResult.backupPath
            ? isZh
              ? `备份已保存到 ${uninstallResult.backupPath}。`
              : `Backup saved to ${uninstallResult.backupPath}.`
            : t("后端未返回备份路径。", "No backup path was returned by the backend."),
          isZh
            ? `已从受管清单中移除 ${skill.directory}。`
            : `Removed from the managed inventory for ${skill.directory}.`,
        ],
      });
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError) ?? t("卸载技能失败。", "Failed to uninstall skill."));
    } finally {
      setPendingUninstallId(null);
    }
  }

  async function handleToggle(skill: InstalledSkill, app: AppId, enabled: boolean) {
    setActionError(null);
    setSuccessFeedback(null);
    setPendingToggleKey(`${skill.id}:${app}`);

    try {
      await toggleSkillAppMutation.mutateAsync({ id: skill.id, app, enabled });
      const nextApps: SkillApps = { ...skill.apps, [app]: enabled };
      const enabledApps = getEnabledApps(nextApps, appLabels, supportedAppIds);
      setSuccessFeedback({
        title: isZh
          ? `${enabled ? "已启用" : "已停用"} ${skill.name}（${appLabels[app]}）`
          : `${enabled ? "Enabled" : "Disabled"} ${skill.name} for ${appLabels[app]}`,
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
        getErrorMessage(mutationError) ?? t("更新技能启用状态失败。", "Failed to update skill activation.")
      );
    } finally {
      setPendingToggleKey(null);
    }
  }

  const handleSelectItem = useCallback((key: string) => {
    setSelectedItemKey((currentKey) => (currentKey === key ? currentKey : key));
  }, []);

  return (
    <PageLayout className="flex min-h-0 flex-1 flex-col">
      <WorkbenchOverview
        eyebrow={t("技能", "Skills")}
        title={t("技能工作台", "Skills workbench")}
        description={t(
          "左侧选条目，右侧看 README，底部再执行启用和卸载。",
          "Select on the left, read the README on the right, then act from the bottom dock."
        )}
        actions={
          <WorkbenchHeroActions>
            <Badge tone="slate">
              {t("已安装", "Installed")} {installedQuery.isSuccess ? installedSkills.length : "—"}
            </Badge>
            {selectedEntry ? <Badge tone="slate">{selectedEntry.name}</Badge> : null}
            {installedQuery.isFetching && installedQuery.isSuccess ? (
              <QueryHint tone="blue">{t("正在刷新列表", "Refreshing installed skills")}</QueryHint>
            ) : null}
          </WorkbenchHeroActions>
        }
      />

      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}
      {successFeedback ? <SuccessFeedbackAlert feedback={successFeedback} onDismiss={() => setSuccessFeedback(null)} t={t} /> : null}

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.82fr)] 2xl:grid-cols-[minmax(300px,0.74fr)_minmax(0,1.9fr)]">
        <InstalledSkillsPanel
          t={t}
          isFetching={installedQuery.isFetching}
          isLoading={installedQuery.isLoading}
          filteredCount={filteredInstalledSkills.length}
          searchQuery={searchQuery}
          isSearchPending={isSearchPending}
          emptyText={
            normalizedSearchQuery
              ? t("没有匹配的已安装技能。", "No installed skills match the search.")
              : t("还没有已安装技能，请前往 Sources 导入或安装。", "No installed skills yet. Use Sources to import or install one.")
          }
          items={installedEntries}
          selectedItemKey={selectedItemKey}
          onSearchChange={setSearchQuery}
          onSelect={handleSelectItem}
        />

        <SelectedSkillWorkspacePanel
          t={t}
          isZh={isZh}
          locale={locale}
          appLabels={appLabels}
          supportedAppIds={supportedAppIds}
          selectedEntry={selectedEntry}
          selectedDetail={selectedDetail}
          detailIsFetching={selectedDetailQuery.isFetching}
          pendingToggleKey={pendingToggleKey}
          pendingUninstallId={pendingUninstallId}
          onToggle={handleToggle}
          onUninstall={(skill) => setConfirmingUninstallSkill(skill)}
        />
      </div>

      <ConfirmActionDialog
        open={confirmingUninstallSkill !== null}
        title={t("确认卸载技能", "Confirm skill uninstall")}
        description={
          confirmingUninstallSkill
            ? t(
                `卸载后会将 ${confirmingUninstallSkill.name} 从受管清单中移除，并生成本地备份。`,
                `Uninstalling will remove ${confirmingUninstallSkill.name} from the managed inventory and create a local backup.`
              )
            : ""
        }
        confirmLabel={pendingUninstallId ? t("卸载中…", "Uninstalling…") : t("确认卸载", "Confirm uninstall")}
        cancelLabel={t("取消", "Cancel")}
        busy={pendingUninstallId !== null}
        onCancel={() => {
          if (!pendingUninstallId) {
            setConfirmingUninstallSkill(null);
          }
        }}
        onConfirm={() => {
          if (confirmingUninstallSkill) {
            void handleUninstall(confirmingUninstallSkill).finally(() => {
              setConfirmingUninstallSkill(null);
            });
          }
        }}
      >
        {confirmingUninstallSkill ? (
          <div className="space-y-2.5">
            <div className={workbenchDetailFieldClassName}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {t("技能", "Skill")}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{confirmingUninstallSkill.name}</div>
            </div>
            <div className={workbenchDetailFieldClassName}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {t("目录", "Directory")}
              </div>
              <div className="mt-2 break-all font-mono text-[13px] text-slate-600 dark:text-slate-300">{confirmingUninstallSkill.directory}</div>
            </div>
          </div>
        ) : null}
      </ConfirmActionDialog>
    </PageLayout>
  );
}

function SuccessFeedbackAlert({
  feedback,
  onDismiss,
  t,
}: {
  feedback: SuccessFeedback;
  onDismiss: () => void;
  t: TranslateFn;
}) {
  return (
    <InlineAlert tone="emerald" className="rounded-[18px] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-emerald-800 dark:text-emerald-50">{feedback.title}</div>
          {feedback.details[0] ? (
            <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-100/90">{feedback.details[0]}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-emerald-200 bg-white/88 px-3 py-1.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-transparent dark:text-emerald-100 dark:hover:bg-emerald-500/10"
        >
          {t("关闭", "Dismiss")}
        </button>
      </div>
    </InlineAlert>
  );
}

function InstalledSkillsPanel({
  t,
  isFetching,
  isLoading,
  filteredCount,
  searchQuery,
  isSearchPending,
  emptyText,
  items,
  selectedItemKey,
  onSearchChange,
  onSelect,
}: {
  t: TranslateFn;
  isFetching: boolean;
  isLoading: boolean;
  filteredCount: number;
  searchQuery: string;
  isSearchPending: boolean;
  emptyText: string;
  items: InstalledListEntry[];
  selectedItemKey: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (key: string) => void;
}) {
  return (
    <Panel
      eyebrow={t("浏览器", "Browser")}
      title={t("已安装目录", "Installed catalog")}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge tone="slate">{filteredCount}</Badge>
          {isFetching && !isLoading ? <QueryHint tone="slate">{t("刷新中", "Refreshing")}</QueryHint> : null}
        </div>
      }
      density="compact"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className={toolbarShellClassName}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("搜索已安装技能、路径或应用", "Search installed skills, paths, or apps")}
              className={`h-8 min-w-0 text-[12px] pl-9 ${inputClassName}`}
            />
          </div>
          {isSearchPending ? <QueryHint tone="slate">{t("正在筛选…", "Filtering…")}</QueryHint> : null}
        </div>

        <MemoizedInstalledListSection
          loading={isLoading}
          emptyText={emptyText}
          items={items}
          selectedItemKey={selectedItemKey}
          onSelect={onSelect}
        />
      </div>
    </Panel>
  );
}

function SelectedSkillWorkspacePanel({
  t,
  isZh,
  locale,
  appLabels,
  supportedAppIds,
  selectedEntry,
  selectedDetail,
  detailIsFetching,
  pendingToggleKey,
  pendingUninstallId,
  onToggle,
  onUninstall,
}: {
  t: TranslateFn;
  isZh: boolean;
  locale: string;
  appLabels: Record<AppId, string>;
  supportedAppIds: AppId[];
  selectedEntry: InstalledListEntry | null;
  selectedDetail: SkillDetailInput | SkillDetail | null;
  detailIsFetching: boolean;
  pendingToggleKey: string | null;
  pendingUninstallId: string | null;
  onToggle: (skill: InstalledSkill, app: AppId, enabled: boolean) => void;
  onUninstall: (skill: InstalledSkill) => void;
}) {
  return (
    <Panel
      eyebrow={t("详情", "Details")}
      title={selectedEntry ? selectedEntry.name : t("技能详情台", "Skill detail desk")}
      action={selectedEntry && detailIsFetching ? <QueryHint tone="blue">{t("正在刷新详情", "Refreshing details")}</QueryHint> : null}
      density="compact"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      {!selectedEntry ? (
        <EmptyPanel
          title={t("还没有已安装技能", "No installed skills yet")}
          description={t(
            "安装或导入技能后，右侧会先展示 README，再给出启用和卸载动作。",
            "After you install or import a skill, the right side will show the README first, then activation and uninstall actions."
          )}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className={`${workbenchGlassCardClassName} px-3.5 py-3`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="slate">{selectedEntry.sourceLabel}</Badge>
              {selectedDetail?.repoBranch ? <Badge tone="slate">{selectedDetail.repoBranch}</Badge> : null}
              <Badge tone="blue">{selectedEntry.meta}</Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <div className={workbenchDetailPanelClassName}>
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <SkillDetailContent detail={selectedDetail} locale={locale} appLabels={appLabels} isZh={isZh} />
              </div>
            </div>
          </div>

          <InstalledSkillActions
            skill={selectedEntry.installedSkill}
            appLabels={appLabels}
            supportedAppIds={supportedAppIds}
            pendingToggleKey={pendingToggleKey}
            pendingUninstallId={pendingUninstallId}
            onToggle={onToggle}
            onUninstall={onUninstall}
            isZh={isZh}
            readmeUrl={selectedDetail?.readmeUrl ?? null}
          />
        </div>
      )}
    </Panel>
  );
}

function InstalledListSection({
  loading,
  emptyText,
  items,
  selectedItemKey,
  onSelect,
}: {
  loading: boolean;
  emptyText: string;
  items: InstalledListEntry[];
  selectedItemKey: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {loading ? (
        <SectionSkeleton rows={2} compact />
      ) : items.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-slate-300/90 bg-slate-50/70 px-3.5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <MemoizedInstalledListItem key={item.key} item={item} selected={item.key === selectedItemKey} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

const MemoizedInstalledListSection = memo(InstalledListSection);

const MemoizedInstalledListItem = memo(function InstalledListItem({
  item,
  selected,
  onSelect,
}: {
  item: InstalledListEntry;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      className={[
        workbenchListItemClassName,
        "group",
        selected ? activeSurfaceClassName : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{item.name}</div>
              <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{item.summary}</div>
            </div>
            <Badge tone="slate">
              {item.statusLabel}
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Badge tone="blue">{item.meta}</Badge>
            <Badge tone="slate">{item.sourceLabel}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
});

function InstalledSkillActions({
  skill,
  appLabels,
  supportedAppIds,
  pendingToggleKey,
  pendingUninstallId,
  onToggle,
  onUninstall,
  isZh,
  readmeUrl,
}: {
  skill: InstalledSkill;
  appLabels: Record<AppId, string>;
  supportedAppIds: AppId[];
  pendingToggleKey: string | null;
  pendingUninstallId: string | null;
  onToggle: (skill: InstalledSkill, app: AppId, enabled: boolean) => void;
  onUninstall: (skill: InstalledSkill) => void;
  isZh: boolean;
  readmeUrl: string | null;
}) {
  return (
    <div className={workbenchActionDockClassName}>
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {isZh ? "管理动作" : "Actions"}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {supportedAppIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {supportedAppIds.map((app) => {
                const enabled = skill.apps[app];
                const isPending = pendingToggleKey === `${skill.id}:${app}`;

                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => onToggle(skill, app, !enabled)}
                    disabled={isPending}
                    className={[workbenchToggleBaseClassName, enabled ? activeToggleClassName : ""].join(" ")}
                  >
                    {isPending ? `${appLabels[app]}…` : appLabels[app]}
                  </button>
                );
              })}
            </div>
          ) : (
            <InlineAlert tone="slate" className="flex-1">
              {isZh ? "未检测到可用宿主，当前无法调整启用范围。" : "No available hosts were detected, so activation targets are unavailable."}
            </InlineAlert>
          )}
          <div className="flex flex-wrap gap-1.5">
            {readmeUrl ? (
              <a href={readmeUrl} target="_blank" rel="noreferrer" className={secondaryButtonClassName}>
                <Link2 className="h-3.5 w-3.5" />
                {isZh ? "打开文档" : "Open docs"}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onUninstall(skill)}
              disabled={pendingUninstallId === skill.id}
              className={dangerButtonClassName}
            >
              {pendingUninstallId === skill.id ? (isZh ? "卸载中…" : "Uninstalling…") : isZh ? "卸载技能" : "Uninstall skill"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillDetailContent({
  detail,
  locale,
  appLabels,
  isZh,
}: {
  detail: SkillDetailInput | SkillDetail | null;
  locale: string;
  appLabels: Record<AppId, string>;
  isZh: boolean;
}) {
  if (!detail) {
    return null;
  }

  const detailDescription = detail.description?.trim();
  const readmeContent = "readmeContent" in detail ? stripMarkdownFrontmatter(detail.readmeContent) : null;
  const enabledApps = detail.apps ? getEnabledApps(detail.apps, appLabels) : [];
  const source = detail.repoOwner && detail.repoName ? `${detail.repoOwner}/${detail.repoName}` : null;

  if (readmeContent) {
    return (
      <div className="space-y-4">
        {detailDescription ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{detailDescription}</p> : null}
        <div className={workbenchMarkdownPanelClassName}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const detailFields = [
    source ? { label: isZh ? "来源" : "Source", value: source } : null,
    { label: isZh ? "目录" : "Directory", value: detail.directory, mono: true },
    detail.readmeUrl
      ? {
          label: "README",
          value: (
            <a
              href={detail.readmeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              <Link2 className="h-4 w-4" />
              {detail.readmeUrl}
            </a>
          ),
        }
      : null,
    detail.installedAt
      ? { label: isZh ? "安装时间" : "Installed at", value: formatUnixTime(detail.installedAt, locale) }
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
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

function getEnabledApps(apps: SkillApps, appLabels: Record<AppId, string>, supportedAppIds?: readonly AppId[]) {
  const targetApps = supportedAppIds?.length ? supportedAppIds : (Object.keys(apps) as AppId[]);

  return targetApps.filter((app) => apps[app]).map((app) => appLabels[app]);
}

function includesQuery(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function matchesInstalledSkillSearch(
  skill: InstalledSkill,
  query: string,
  appLabels: Record<AppId, string>,
  supportedAppIds?: readonly AppId[]
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
    ...getEnabledApps(skill.apps, appLabels, supportedAppIds),
  ].some((value) => includesQuery(value, query));
}
