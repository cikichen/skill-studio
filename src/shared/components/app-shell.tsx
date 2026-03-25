import type { ComponentType, ReactNode } from "react";
import { Languages, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useI18n } from "../lib/i18n";

type NavItem = {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
};

type AppShellProps = {
  title: string;
  navItems: readonly NavItem[];
  children: ReactNode;
};

export function AppShell({ title, navItems, children }: AppShellProps) {
  const { isZh, language, toggleLanguage } = useI18n();

  return (
    <div className="h-screen flex flex-col bg-[#FAFBFC] text-slate-900 dark:bg-[#1d232a] dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#FAFBFC] pt-9 transition-all duration-200 dark:border-slate-800 dark:bg-[#1d232a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center h-16 gap-4">
            <div className="basis-[200px] shrink min-w-0">
              <Link
                to="/overview"
                className="flex w-full min-w-0 items-center gap-3 text-slate-900 dark:text-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition-transform active:scale-95 dark:text-blue-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xl font-semibold tracking-tight">{title}</div>
                  <div className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:block">
                    {isZh ? "AI 技能桌面控制台" : "AI skills desktop console"}
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex-1 flex justify-center min-w-0">
              <nav className="hidden min-[1120px]:flex items-center gap-1 rounded-full bg-gray-100/90 dark:bg-slate-800/90 p-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                          "px-4 xl:px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                        isActive
                          ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/90",
                      ].join(" ")
                    }
                    title={item.description}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <nav className="hidden min-[480px]:flex min-[1120px]:hidden max-w-full items-center gap-1 overflow-x-auto rounded-full bg-gray-100/90 dark:bg-slate-800/90 p-1 no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "shrink-0 p-2 rounded-full transition-all",
                          isActive
                            ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/90",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </NavLink>
                  );
                })}
              </nav>

              <nav className="min-[480px]:hidden flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-gray-100/90 dark:bg-slate-800/90 p-1.5 no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95",
                          isActive
                            ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/90",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="hidden min-[480px]:flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-gray-100/90 transition-colors hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-700"
                title={language === "zh-CN" ? "Switch to English" : "切换到中文"}
              >
                <Languages className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <button
                type="button"
                onClick={toggleLanguage}
                className="rounded-full border border-slate-200/80 bg-gray-100/90 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700"
                title={language === "zh-CN" ? "Switch to English" : "切换到中文"}
              >
                {language === "zh-CN" ? "EN" : "中文"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 py-10 md:px-8 md:py-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
