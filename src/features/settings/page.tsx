import { useAppOverview } from "../../shared/lib/tauri";
import { getAppLabels, useI18n } from "../../shared/lib/i18n";
import { getDetectedInstalledAppIds, getSupportedAppIds, isKnownAppId } from "../../shared/types/skills";
import {
  EmptyPanel,
  InlineAlert,
  KeyValueList,
  PageIntro,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
} from "../../shared/components/workbench-ui";

export function SettingsPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const overviewQuery = useAppOverview();

  const overview = overviewQuery.data;
  const supportedAppIds = getSupportedAppIds(overview?.supportedApps);
  const detectedApps = overview?.detectedApps ?? [];
  const installedAppIds = getDetectedInstalledAppIds(detectedApps);
  const errorMessage = getErrorMessage(overviewQuery.error);

  const settings = overview
    ? [
        {
          key: "workspaceRoot",
          label: isZh ? "工作区根目录" : "Workspace root",
          value: overview.workspaceRoot,
          mono: true,
        },
        {
          key: "manifestFormat",
          label: isZh ? "Manifest 文件名" : "Manifest filename",
          value: "skill.json",
          mono: false,
        },
        {
          key: "syncModes",
          label: isZh ? "可用同步模式" : "Available sync modes",
          value: overview.syncModes.join(", "),
          mono: false,
        },
        {
          key: "supportedApps",
          label: isZh ? "支持的宿主类型" : "Supported host types",
          value:
            supportedAppIds.length > 0
              ? supportedAppIds.map((app) => appLabels[app]).join(isZh ? "、" : ", ")
              : isZh
                ? "当前不可用"
                : "Unavailable",
          mono: false,
        },
        {
          key: "installedApps",
          label: isZh ? "已检测到的宿主" : "Detected hosts",
          value:
            installedAppIds.length > 0
              ? installedAppIds.map((app) => appLabels[app]).join(isZh ? "、" : ", ")
              : isZh
                ? "未检测到可用宿主"
                : "No available hosts detected",
          mono: false,
        },
      ]
    : [];

  return (
    <PageLayout>
      <PageIntro
        eyebrow={isZh ? "环境" : "Environment"}
        title={isZh ? "环境信息台" : "Environment desk"}
        description={
          isZh
            ? "保持只读环境页定位，只展示当前工作区默认值与宿主检测结果。"
            : "Keep this as a read-only environment page with current workspace defaults and detected host results."
        }
        className="space-y-1.5"
        actions={
          overviewQuery.isFetching ? (
            <QueryHint tone="blue">{isZh ? "正在刷新环境信息" : "Refreshing environment info"}</QueryHint>
          ) : undefined
        }
      />

      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.42fr)_minmax(280px,0.58fr)]">
        <Panel
          eyebrow={isZh ? "默认值" : "Defaults"}
          title={isZh ? "环境默认值" : "Environment defaults"}
          density="compact"
        >
          {!overview && overviewQuery.isLoading ? (
            <SectionSkeleton rows={4} compact />
          ) : overview ? (
            <KeyValueList
              items={settings.map((item) => ({
                label: item.label,
                value: item.value,
                mono: item.mono,
              }))}
            />
          ) : (
            <EmptyPanel
              title={isZh ? "环境信息暂不可用" : "Environment information unavailable"}
              description={
                isZh ? "当前无法读取 Tauri 后端配置。" : "The Tauri backend configuration is currently unavailable."
              }
            />
          )}
        </Panel>

        <Panel
          eyebrow={isZh ? "宿主" : "Hosts"}
          title={isZh ? "检测结果" : "Detection results"}
          description={
            isZh
              ? "底部动作区只会使用这里检测到的宿主；未检测到的宿主不会出现在安装、导入和恢复目标里。"
              : "Bottom action docks only use the hosts detected here; undetected hosts are excluded from install, import, and restore targets."
          }
          density="compact"
        >
          {!overview && overviewQuery.isLoading ? (
            <SectionSkeleton rows={2} compact />
          ) : detectedApps.length > 0 ? (
            <div className="space-y-2">
              {detectedApps.map((app) => {
                const knownApp = isKnownAppId(app.appId) ? app.appId : null;
                const label = knownApp ? appLabels[knownApp] : app.appId;

                return (
                  <div
                    key={app.appId}
                    className="rounded-[16px] border border-slate-200/85 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{label}</span>
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          app.installed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/16 dark:text-emerald-100"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                        ].join(" ")}
                      >
                        {app.installed ? (isZh ? "已检测" : "Detected") : (isZh ? "未检测" : "Not found")}
                      </span>
                    </div>
                    {app.location ? (
                      <div className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">{app.location}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanel
              title={isZh ? "暂无宿主检测结果" : "No host detection results"}
              description={
                isZh ? "当前运行环境没有返回宿主检测信息。" : "The current runtime did not return host detection information."
              }
            />
          )}
        </Panel>
      </div>
    </PageLayout>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
}
