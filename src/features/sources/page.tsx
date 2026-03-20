const sourceCards = [
  {
    title: "Repository sources",
    description: "Track curated skill repositories and surface discovery metadata.",
  },
  {
    title: "ZIP imports",
    description: "Support local bundle installs for offline or private distribution.",
  },
  {
    title: "Unmanaged scan",
    description: "Detect skills that exist in app folders but are not yet owned by the workspace.",
  },
];

export function SourcesPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {sourceCards.map((card) => (
        <div key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-sky-200/70">Sources</div>
          <h3 className="mt-3 text-xl font-semibold text-white">{card.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
        </div>
      ))}
    </section>
  );
}
