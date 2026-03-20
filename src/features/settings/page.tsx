const settings = [
  ["Workspace root", "~/.skill-studio"],
  ["Manifest format", "skill.json"],
  ["Default sync mode", "auto"],
  ["Detected platforms", "Claude, Codex, Gemini, OpenCode"],
] as const;

export function SettingsPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-sm uppercase tracking-[0.24em] text-sky-200/70">Settings</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">Environment defaults</h3>
        <div className="mt-6 space-y-4">
          {settings.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
            >
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-sm uppercase tracking-[0.24em] text-sky-200/70">Architecture</div>
        <h3 className="mt-2 text-xl font-semibold text-white">Boundaries to keep</h3>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
          <li>Manifest parsing should stay separate from install orchestration.</li>
          <li>Deployment strategy must distinguish symlink, copy, and auto policies.</li>
          <li>Diagnostics should report drift instead of silently mutating state.</li>
        </ul>
      </div>
    </section>
  );
}
