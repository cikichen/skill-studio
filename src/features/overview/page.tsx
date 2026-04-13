import { useMemo, type ComponentType } from "react";
import {
  Archive,
  ArrowRight,
  FolderCog,
  HardDriveDownload,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppOverview } from "../../shared/lib/tauri";
import { countEnabledApps, formatUnixTime, getErrorMessage } from "../../shared/lib/format";
import {
  getAppLabels,
  getLocaleForLanguage,
  useI18n,
} from "../../shared/lib/i18n";
import {
  useInstalledSkills,
  useSkillBackups,
  useSkillRepos,
  useUnmanagedSkills,
} from "../skills/use-skills";
import {
  getSupportedAppIds,
  type InstalledSkill,
  type SkillBackupEntry,
  type SkillRepo,
  type UnmanagedSkill,
} from "../../shared/types/skills";

import {
  Badge,
  InlineAlert,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
  WorkbenchOverview,
  listItemClassName,
} from "../../shared/components/workbench-ui";

const EMPTY_INSTALLED_SKILLS: InstalledSkill[] = [];
const EMPTY_BACKUPS: SkillBackupEntry[] = [];
const EMPTY_REPOS: SkillRepo[] = [];
const EMPTY_UNMANAGED_SKILLS: UnmanagedSkill[] = [];

export function OverviewPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const overviewQuery = useAppOverview();
  const installedQuery = useInstalledSkills();
  const backupsQuery = useSkillBackups();
  const reposQuery = useSkillRepos();
  const unmanagedQuery = useUnmanagedSkills();

  const overview = overviewQuery.data;
  const supportedAppIds = useMemo(() => getSupportedAppIds(overview?.supportedApps), [overview?.supportedApps]);
  const installedSkills = installedQuery.data ?? EMPTY_INSTALLED_SKILLS;
  const backups = backupsQuery.data ?? EMPTY_BACKUPS;
  const repos = reposQuery.data ?? EMPTY_REPOS;
  const unmanagedSkills = unmanagedQuery.data ?? EMPTY_UNMANAGED_SKILLS;

  const installedReady = installedQuery.data !== undefined;
  const backupsReady = backupsQuery.data !== undefined;
  const reposReady = reposQuery.data !== undefined;
  const unmanagedReady = unmanagedQuery.data !== undefined;

  const latestBackup = useMemo(
    () => [...backups].sort((a, b) => b.createdAt - a.createdAt)[0],
    [backups]
  );

  const activityItems = useMemo(() => {
    if (!installedReady && !backupsReady) {
      return null;
    }

    const installedEvents = installedSkills.map((skill) => {
      const enabledApps = countEnabledApps(skill.apps);

      return {
        type: isZh ? "安装" : "Installed",
        name: skill.name,
        subtitle: skill.directory,
        timestamp: skill.installedAt,
        tone: "emerald" as const,
        meta:
          enabledApps > 0
            ? isZh
              ? `启用 ${enabledApps} 个应用`
              : `${enabledApps} apps enabled`
            : isZh
              ? "未启用"
              : "Inactive",
      };
    });

    const backupEvents = backups.map((backup) => ({
      type: isZh ? "备份" : "Backup",
      name: backup.skill.name,
      subtitle: backup.backupPath,
      timestamp: backup.createdAt,
      tone: "amber" as const,
      meta: isZh ? "恢复点" : "Restore point",
    }));

    return [...installedEvents, ...backupEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [backups, backupsReady, installedReady, installedSkills, isZh]);

  const hostStatus = useMemo(
    () =>
      supportedAppIds.map((app) => ({
        app,
        label: appLabels[app],
        activeCount: installedSkills.filter((skill) => skill.apps[app]).length,
      })),
    [appLabels, installedSkills, supportedAppIds]
  );

  const errorMessage =
    getErrorMessage(overviewQuery.error) ??
    getErrorMessage(installedQuery.error) ??
    getErrorMessage(backupsQuery.error) ??
    getErrorMessage(reposQuery.error) ??
    getErrorMessage(unmanagedQuery.error);

  const refreshingSignals =
    overviewQuery.isFetching ||
    installedQuery.isFetching ||
    backupsQuery.isFetching ||
    reposQuery.isFetching ||
    unmanagedQuery.isFetching;

  return (
    <PageLayout>
      <WorkbenchOverview
        eyebrow={t("概览", "Overview")}
        title={t("工作台总览", "Workbench overview")}
        description={t(
          "先看到要做什么，再补充必要的状态和运行信息。",
          "Show what to do first, then layer in the essential status and runtime context."
        )}
        stats={
          <>
            <OverviewMetricCard
              label={t("已安装", "Installed")}
              value={installedReady ? String(installedSkills.length) : "—"}
              helper={t("受管技能", "Managed")}
              tone="emerald"
            />
            <OverviewMetricCard
              label={t("待导入", "Candidates")}
              value={unmanagedReady ? String(unmanagedSkills.length) : "—"}
              helper={t("待处理目录", "Pending")}
              tone="amber"
            />
            <OverviewMetricCard
              label={t("仓库", "Repos")}
              value={reposReady ? String(repos.length) : "—"}
              helper={t("受管来源", "Sources")}
              tone="blue"
            />
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {overview ? (
              <Badge tone="slate">
                {t("运行中", "Running")} · {overview.appName} {overview.version}
              </Badge>
            ) : null}
            {refreshingSignals ? (
              <QueryHint tone="blue">{t("正在刷新概览", "Refreshing overview")}</QueryHint>
            ) : null}
          </div>
        }
      />

      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}

      <div className="grid gap-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Panel
            eyebrow={t("开始", "Launchpad")}
            title={t("核心工作流", "Core workflows")}
            description={t(
              "保留最常用的 3 条路径，环境信息降为辅助入口。",
              "Keep the three most-used routes here and demote environment info to a utility entry."
            )}
            action={
              <Link
                to="/settings"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-950/80 dark:hover:text-slate-100"
              >
                <FolderCog className="h-3.5 w-3.5" />
                {t("环境信息", "Environment")}
              </Link>
            }
            density="compact"
          >
            <div className="grid gap-2 xl:grid-cols-3">
              <OverviewActionCard
                to="/skills"
                icon={Sparkles}
                title={t("技能管理", "Skills")}
                eyebrow={t("Inventory", "Inventory")}
                description={t(
                  "查看已安装技能、启用范围和卸载路径。",
                  "Inspect installed skills, activation coverage, and uninstall flow."
                )}
                helper={t(
                  installedSkills.length > 0 ? `当前 ${installedSkills.length} 个受管技能` : "从这里整理现有工作区",
                  installedSkills.length > 0 ? `${installedSkills.length} managed skills right now` : "Best place to organize the current workspace"
                )}
                cta={t("进入工作台", "Open workbench")}
                tone="emerald"
              />
              <OverviewActionCard
                to="/sources"
                icon={HardDriveDownload}
                title={t("来源管理", "Sources")}
                eyebrow={t("Intake", "Intake")}
                description={t(
                  "处理待导入项、仓库发现和 ZIP 安装入口。",
                  "Process import candidates, repository discovery, and ZIP intake."
                )}
                helper={t(
                  unmanagedSkills.length > 0 ? `${unmanagedSkills.length} 个目录待处理` : "仓库与导入入口集中在这里",
                  unmanagedSkills.length > 0 ? `${unmanagedSkills.length} directories waiting` : "Repository and import entry points live here"
                )}
                cta={t("处理来源", "Review sources")}
                tone="blue"
              />
              <OverviewActionCard
                to="/backups"
                icon={Archive}
                title={t("备份与恢复", "Backups")}
                eyebrow={t("Safety", "Safety")}
                description={t(
                  "查看最近恢复点，必要时快速回滚。",
                  "Inspect restore points and roll back when needed."
                )}
                helper={t(
                  latestBackup ? `最新备份：${latestBackup.skill.name}` : "当前还没有本地恢复点",
                  latestBackup ? `Latest backup: ${latestBackup.skill.name}` : "No local restore points yet"
                )}
                cta={t("查看恢复点", "Open backups")}
                tone="amber"
              />
            </div>
          </Panel>

          <Panel
            eyebrow={t("状态", "Signals")}
            title={t("当前重点", "Current focus")}
            density="compact"
          >
            {!installedReady || !backupsReady || !reposReady || !unmanagedReady ? (
              <SectionSkeleton rows={3} compact />
            ) : (
              <div className="grid gap-2.5">
                <OverviewSignalCard
                  label={t("下一步", "Next step")}
                  value={
                    unmanagedSkills.length > 0
                      ? t("先进入 Sources 处理待导入项", "Open Sources and process import candidates")
                      : installedSkills.length === 0
                        ? t("先安装或导入第一个技能", "Install or import the first skill")
                        : t("进入 Skills 调整启用范围", "Open Skills and tune activation coverage")
                  }
                  hint={
                    unmanagedSkills.length > 0
                      ? t("当前最值得优先处理的积压项。", "The highest-value backlog item right now.")
                      : t("当前工作区已经可以继续推进。", "The current workspace is ready for the next pass.")
                  }
                  tone="blue"
                />
                <OverviewSignalCard
                  label={t("未托管技能", "Unmanaged skills")}
                  value={
                    unmanagedSkills.length > 0
                      ? t(`${unmanagedSkills.length} 个待导入候选`, `${unmanagedSkills.length} import candidates`)
                      : t("没有待导入项", "No import candidates")
                  }
                  hint={t(
                    unmanagedSkills.length > 0 ? "这些目录还没进入受管清单。" : "当前来源侧已经比较干净。",
                    unmanagedSkills.length > 0 ? "These directories are not yet in the managed inventory." : "The intake side is currently clean."
                  )}
                  tone="amber"
                />
                <OverviewSignalCard
                  label={t("最近变更", "Recent change")}
                  value={
                    activityItems?.[0]
                      ? `${activityItems[0].type} · ${activityItems[0].name}`
                      : t("还没有最近变更", "No recent changes yet")
                  }
                  hint={
                    activityItems?.[0]
                      ? `${formatUnixTime(activityItems[0].timestamp, locale)} · ${activityItems[0].meta}`
                      : t("安装、导入或备份后会在这里出现。", "Installs, imports, and backups will appear here.")
                  }
                  tone="violet"
                />
              </div>
            )}
          </Panel>
        </div>

        <Panel
          eyebrow={t("宿主应用", "Hosts")}
          title={t("宿主启用覆盖面", "Host activation surface")}
          description={t(
            "看清当前技能覆盖到哪些宿主，再决定是补来源还是调启用范围。",
            "See which hosts are currently covered before deciding whether to add sources or tune activation."
          )}
          action={
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {overview ? (
                <>
                  <Badge tone="slate">{overview.syncModes.join(" / ")}</Badge>
                  <Badge tone="slate">
                    {t(`${supportedAppIds.length} 个宿主`, `${supportedAppIds.length} hosts`)}
                  </Badge>
                </>
              ) : null}
              {installedQuery.isFetching && installedReady ? (
                <QueryHint tone="emerald">{t("正在刷新宿主覆盖", "Refreshing host coverage")}</QueryHint>
              ) : null}
            </div>
          }
          density="compact"
        >
          {!installedReady && installedQuery.isLoading ? (
            <SectionSkeleton rows={2} compact />
          ) : hostStatus.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {hostStatus.map((host) => (
                <OverviewHostCard
                  key={host.app}
                  label={host.label}
                  value={host.activeCount}
                  helper={t("已启用技能", "Enabled skills")}
                  isActive={host.activeCount > 0}
                />
              ))}
            </div>
          ) : (
            <InlineAlert tone="slate">{t("当前没有可用宿主信息。", "No supported host information is currently available.")}</InlineAlert>
          )}
        </Panel>
      </div>
    </PageLayout>
  );
}

function OverviewActionCard({
  to,
  icon: Icon,
  eyebrow,
  title,
  description,
  helper,
  cta,
  tone,
}: {
  to: string;
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  helper: string;
  cta: string;
  tone: "emerald" | "blue" | "amber" | "violet";
}) {
  const toneClasses = {
    emerald:
      "border-emerald-200/80 bg-emerald-50/55 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    blue:
      "border-blue-200/80 bg-blue-50/55 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    amber:
      "border-amber-200/80 bg-amber-50/55 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    violet:
      "border-violet-200/80 bg-violet-50/55 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200",
  } as const;

  return (
    <Link
      to={to}
      className="group rounded-[18px] border border-slate-200/85 bg-white/96 p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_22px_-20px_rgba(15,23,42,0.18)] dark:border-slate-700/85 dark:bg-slate-950/68 dark:hover:border-slate-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-[0.9rem] border ${toneClasses[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <Badge tone={tone}>{eyebrow}</Badge>
      </div>

      <div className="mt-2">
        <div className="text-[14px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</div>
        <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3 border-t border-slate-200/80 pt-2 dark:border-slate-800">
        <div className="min-w-0 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{helper}</div>
        <div className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-700 transition group-hover:translate-x-0.5 dark:text-slate-200">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

function OverviewSignalCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "blue" | "amber" | "emerald" | "violet";
}) {
  const toneClasses = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  } as const;

  return (
    <div className="rounded-[16px] border border-slate-200/85 bg-white/94 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-700/85 dark:bg-slate-950/62">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${toneClasses[tone]}`} />
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          {label}
        </div>
      </div>
      <div className="mt-1.5 text-[13px] font-semibold leading-5 text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{hint}</div>
    </div>
  );
}

function OverviewMetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "blue" | "amber";
}) {
  const toneClasses = {
    emerald:
      "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    blue:
      "border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200",
    amber:
      "border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
  } as const;

  return (
    <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200/85 bg-white/92 px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700/85 dark:bg-slate-950/62">
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 text-[1rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
          {value}
        </div>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-medium leading-none ${toneClasses[tone]}`}>
        {helper}
      </span>
    </div>
  );
}

function OverviewHostCard({
  label,
  value,
  helper,
  isActive,
}: {
  label: string;
  value: number;
  helper: string;
  isActive: boolean;
}) {
  return (
    <div
      className={[
        `${listItemClassName} p-2.5`,
        isActive ? "border-emerald-200/85 bg-emerald-50/45 dark:border-emerald-500/25 dark:bg-emerald-500/8" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-slate-900 dark:text-slate-100">{label}</div>
          <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{helper}</div>
        </div>
        <div className="text-[1.3rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={[
            "h-full rounded-full transition-all",
            isActive ? "w-[68%] bg-emerald-500 dark:bg-emerald-400" : "w-[14%] bg-slate-300 dark:bg-slate-600",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
