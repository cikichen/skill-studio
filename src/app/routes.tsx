import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Boxes, DatabaseBackup, LayoutDashboard, MonitorCog, Sparkles } from "lucide-react";
import { AppShell } from "../shared/components/app-shell";
import { BackupsPage } from "../features/backups/page";
import { OverviewPage } from "../features/overview/page";
import { SettingsPage } from "../features/settings/page";
import { SkillsPage } from "../features/skills/page";
import { SourcesPage } from "../features/sources/page";
import { useI18n } from "../shared/lib/i18n";

export function AppRouter() {
  const { isZh } = useI18n();
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const navItems = [
    {
      to: "/overview",
      label: t("概览", "Overview"),
      description: t("工作区状态、快捷入口与近期活动", "Workspace health, quick actions, and recent activity"),
      icon: LayoutDashboard,
    },
    {
      to: "/skills",
      label: t("技能", "Skills"),
      description: t("已安装技能、启用范围与卸载操作", "Installed skills, activation coverage, and uninstall flow"),
      icon: Sparkles,
    },
    {
      to: "/sources",
      label: t("来源", "Sources"),
      description: t("仓库、ZIP 导入与来源发现", "Repositories, ZIP imports, and discovery"),
      icon: Boxes,
    },
    {
      to: "/backups",
      label: t("备份", "Backups"),
      description: t("恢复点管理与清理操作", "Restore points and cleanup actions"),
      icon: DatabaseBackup,
    },
    {
      to: "/settings",
      label: t("环境", "Environment"),
      description: t("工作区路径、宿主支持与默认信息", "Workspace paths, supported hosts, and default environment info"),
      icon: MonitorCog,
    },
  ] as const;

  return (
    <HashRouter>
      <AppShell title={t("技能工作台", "Skill Studio")} navItems={navItems}>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route
            path="/skills"
            element={
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <SkillsPage />
              </div>
            }
          />
          <Route
            path="/sources"
            element={
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <SourcesPage />
              </div>
            }
          />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
