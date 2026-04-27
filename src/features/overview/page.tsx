import { useMemo } from "react";
import {
  Archive,
  FolderCog,
  HardDriveDownload,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppOverview } from "../../shared/lib/tauri";
import { getErrorMessage } from "../../shared/lib/format";
import {
  getAppLabels,
  useI18n,
} from "../../shared/lib/i18n";
import {
  useInstalledSkills,
  useSkillBackups,
  useUnmanagedSkills,
} from "../skills/use-skills";
import {
  getSupportedAppIds,
  type InstalledSkill,
  type SkillBackupEntry,
  type UnmanagedSkill,
} from "../../shared/types/skills";

import {
  ActionTile,
  Badge,
  InlineAlert,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
  listItemClassName,
} from "../../shared/components/workbench-ui";

const EMPTY_INSTALLED_SKILLS: InstalledSkill[] = [];
const EMPTY_BACKUPS: SkillBackupEntry[] = [];
const EMPTY_UNMANAGED_SKILLS: UnmanagedSkill[] = [];

export function OverviewPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const overviewQuery = useAppOverview();
  const installedQuery = useInstalledSkills();
  const backupsQuery = useSkillBackups();
  const unmanagedQuery = useUnmanagedSkills();

  const overview = overviewQuery.data;
  const supportedAppIds = useMemo(() => getSupportedAppIds(overview?.supportedApps), [overview?.supportedApps]);
  const installedSkills = installedQuery.data ?? EMPTY_INSTALLED_SKILLS;
  const backups = backupsQuery.data ?? EMPTY_BACKUPS;
  const unmanagedSkills = unmanagedQuery.data ?? EMPTY_UNMANAGED_SKILLS;

  const installedReady = installedQuery.data !== undefined;
  const backupsReady = backupsQuery.data !== undefined;
  const unmanagedReady = unmanagedQuery.data !== undefined;

  const latestBackup = useMemo(
    () => [...backups].sort((a, b) => b.createdAt - a.createdAt)[0],
    [backups]
  );

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
    getErrorMessage(unmanagedQuery.error);

  const refreshingSignals =
    overviewQuery.isFetching ||
    installedQuery.isFetching ||
    backupsQuery.isFetching ||
    unmanagedQuery.isFetching;

  const nextStepValue =
    unmanagedSkills.length > 0
      ? t("先进入 Sources 处理待导入项", "Open Sources and process import candidates")
      : installedSkills.length === 0
        ? t("先安装或导入第一个技能", "Install or import the first skill")
        : t("进入 Skills 调整启用范围", "Open Skills and tune activation coverage");

  return (
    <PageLayout>
      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}

      <Panel
        eyebrow={t("入口", "Entry")}
        title={t("直接开始", "Start directly")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Link
              to="/settings"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-950/80 dark:hover:text-slate-100"
            >
              <FolderCog className="h-3.5 w-3.5" />
              {t("环境", "Environment")}
            </Link>
            {refreshingSignals ? (
              <QueryHint tone="blue">{t("正在刷新", "Refreshing")}</QueryHint>
            ) : null}
          </div>
        }
        density="compact"
      >
        {!installedReady || !backupsReady || !unmanagedReady ? (
          <SectionSkeleton rows={3} compact />
        ) : (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.8fr)]">
            <div className="grid gap-2 xl:grid-cols-3">
              <ActionTile
                to="/skills"
                icon={Sparkles}
                title={t("技能", "Skills")}
                description={t(
                  installedSkills.length > 0 ? `当前 ${installedSkills.length} 个受管技能` : "整理当前工作区",
                  installedSkills.length > 0 ? `${installedSkills.length} managed skills` : "Organize the current workspace"
                )}
                meta={t("管理", "Manage")}
                tone="emerald"
                dense
              />
              <ActionTile
                to="/sources"
                icon={HardDriveDownload}
                title={t("来源", "Sources")}
                description={t(
                  unmanagedSkills.length > 0 ? `${unmanagedSkills.length} 个目录待处理` : "导入和仓库入口",
                  unmanagedSkills.length > 0 ? `${unmanagedSkills.length} directories waiting` : "Import and repository intake"
                )}
                meta={t("导入", "Intake")}
                tone="blue"
                dense
              />
              <ActionTile
                to="/backups"
                icon={Archive}
                title={t("备份", "Backups")}
                description={t(
                  latestBackup ? `最新：${latestBackup.skill.name}` : "还没有本地恢复点",
                  latestBackup ? `Latest: ${latestBackup.skill.name}` : "No local restore points yet"
                )}
                meta={t("恢复", "Restore")}
                tone="amber"
                dense
              />
            </div>

            <div className="grid gap-2.5">
              <OverviewSignalCard
                label={t("下一步", "Next")}
                value={nextStepValue}
                hint={
                  unmanagedSkills.length > 0
                    ? t("优先处理待导入目录。", "Process the import backlog first.")
                    : t("当前工作区已经可以继续推进。", "The current workspace is ready for the next pass.")
                }
                tone="blue"
              />
              <OverviewSignalCard
                label={t("待处理来源", "Source backlog")}
                value={
                  unmanagedSkills.length > 0
                    ? t(`${unmanagedSkills.length} 个待导入候选`, `${unmanagedSkills.length} import candidates`)
                    : t("没有待导入项", "No import candidates")
                }
                hint={t(
                  unmanagedSkills.length > 0 ? "这些目录还没进入受管清单。" : "来源侧当前比较干净。",
                  unmanagedSkills.length > 0 ? "These directories are not yet in the managed inventory." : "The intake side is currently clean."
                )}
                tone="amber"
              />
            </div>
          </div>
        )}
      </Panel>

      {hostStatus.length > 0 ? (
        <Panel
          eyebrow={t("宿主", "Hosts")}
          title={t("当前启用覆盖", "Current activation coverage")}
          action={
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Badge tone="slate">{t(`${supportedAppIds.length} 个宿主`, `${supportedAppIds.length} hosts`)}</Badge>
              {installedQuery.isFetching && installedReady ? (
                <QueryHint tone="emerald">{t("正在刷新", "Refreshing")}</QueryHint>
              ) : null}
            </div>
          }
          density="compact"
        >
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
        </Panel>
      ) : null}
    </PageLayout>
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
