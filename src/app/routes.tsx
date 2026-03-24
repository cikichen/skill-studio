import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Boxes, DatabaseBackup, Settings, Sparkles } from "lucide-react";
import { AppShell } from "../shared/components/app-shell";
import { BackupsPage } from "../features/backups/page";
import { SettingsPage } from "../features/settings/page";
import { SkillsPage } from "../features/skills/page";
import { SourcesPage } from "../features/sources/page";

const navItems = [
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
        subtitle="A polished desktop foundation for modern AI skill management"
        navItems={navItems.map((item) => ({
          ...item,
          href: `#${item.to}`,
          renderLink: () => (
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  "group block rounded-2xl border px-4 py-3 transition",
                  isActive
                    ? "border-indigo-100 dark:border-white/10 bg-indigo-50/80 dark:bg-white/10 text-indigo-900 dark:text-white shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                    : "border-transparent bg-transparent text-slate-500 dark:text-slate-400 hover:border-white/60 dark:hover:border-white/10 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:translate-x-1",
                ].join(" ")
              }
            >
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {item.description}
                  </div>
                </div>
              </div>
            </NavLink>
          ),
        }))}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/skills" replace />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
