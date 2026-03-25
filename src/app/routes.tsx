import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Boxes, DatabaseBackup, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { AppShell } from "../shared/components/app-shell";
import { BackupsPage } from "../features/backups/page";
import { OverviewPage } from "../features/overview/page";
import { SettingsPage } from "../features/settings/page";
import { SkillsPage } from "../features/skills/page";
import { SourcesPage } from "../features/sources/page";

const navItems = [
  {
    to: "/overview",
    label: "Overview",
    description: "Workspace health, quick actions, and recent activity",
    icon: LayoutDashboard,
  },
  {
    to: "/skills",
    label: "Installed",
    description: "Installed skills and activation overview",
    icon: Sparkles,
  },
  {
    to: "/sources",
    label: "Sources",
    description: "Repositories, ZIP imports, and discovery",
    icon: Boxes,
  },
  {
    to: "/backups",
    label: "Backups",
    description: "Restore points and cleanup actions",
    icon: DatabaseBackup,
  },
  {
    to: "/settings",
    label: "Settings",
    description: "Workspace paths and sync defaults",
    icon: Settings,
  },
] as const;

export function AppRouter() {
  return (
    <HashRouter>
      <AppShell
        title="Skill Studio"
        navItems={navItems}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
