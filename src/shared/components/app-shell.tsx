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
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-6 py-6 lg:px-8">
        <aside className="hidden w-[320px] shrink-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur xl:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-200">
              Skill Studio
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-3">{navItems.map((item) => item.renderLink())}</nav>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="font-medium text-white">Ready for real commands</div>
            <p className="mt-2 leading-6 text-slate-400">
              Replace the placeholder pages with Tauri-powered data flows for install, sync,
              backup, and diagnostics.
            </p>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col rounded-[32px] border border-white/10 bg-slate-950/45 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur md:p-6 lg:p-8">
          <header className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-sky-200/70">Desktop shell</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Build a better skills manager
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
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
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{helper}</div>
    </div>
  );
}
