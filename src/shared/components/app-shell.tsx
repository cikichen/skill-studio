import type { ReactNode } from "react";

type NavItem = {
  label: string;
  description: string;
  href: string;
  renderLink: () => ReactNode;
};

type AppShellProps = {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: ReactNode;
};

export function AppShell({ title, subtitle, navItems, children }: AppShellProps) {
  return (
    <div className="min-h-[100vh] bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-950 dark:via-[#0b1120] dark:to-indigo-950/20 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-[100vh] max-w-[1600px] gap-6 px-6 py-6 lg:px-8">
        <aside className="hidden w-[320px] shrink-0 flex-col rounded-[28px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-2xl xl:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              Skill Studio
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-3">{navItems.map((item) => item.renderLink())}</nav>

          <div className="rounded-2xl border border-sky-100 dark:border-white/10 bg-sky-50/50 dark:bg-white/5 p-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="font-medium text-slate-900 dark:text-white">Ready for real commands</div>
            <p className="mt-2 leading-6 text-slate-500 dark:text-slate-400">
              Replace the placeholder pages with Tauri-powered data flows for install, sync,
              backup, and diagnostics.
            </p>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col rounded-[32px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-2xl md:p-6 lg:p-8">
          <header className="mb-6 rounded-[28px] border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] font-medium text-indigo-500 dark:text-indigo-400">Desktop shell</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  Build a better skills manager
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Lightweight Tauri foundation with React Query, modern routing, and modular Rust
                  backend boundaries.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Platform" value="Tauri 2" helper="Rust-native desktop shell" />
                <MetricCard label="Frontend" value="React 19" helper="Type-safe dashboard scaffold" />
              </div>
            </div>
          </header>

          <div className="xl:hidden">
            <div className="mb-6 grid gap-3 md:grid-cols-2">{navItems.map((item) => item.renderLink())}</div>
          </div>

          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</div>
    </div>
  );
}
