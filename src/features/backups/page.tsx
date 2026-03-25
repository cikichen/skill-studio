import { useState } from "react";
import { Archive, Clock3, ShieldCheck } from "lucide-react";
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
import {
  EmptyPanel,
  PageIntro,
  PageLayout,
  Panel,
  StatCard,
  primaryButtonClassName,
  dangerButtonClassName,
} from "../../shared/components/workbench-ui";

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
    <PageLayout>
      <PageIntro
        eyebrow={isZh ? "备份" : "Backups"}
        title={isZh ? "本地恢复点工作台" : "Local restore-point workbench"}
        description={
          isZh
            ? "Backup 页面只围绕安全与恢复：选择恢复目标、查看已有备份，并执行恢复或删除。"
            : "Backups stays focused on safety and recovery: choose a restore target, inspect local snapshots, and restore or delete them."
        }
        aside={
          <>
            <StatCard
              icon={ShieldCheck}
              label={isZh ? "已安装" : "Installed"}
              value={String(installedSkills.length)}
              helper={isZh ? "受管技能" : "Managed skills"}
              tone="emerald"
            />
            <StatCard
              icon={Archive}
              label={isZh ? "备份点" : "Backups"}
              value={String(backups.length)}
              helper={isZh ? "可恢复快照" : "Available snapshots"}
              tone="amber"
            />
            <StatCard
              icon={Clock3}
              label={isZh ? "恢复目标" : "Target"}
              value={appLabels[currentApp]}
              helper={isZh ? "当前应用" : "Current host app"}
              tone="blue"
            />
          </>
        }
      />

      <Panel
        eyebrow={isZh ? "目标" : "Target"}
        title={isZh ? "恢复到应用" : "Restore into app"}
        description={
          isZh
            ? "恢复时只会写入当前选择的宿主应用目录。"
            : "Restore writes into the currently selected host app target only."
        }
      >
        <div className="flex flex-wrap gap-2">
          {APP_IDS.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => setCurrentApp(app)}
              className={[
                "rounded-md border px-4 py-2 text-sm transition",
                currentApp === app
                  ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-100"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80",
              ].join(" ")}
            >
              {appLabels[app]}
            </button>
          ))}
        </div>
      </Panel>

      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100">
          {actionError}
        </div>
      ) : null}

      <Panel
        eyebrow={isZh ? "列表" : "Inventory"}
        title={isZh ? "本地卸载备份" : "Local uninstall backups"}
        description={
          isZh
            ? "每条记录都来自真实卸载备份。桌面应用里只保留必要字段与动作，不再做营销式卡片堆叠。"
            : "Every row is backed by a real uninstall backup. The desktop UI keeps only the fields and actions needed for restore workflows."
        }
      >
        {isLoading ? (
          <EmptyPanel
            title={isZh ? "正在加载备份" : "Loading backups"}
            description={isZh ? "正在读取本地恢复点列表。" : "Reading local restore points."}
          />
        ) : backups.length === 0 ? (
          <EmptyPanel
            title={isZh ? "还没有备份记录" : "No backups yet"}
            description={
              isZh
                ? "卸载技能后，会在这里看到第一条本地备份快照。"
                : "Uninstall a skill to create the first local backup snapshot."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{isZh ? "技能" : "Skill"}</th>
                  <th className="px-4 py-3 font-medium">{isZh ? "创建时间" : "Created at"}</th>
                  <th className="px-4 py-3 font-medium">{isZh ? "备份路径" : "Backup path"}</th>
                  <th className="px-4 py-3 font-medium">{isZh ? "操作" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-700 dark:text-slate-200">
                {backups.map((backup) => (
                  <tr key={backup.backupId} className="align-top transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{backup.skill.name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{backup.skill.directory}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatUnixTime(backup.createdAt, locale)}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{backup.backupPath}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(backup.backupId)}
                          disabled={restoreBackupMutation.isPending}
                          className={primaryButtonClassName}
                        >
                          {isZh ? "恢复" : "Restore"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(backup.backupId)}
                          disabled={deleteBackupMutation.isPending}
                          className={dangerButtonClassName}
                        >
                          {isZh ? "删除" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageLayout>
  );
}

function formatUnixTime(value: number, locale: string) {
  return new Date(value * 1000).toLocaleString(locale);
}
