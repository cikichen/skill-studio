import { FolderCog } from "lucide-react";
import { useAppOverview } from "../../shared/lib/tauri";
import { getAppLabels, useI18n } from "../../shared/lib/i18n";
import { getSupportedAppIds } from "../../shared/types/skills";
import {
  Badge,
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
          label: isZh ? "支持的宿主" : "Supported hosts",
          value:
            supportedAppIds.length > 0
              ? supportedAppIds.map((app) => appLabels[app]).join(isZh ? "、" : ", ")
              : isZh
                ? "当前不可用"
                : "Unavailable",
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
            ? "查看当前工作区默认值、宿主支持与运行环境信息。"
            : "Inspect workspace defaults, supported hosts, and runtime environment information."
        }
        className="space-y-1.5"
        actions={
          overview ? (
            <>
              <Badge tone="slate">{isZh ? "宿主" : "Hosts"} {supportedAppIds.length}</Badge>
              {overviewQuery.isFetching ? (
                <QueryHint tone="blue">{isZh ? "正在刷新环境信息" : "Refreshing environment info"}</QueryHint>
              ) : null}
            </>
          ) : overviewQuery.isFetching ? (
            <QueryHint tone="blue">{isZh ? "正在刷新环境信息" : "Refreshing environment info"}</QueryHint>
          ) : undefined
        }
      />

      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
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

        <div className="space-y-3">
          <Panel
            eyebrow={isZh ? "宿主" : "Hosts"}
            title={isZh ? "当前支持的宿主" : "Currently supported hosts"}
            density="compact"
          >
            {!overview && overviewQuery.isLoading ? (
              <SectionSkeleton rows={2} compact />
            ) : supportedAppIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supportedAppIds.map((app) => (
                  <Badge key={app} tone="blue">
                    {appLabels[app]}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge tone="slate">{isZh ? "暂无数据" : "No data"}</Badge>
            )}
          </Panel>

          <Panel
            eyebrow={isZh ? "工作区" : "Workspace"}
            title={isZh ? "当前根目录" : "Current workspace root"}
            density="compact"
          >
            <div className="rounded-[18px] border border-slate-200/85 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <FolderCog className="h-4 w-4" />
                </div>
                <div className="min-w-0 break-all text-[13px] leading-5">
                  {overview?.workspaceRoot ?? (isZh ? "当前不可用" : "Unavailable")}
                </div>
              </div>
            </div>
          </Panel>
        </div>
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
