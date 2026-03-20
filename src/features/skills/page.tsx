const installedSkills = [
  {
    name: "workspace-bootstrap",
    source: "github.com/team/skill-catalog",
    version: "1.2.0",
    apps: ["Claude", "Codex", "Gemini"],
    status: "Healthy",
  },
  {
    name: "release-checklist",
    source: "Local ZIP import",
    version: "0.8.4",
    apps: ["OpenCode"],
    status: "Needs review",
  },
];

export function SkillsPage() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.5fr_minmax(320px,420px)]">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200/70">Installed</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Unified skill inventory</h3>
          </div>
          <button className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20">
            Scan workspace
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {installedSkills.map((skill) => (
            <article
              key={skill.name}
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-white">{skill.name}</h4>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      v{skill.version}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Source: {skill.source}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skill.apps.map((app) => (
                      <span
                        key={app}
                        className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-100"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  <div>Status</div>
                  <div className="mt-2 font-medium text-white">{skill.status}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <PanelCard
          title="Deployment model"
          description="Separate installation from activation to support per-app enable/disable without duplicating skill sources."
        />
        <PanelCard
          title="Next integration"
          description="Wire this page to a Rust command returning installed skills, activation state, and drift diagnostics."
        />
      </aside>
    </section>
  );
}

type PanelCardProps = {
  title: string;
  description: string;
};

function PanelCard({ title, description }: PanelCardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
