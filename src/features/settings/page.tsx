import { useQuery } from "@tanstack/react-query";
import { getAppOverview } from "../../shared/lib/tauri";
import { useI18n } from "../../shared/lib/i18n";

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
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
        <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
          {isZh ? "设置" : "Settings"}
        </div>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {isZh ? "环境默认值" : "Environment defaults"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
          {isZh
            ? "这个面板现在通过真实的 Tauri overview 命令获取数据，不再依赖静态骨架内容。"
            : "This panel is now backed by the real Tauri overview command instead of static scaffold data."}
        </p>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <InfoBanner
              message={
                isZh ? "正在加载应用概览..." : "Loading application overview..."
              }
            />
          ) : error instanceof Error ? (
            <InfoBanner message={error.message} tone="error" />
          ) : (
            settings.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4"
              >
                <span className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-right text-sm font-medium text-slate-900 dark:text-white">
                  {value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
        <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
          {isZh ? "架构" : "Architecture"}
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {isZh ? "迁移边界" : "Migration boundaries"}
        </h3>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
          <li>
            {isZh
              ? "在新增产品特性之前，先保持与 cc-switch 的技能行为兼容。"
              : "Keep cc-switch skill behavior compatible before adding product-specific enhancements."}
          </li>
          <li>
            {isZh
              ? "优先复用后端/服务层能力来承接清单、仓库、安装生命周期与备份。"
              : "Prefer backend/service reuse for inventory, repositories, install lifecycle, and backups."}
          </li>
          <li>
            {isZh
              ? "保留 Skill Studio 自己的界面风格，而不是直接拖入 cc-switch 更重的组件树。"
              : "Rebuild UI in Skill Studio style instead of dragging in cc-switch’s heavier component tree."}
          </li>
        </ul>
      </div>
    </section>
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
          ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
          : "border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 text-slate-700 dark:text-slate-300",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
