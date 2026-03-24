import { useState } from "react";
import {
  useDeleteSkillBackup,
  useInstalledSkills,
  useRestoreSkillBackup,
  useSkillBackups,
} from "../skills/use-skills";
import type { AppId } from "../../shared/types/skills";
import {
  getAppLabels,
  getLocaleForLanguage,
  useI18n,
} from "../../shared/lib/i18n";

const APP_IDS: AppId[] = ["claude", "codex", "gemini", "opencode", "openclaw"];

export function BackupsPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const [currentApp, setCurrentApp] = useState<AppId>("claude");
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: installedSkills = [] } = useInstalledSkills();
  const { data: backups = [], isLoading } = useSkillBackups();
  const deleteBackupMutation = useDeleteSkillBackup();
  const restoreBackupMutation = useRestoreSkillBackup();

  async function handleRestore(backupId: string) {
    setActionError(null);

    try {
      await restoreBackupMutation.mutateAsync({ backupId, currentApp });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleDelete(backupId: string) {
    setActionError(null);

    try {
      await deleteBackupMutation.mutateAsync(backupId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="space-y-6 rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
            {isZh ? "备份" : "Backups"}
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isZh ? "本地卸载备份" : "Local uninstall backups"}
          </h3>
        </div>
        <p className="max-w-xl text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
          {isZh
            ? "Skill Studio 会在工作区下创建本地卸载备份，并可将其恢复到当前选择的应用目标。"
            : "Skill Studio now creates local uninstall backups under the workspace directory and can restore them into the selected app target."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={isZh ? "已安装技能" : "Installed skills"}
          value={String(installedSkills.length)}
        />
        <MetricCard
          label={isZh ? "可用备份" : "Available backups"}
          value={String(backups.length)}
        />
        <MetricCard
          label={isZh ? "恢复目标" : "Restore target"}
          value={appLabels[currentApp]}
        />
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm p-4">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 dark:text-slate-400">
          {isZh ? "恢复到应用" : "Restore into app"}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {APP_IDS.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => setCurrentApp(app)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                currentApp === app
                  ? "border-indigo-200 dark:border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-100"
                  : "border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/[0.06] active:scale-95 transition-all duration-300",
              ].join(" ")}
            >
              {appLabels[app]}
            </button>
          ))}
        </div>
      </div>

      {actionError ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
          {actionError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">
                {isZh ? "技能" : "Skill"}
              </th>
              <th className="px-4 py-3 font-medium">
                {isZh ? "创建时间" : "Created at"}
              </th>
              <th className="px-4 py-3 font-medium">
                {isZh ? "备份路径" : "Backup path"}
              </th>
              <th className="px-4 py-3 font-medium">
                {isZh ? "操作" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr className="bg-white dark:bg-[#0f172a] shadow-sm text-slate-700 dark:text-slate-300">
                <td colSpan={4} className="px-4 py-6 text-center">
                  {isZh ? "正在加载备份..." : "Loading backups..."}
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr className="bg-white dark:bg-[#0f172a] shadow-sm text-slate-700 dark:text-slate-300">
                <td colSpan={4} className="px-4 py-6 text-center">
                  {isZh
                    ? "卸载技能后，会在这里看到第一条本地备份快照。"
                    : "Uninstall a skill to create the first local backup snapshot."}
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr
                  key={backup.backupId}
                  className="bg-white dark:bg-[#0f172a] shadow-sm text-slate-800 dark:text-slate-200"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {backup.skill.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                      {backup.skill.directory}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {formatUnixTime(backup.createdAt, locale)}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                    {backup.backupPath}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(backup.backupId)}
                        disabled={restoreBackupMutation.isPending}
                        className="rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-sm text-indigo-900 dark:text-indigo-100 transition hover:bg-indigo-200 dark:bg-indigo-500/20 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isZh ? "恢复" : "Restore"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(backup.backupId)}
                        disabled={deleteBackupMutation.isPending}
                        className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isZh ? "删除" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function formatUnixTime(value: number, locale: string) {
  return new Date(value * 1000).toLocaleString(locale);
}
