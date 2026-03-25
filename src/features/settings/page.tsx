import { useQuery } from "@tanstack/react-query";
import type { ElementType } from "react";
import { FolderCog, Orbit, ShieldCheck, Waypoints } from "lucide-react";
import { getAppOverview } from "../../shared/lib/tauri";
import { useI18n } from "../../shared/lib/i18n";
import {
  Badge,
  EmptyPanel,
  KeyValueList,
  PageIntro,
  PageLayout,
  Panel,
  StatCard,
} from "../../shared/components/workbench-ui";

export function SettingsPage() {
  const { isZh } = useI18n();
  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app", "overview"],
    queryFn: () => getAppOverview(),
  });

  const settings = overview
    ? [
        [isZh ? "工作区根目录" : "Workspace root", overview.workspaceRoot],
        [isZh ? "Manifest 格式" : "Manifest format", "skill.json"],
        [
          isZh ? "默认同步模式" : "Default sync modes",
          overview.syncModes.join(", "),
        ],
        [
          isZh ? "检测到的平台" : "Detected platforms",
          overview.supportedApps.join(", "),
        ],
      ]
    : [];

  return (
    <PageLayout>
      <PageIntro
        eyebrow={isZh ? "设置" : "Settings"}
        title={isZh ? "环境与策略" : "Environment and policies"}
        description={
          isZh
            ? "Settings 页面展示当前工作区的真实默认值、宿主支持与迁移边界。界面保持安静，避免和 Installed 工作台竞争注意力。"
            : "Settings surfaces the real workspace defaults, supported hosts, and migration boundaries. The page stays deliberately quiet so it does not compete with the Installed workbench."
        }
        aside={
          <>
            <StatCard
              icon={FolderCog}
              label={isZh ? "工作区" : "Workspace"}
              value={overview?.workspaceRoot ?? "—"}
              helper={isZh ? "当前根目录" : "Current root"}
              tone="blue"
            />
            <StatCard
              icon={Orbit}
              label={isZh ? "同步模式" : "Sync modes"}
              value={overview?.syncModes.length ? String(overview.syncModes.length) : "—"}
              helper={isZh ? "已暴露策略" : "Exposed strategies"}
              tone="violet"
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow={isZh ? "默认值" : "Defaults"}
          title={isZh ? "环境默认值" : "Environment defaults"}
          description={
            isZh
              ? "该面板由真实的 Tauri overview 命令驱动。"
              : "This panel is backed by the real Tauri overview command."
          }
        >
          {isLoading ? (
            <EmptyPanel
              title={isZh ? "正在加载应用概览" : "Loading application overview"}
              description={isZh ? "正在请求 Tauri 后端。" : "Requesting the Tauri backend."}
            />
          ) : error instanceof Error ? (
            <InfoBanner message={error.message} tone="error" />
          ) : (
            <KeyValueList
              items={settings.map(([label, value]) => ({
                label,
                value,
                mono: label === (isZh ? "工作区根目录" : "Workspace root"),
              }))}
            />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            eyebrow={isZh ? "宿主" : "Hosts"}
            title={isZh ? "检测到的平台" : "Detected platforms"}
            description={
              isZh
                ? "这些信息来自 overview.supportedApps。"
                : "These entries come directly from overview.supportedApps."
            }
          >
            <div className="flex flex-wrap gap-2.5">
              {overview?.supportedApps?.length ? (
                overview.supportedApps.map((app) => (
                  <Badge key={app} tone="blue">
                    {app}
                  </Badge>
                ))
              ) : (
                <Badge tone="slate">{isZh ? "暂无数据" : "No data"}</Badge>
              )}
            </div>
          </Panel>

          <Panel
            eyebrow={isZh ? "边界" : "Boundaries"}
            title={isZh ? "迁移边界" : "Migration boundaries"}
            description={
              isZh
                ? "保留 Skill Studio 的界面风格，同时逐步接入真实能力。"
                : "Keep the Skill Studio visual language while progressively wiring in the real platform capabilities."
            }
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <Guideline
                icon={ShieldCheck}
                text={
                  isZh
                    ? "优先维持与 cc-switch 的技能行为兼容，再做产品级增强。"
                    : "Keep cc-switch skill behavior compatible before layering product-facing enhancements."
                }
              />
              <Guideline
                icon={Waypoints}
                text={
                  isZh
                    ? "优先复用后端/服务层能力承接清单、仓库、安装生命周期与备份。"
                    : "Prefer backend and service-layer reuse for inventory, repositories, install lifecycle, and backup flows."
                }
              />
              <Guideline
                icon={FolderCog}
                text={
                  isZh
                    ? "界面继续沿着桌面控制台方向演进，而不是回到营销页面式的大段滚动。"
                    : "Continue evolving toward a desktop console rather than regressing into a marketing-style scrolling layout."
                }
              />
            </div>
          </Panel>
        </div>
      </div>
    </PageLayout>
  );
}

function InfoBanner({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-4 text-sm",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100"
          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function Guideline({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>{text}</div>
      </div>
    </div>
  );
}
