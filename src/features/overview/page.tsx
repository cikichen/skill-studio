import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Boxes,
  FolderCog,
  HardDriveDownload,
  Sparkles,
} from "lucide-react";
import { getAppOverview } from "../../shared/lib/tauri";
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
import type { AppId } from "../../shared/types/skills";
import {
  ActionTile,
  Badge,
  EmptyPanel,
  KeyValueList,
  PageIntro,
  PageLayout,
  Panel,
  StatCard,
  listItemClassName,
} from "../../shared/components/workbench-ui";

const APP_IDS: AppId[] = ["claude", "codex", "gemini", "opencode", "openclaw"];

export function OverviewPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ["app", "overview"],
    queryFn: () => getAppOverview(),
  });
  const { data: installedSkills = [] } = useInstalledSkills();
  const { data: backups = [] } = useSkillBackups();
  const { data: repos = [] } = useSkillRepos();
  const { data: unmanagedSkills = [] } = useUnmanagedSkills();

  const latestBackup = useMemo(
    () => [...backups].sort((a, b) => b.createdAt - a.createdAt)[0],
    [backups]
  );
  const latestInstalled = useMemo(
    () => [...installedSkills].sort((a, b) => b.installedAt - a.installedAt).slice(0, 4),
    [installedSkills]
  );
  const activityItems = useMemo(() => {
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
  }, [backups, installedSkills, isZh]);

  const hostStatus = APP_IDS.map((app) => ({
    app,
    label: appLabels[app],
    activeCount: installedSkills.filter((skill) => skill.apps[app]).length,
  }));

  const overviewErrorMessage =
    overviewError instanceof Error ? overviewError.message : null;

  return (
    <PageLayout>
      <PageIntro
        eyebrow={t("总览", "Overview")}
        title={t("Skill Studio 控制台", "Skill Studio command center")}
        description={t(
          "这是一个面向桌面程序的总览入口：看当前工作区状态、支持的宿主应用、最近活动，并快速跳到已安装技能、来源、备份与设置工作台。",
          "This dashboard is the desktop entry point for workspace health, supported hosts, recent activity, and fast jumps into installed skills, sources, backups, and settings workbenches."
        )}
        aside={
          <>
            <StatCard
              icon={Sparkles}
              label={t("已安装", "Installed")}
              value={String(installedSkills.length)}
              helper={t("受管技能总数", "Managed skills")}
              tone="emerald"
            />
            <StatCard
              icon={Boxes}
              label={t("来源", "Sources")}
              value={String(repos.length)}
              helper={t("已连接仓库", "Connected repositories")}
              tone="blue"
            />
            <StatCard
              icon={Archive}
              label={t("备份", "Backups")}
              value={String(backups.length)}
              helper={t("本地恢复点", "Local restore points")}
              tone="amber"
            />
          </>
        }
        actions={
          <>
            <Badge tone="emerald">{t("固定壳层", "Fixed shell")}</Badge>
            <Badge tone="blue">{t("分页工作台", "Workbench pages")}</Badge>
            <Badge tone="violet">
              {t("支持 5 个宿主应用", "Supports 5 host apps")}
            </Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-7">
          <Panel
            eyebrow={t("入口", "Entry points")}
            title={t("核心工作流", "Core workflows")}
            description={t(
              "Overview 只承接状态与导航，不把所有模块堆成一个长页面。真正的操作分别进入 Installed、Sources、Backups、Settings。",
              "Overview stays focused on status and navigation. Real work happens in Installed, Sources, Backups, and Settings instead of a single scrolling page."
            )}
          >
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <ActionTile
                to="/skills"
                icon={Sparkles}
                title={t("已安装技能", "Installed skills")}
                description={t(
                  "进入主工作台，搜索、筛选并管理启用状态。",
                  "Open the main workbench to search, filter, and manage activation state."
                )}
                meta={t("高频", "Primary")}
                tone="emerald"
              />
              <ActionTile
                to="/sources"
                icon={HardDriveDownload}
                title={t("来源管理", "Sources")}
                description={t(
                  "配置仓库、查看发现列表，并维护导入入口。",
                  "Configure repositories, inspect discovery, and maintain import sources."
                )}
                meta={t("仓库", "Repos")}
                tone="blue"
              />
              <ActionTile
                to="/backups"
                icon={Archive}
                title={t("备份与恢复", "Backups")}
                description={t(
                  "查看本地恢复点，按目标应用执行恢复。",
                  "Review local restore points and restore into the selected host app."
                )}
                meta={t("安全", "Safety")}
                tone="amber"
              />
              <ActionTile
                to="/settings"
                icon={FolderCog}
                title={t("环境设置", "Settings")}
                description={t(
                  "检查工作区、同步模式、宿主支持与诊断信息。",
                  "Inspect workspace defaults, sync modes, host support, and diagnostics."
                )}
                meta={t("环境", "Environment")}
                tone="violet"
              />
            </div>
          </Panel>

          <Panel
            eyebrow={t("动态", "Activity")}
            title={t("最近活动", "Recent activity")}
            description={t(
              "这里仅展示真实状态：最新安装、最新备份以及当前还未纳入管理的本地技能。",
              "This panel shows real state only: recent installs, recent backups, and local skills that are still unmanaged."
            )}
          >
            {activityItems.length === 0 ? (
              <EmptyPanel
                title={t("还没有最近活动", "No recent activity yet")}
                description={t(
                  "安装一个技能、导入本地目录或创建备份后，这里会显示新的时间线记录。",
                  "Install a skill, import a local directory, or create a backup to populate this activity timeline."
                )}
              />
            ) : (
              <div className="space-y-3">
                {activityItems.map((item) => (
                  <div
                    key={`${item.type}-${item.name}-${item.timestamp}`}
                    className={`${listItemClassName} bg-slate-50 dark:bg-slate-900/70`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={item.tone}>{item.type}</Badge>
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                          </div>
                          <div className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</div>
                        </div>
                        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                          <div>{formatUnixTime(item.timestamp, locale)}</div>
                          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{item.meta}</div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow={t("宿主应用", "Hosts")}
            title={t("宿主启用覆盖面", "Host activation surface")}
            description={t(
              "展示每个宿主应用当前已启用的技能数量。这里不伪造性能图，只用真实启用状态构成桌面概览。",
              "Each host card reflects how many skills are currently enabled there. No fake analytics, just real activation state."
            )}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hostStatus.map((host) => (
                <div key={host.app} className={listItemClassName}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{host.label}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t("已启用技能", "Enabled skills")}
                      </div>
                    </div>
                    <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {host.activeCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-7">
          <Panel
            eyebrow={t("工作区", "Workspace")}
            title={t("环境快照", "Environment snapshot")}
            description={t(
              "直接读取 Tauri overview 命令，展示当前工作区、版本、同步模式与已检测到的宿主应用。",
              "Backed by the real Tauri overview command for workspace root, version, sync modes, and detected host apps."
            )}
          >
            {overviewLoading ? (
              <EmptyPanel
                title={t("正在加载环境信息", "Loading environment snapshot")}
                description={t(
                  "正在向 Tauri 后端请求应用概览。",
                  "Requesting application overview from the Tauri backend."
                )}
              />
            ) : overviewErrorMessage ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100">
                  {overviewErrorMessage}
                </div>
            ) : overview ? (
              <KeyValueList
                items={[
                  {
                    label: t("应用", "Application"),
                    value: `${overview.appName} ${overview.version}`,
                  },
                  {
                    label: t("工作区", "Workspace"),
                    value: overview.workspaceRoot,
                    mono: true,
                  },
                  {
                    label: t("同步模式", "Sync modes"),
                    value: overview.syncModes.join(", "),
                  },
                  {
                    label: t("宿主应用", "Supported hosts"),
                    value: overview.supportedApps.join(", "),
                  },
                ]}
              />
            ) : null}
          </Panel>

          <Panel
            eyebrow={t("状态", "Signals")}
            title={t("当前状态信号", "Current status signals")}
            description={t(
              "用简洁卡片表达当前工作区的健康度与下一步动作，而不是堆一整页说明文案。",
              "Use compact signals for workspace health and next steps instead of another scrolling wall of copy."
            )}
          >
            <KeyValueList
              items={[
                {
                  label: t("最新备份", "Latest backup"),
                  value: latestBackup
                    ? `${latestBackup.skill.name} · ${formatUnixTime(latestBackup.createdAt, locale)}`
                    : t("暂无备份", "No backups yet"),
                },
                {
                  label: t("未托管技能", "Unmanaged skills"),
                  value:
                    unmanagedSkills.length > 0
                      ? t(`${unmanagedSkills.length} 个待导入候选`, `${unmanagedSkills.length} import candidates`)
                      : t("没有待导入项", "No import candidates"),
                },
                {
                  label: t("最新安装", "Latest install"),
                  value:
                    latestInstalled[0]
                      ? `${latestInstalled[0].name} · ${formatUnixTime(latestInstalled[0].installedAt, locale)}`
                      : t("尚未安装任何技能", "No skills installed yet"),
                },
                {
                  label: t("整体状态", "Overall state"),
                  value:
                    installedSkills.length > 0 || repos.length > 0 || backups.length > 0
                      ? t("可继续操作", "Ready for workflows")
                      : t("等待首个工作流", "Waiting for first workflow"),
                },
              ]}
            />
          </Panel>

          <Panel
            eyebrow={t("清单", "Coverage")}
            title={t("真实覆盖面", "Real coverage")}
            description={t(
              "Summary 只使用当前仓库可用的真实数据源，不引入不存在的商业指标。",
              "These badges are based on real capabilities already exposed by the repository rather than invented SaaS metrics."
            )}
          >
            <div className="flex flex-wrap gap-2.5">
              <Badge tone="emerald">{t("安装 / 卸载", "Install / uninstall")}</Badge>
              <Badge tone="blue">{t("仓库 / ZIP / 本地导入", "Repo / ZIP / local import")}</Badge>
              <Badge tone="amber">{t("备份 / 恢复", "Backup / restore")}</Badge>
              <Badge tone="violet">{t("按应用启用", "Per-app activation")}</Badge>
              <Badge tone="slate">{t("诊断与工作区", "Diagnostics & workspace")}</Badge>
            </div>
          </Panel>
        </div>
      </div>
    </PageLayout>
  );
}

function countEnabledApps(apps: Record<AppId, boolean>) {
  return Object.values(apps).filter(Boolean).length;
}

function formatUnixTime(value: number, locale: string) {
  return new Date(value * 1000).toLocaleString(locale);
}
