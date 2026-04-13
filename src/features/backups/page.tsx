import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import {
  useDeleteSkillBackup,
  useRestoreSkillBackup,
  useSkillBackups,
} from "../skills/use-skills";
import type { AppId } from "../../shared/types/skills";
import { formatUnixTime, getErrorMessage } from "../../shared/lib/format";
import {
  getAppLabels,
  getLocaleForLanguage,
  useI18n,
} from "../../shared/lib/i18n";
import { useSupportedAppIds } from "../../shared/lib/tauri";
import {
  ConfirmActionDialog,
  EmptyPanel,
  InlineAlert,
  PageIntro,
  PageLayout,
  Panel,
  QueryHint,
  SectionSkeleton,
  dangerButtonClassName,
  primaryButtonClassName,
} from "../../shared/components/workbench-ui";

const EMPTY_SUPPORTED_APP_IDS: AppId[] = [];

export function BackupsPage() {
  const { language, isZh } = useI18n();
  const appLabels = getAppLabels(language);
  const locale = getLocaleForLanguage(language);
  const [currentApp, setCurrentApp] = useState<AppId>("claude");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmingDeleteBackup, setConfirmingDeleteBackup] = useState<{
    backupId: string;
    skillName: string;
    backupPath: string;
  } | null>(null);

  const backupsQuery = useSkillBackups();
  const supportedAppsQuery = useSupportedAppIds();
  const deleteBackupMutation = useDeleteSkillBackup();
  const restoreBackupMutation = useRestoreSkillBackup();

  const backups = backupsQuery.data ?? [];
  const backupsReady = backupsQuery.data !== undefined;
  const supportedAppIds = supportedAppsQuery.data ?? EMPTY_SUPPORTED_APP_IDS;

  useEffect(() => {
    if (!supportedAppIds.length) {
      return;
    }

    if (!supportedAppIds.includes(currentApp)) {
      setCurrentApp(supportedAppIds[0]);
    }
  }, [currentApp, supportedAppIds]);

  const effectiveCurrentApp = supportedAppIds.includes(currentApp) ? currentApp : null;

  const errorMessage =
    actionError ??
    getErrorMessage(backupsQuery.error) ??
    getErrorMessage(supportedAppsQuery.error);

  async function handleRestore(backupId: string) {
    if (!effectiveCurrentApp) {
      return;
    }

    setActionError(null);
    setPendingRestoreId(backupId);

    try {
      await restoreBackupMutation.mutateAsync({ backupId, currentApp: effectiveCurrentApp });
    } catch (error) {
      setActionError(getErrorMessage(error) ?? (isZh ? "恢复备份失败。" : "Failed to restore backup."));
    } finally {
      setPendingRestoreId(null);
    }
  }

  async function handleDelete(backupId: string) {
    setActionError(null);
    setPendingDeleteId(backupId);

    try {
      await deleteBackupMutation.mutateAsync(backupId);
    } catch (error) {
      setActionError(getErrorMessage(error) ?? (isZh ? "删除备份失败。" : "Failed to delete backup."));
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <PageLayout>
      <PageIntro
        eyebrow={isZh ? "备份" : "Backups"}
        title={isZh ? "备份工作台" : "Backups workbench"}
        description={
          isZh
            ? "选择恢复目标并管理本地备份记录。"
            : "Choose a restore target and manage local backup records."
        }
        className="space-y-1.5"
        actions={
          <>
            <div className="rounded-[18px] border border-slate-200/85 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {isZh ? "当前目标" : "Current target"}
              </div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900 dark:text-white">
                {effectiveCurrentApp ? appLabels[effectiveCurrentApp] : isZh ? "当前不可用" : "Unavailable"}
              </div>
            </div>
            {(backupsQuery.isFetching && backupsReady) || (supportedAppsQuery.isFetching && supportedAppsQuery.data) ? (
              <QueryHint tone="amber">{isZh ? "正在刷新备份列表" : "Refreshing backups"}</QueryHint>
            ) : null}
          </>
        }
      />

      {errorMessage ? <InlineAlert tone="rose">{errorMessage}</InlineAlert> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <Panel
          eyebrow={isZh ? "目标" : "Target"}
          title={isZh ? "恢复到应用" : "Restore into app"}
          density="compact"
        >
          <div className="space-y-3">
            <div className="text-[13px] text-slate-600 dark:text-slate-300">
              {isZh ? "先选定恢复目标，再从右侧恢复点中执行恢复。" : "Choose a restore target first, then restore from the entries on the right."}
            </div>
            {supportedAppIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supportedAppIds.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setCurrentApp(app)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                      currentApp === app
                        ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80",
                    ].join(" ")}
                  >
                    {appLabels[app]}
                  </button>
                ))}
              </div>
            ) : (
              <InlineAlert tone="slate">
                {isZh ? "当前没有可用宿主，暂时无法执行恢复操作。" : "No supported hosts are available right now, so restore actions are temporarily unavailable."}
              </InlineAlert>
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={isZh ? "列表" : "Inventory"}
          title={isZh ? "本地卸载备份" : "Local uninstall backups"}
          density="compact"
        >
          {!backupsReady && backupsQuery.isLoading ? (
            <SectionSkeleton rows={4} compact />
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
            <div className="space-y-2.5">
              {backups.map((backup) => {
                const restorePending = pendingRestoreId === backup.backupId;
                const deletePending = pendingDeleteId === backup.backupId;
                const rowBusy = restorePending || deletePending;

                return (
                  <article
                    key={backup.backupId}
                    className="rounded-[18px] border border-slate-200/85 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-700/85 dark:bg-slate-950/72 dark:shadow-[0_1px_2px_rgba(2,6,23,0.4)]"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200">
                            <Archive className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{backup.skill.name}</div>
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{backup.skill.directory}</div>
                            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {formatUnixTime(backup.createdAt, locale)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-400">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {isZh ? "备份路径" : "Backup path"}
                          </div>
                          <div className="mt-1 break-all">{backup.backupPath}</div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col xl:items-stretch">
                        <button
                          type="button"
                          onClick={() => handleRestore(backup.backupId)}
                          disabled={rowBusy || !effectiveCurrentApp}
                          className={primaryButtonClassName}
                        >
                          {restorePending ? (isZh ? "恢复中…" : "Restoring…") : (isZh ? "恢复" : "Restore")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmingDeleteBackup({
                              backupId: backup.backupId,
                              skillName: backup.skill.name,
                              backupPath: backup.backupPath,
                            })
                          }
                          disabled={rowBusy}
                          className={dangerButtonClassName}
                        >
                          {deletePending ? (isZh ? "删除中…" : "Deleting…") : (isZh ? "删除" : "Delete")}
                        </button>
                      </div>
                    </div>

                    {rowBusy ? (
                      <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        {restorePending
                          ? effectiveCurrentApp
                            ? isZh
                              ? `正在恢复到 ${appLabels[effectiveCurrentApp]}`
                              : `Restoring into ${appLabels[effectiveCurrentApp]}`
                            : isZh
                              ? "当前没有可用恢复目标"
                              : "No restore target is currently available"
                          : isZh
                            ? "正在删除该备份"
                            : "Deleting this backup"}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <ConfirmActionDialog
        open={confirmingDeleteBackup !== null}
        title={isZh ? "确认删除备份" : "Confirm backup deletion"}
        description={
          confirmingDeleteBackup
            ? isZh
              ? `删除后将无法再从 ${confirmingDeleteBackup.skillName} 的这个恢复点恢复。`
              : `After deletion, you won't be able to restore ${confirmingDeleteBackup.skillName} from this restore point.`
            : ""
        }
        confirmLabel={pendingDeleteId ? (isZh ? "删除中…" : "Deleting…") : (isZh ? "确认删除" : "Confirm delete")}
        cancelLabel={isZh ? "取消" : "Cancel"}
        busy={pendingDeleteId !== null}
        onCancel={() => {
          if (!pendingDeleteId) {
            setConfirmingDeleteBackup(null);
          }
        }}
        onConfirm={() => {
          if (confirmingDeleteBackup) {
            void handleDelete(confirmingDeleteBackup.backupId).finally(() => {
              setConfirmingDeleteBackup(null);
            });
          }
        }}
      >
        {confirmingDeleteBackup ? (
          <div className="space-y-2.5">
            <div className="rounded-[18px] border border-slate-200/85 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {isZh ? "技能" : "Skill"}
              </div>
              <div className="mt-2 font-medium">{confirmingDeleteBackup.skillName}</div>
            </div>
            <div className="rounded-[18px] border border-slate-200/85 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {isZh ? "备份路径" : "Backup path"}
              </div>
              <div className="mt-2 break-all font-mono text-[13px]">{confirmingDeleteBackup.backupPath}</div>
            </div>
          </div>
        ) : null}
      </ConfirmActionDialog>
    </PageLayout>
  );
}
