import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Check, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import type { Language } from "../lib/i18n-config";

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

type LanguageOption = {
  code: Language;
  label: string;
  short: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "zh-CN", label: "简体中文", short: "ZH" },
  { code: "en", label: "English", short: "EN" },
];

function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutsideClick: () => void
) {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, onOutsideClick]);
}

function LanguageDropdown({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentLanguage =
    LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700/90"
        title={language === "zh-CN" ? "切换语言" : "Switch language"}
      >
        <span className="text-[13px] font-bold tracking-[0.02em]">{currentLanguage.short}</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-200 dark:border-slate-700 dark:bg-slate-800">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = option.code === language;

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  setLanguage(option.code);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-blue-50 font-medium text-blue-500 dark:bg-blue-900/10 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/70",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono text-xs font-bold">{option.short}</span>
                  <span className="text-xs opacity-80">{option.label}</span>
                </div>
                {selected ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ title, navItems, children }: AppShellProps) {
  const { isZh, language, setLanguage } = useI18n();
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const location = useLocation();
  const mainFrameRef = useRef<HTMLDivElement>(null);

  const themeLabel =
    theme === "light"
      ? isZh
        ? "浅色"
        : "Light"
      : theme === "dark"
        ? isZh
          ? "深色"
          : "Dark"
        : isZh
          ? "系统"
          : "System";

  const ThemeIcon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Sun : Moon;

  useEffect(() => {
    mainFrameRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="desktop-shell flex h-screen flex-col text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 px-2.5 pt-2.5 md:px-3 md:pt-3">
        <div className="desktop-topbar mx-auto max-w-7xl rounded-[1.4rem] px-3.5 md:px-4.5">
          <div className="flex min-h-[54px] items-center gap-3 py-2">
            <div className="min-w-0 shrink basis-[176px]">
              <Link
                to="/overview"
                className="flex w-full min-w-0 items-center gap-3 text-slate-900 dark:text-white"
              >
                <div className="desktop-brand-mark flex h-8 w-8 items-center justify-center rounded-[0.9rem] text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-[-0.04em]">{title}</div>
                </div>
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 justify-center">
              <nav className="desktop-nav-track hidden items-center gap-1 rounded-full p-1 min-[1120px]:flex">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "desktop-nav-link rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap xl:px-4",
                        isActive ? "desktop-nav-link-active" : "",
                      ].join(" ")
                    }
                    title={item.description}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <nav className="desktop-nav-track hidden max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar min-[480px]:flex min-[1120px]:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "desktop-nav-link shrink-0 rounded-full p-1.75",
                          isActive ? "desktop-nav-link-active" : "",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </NavLink>
                  );
                })}
              </nav>

              <nav className="desktop-nav-track flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar min-[480px]:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "desktop-nav-link flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isActive ? "desktop-nav-link-active" : "",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={cycleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700/90"
                title={
                  isZh
                    ? `主题：${themeLabel}，点击切换`
                    : `Theme: ${themeLabel}. Click to cycle`
                }
              >
                <ThemeIcon className="h-4.5 w-4.5" />
              </button>
              <LanguageDropdown language={language} setLanguage={setLanguage} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 pb-2.5 pt-2 md:px-3 md:pb-3">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div ref={mainFrameRef} className="desktop-main-frame no-scrollbar mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto rounded-[1.6rem] px-3.5 py-3 md:px-5 md:py-3.5">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
