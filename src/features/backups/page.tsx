const backups = [
  { name: "workspace-bootstrap", createdAt: "2026-03-18 22:41", size: "1.8 MB" },
  { name: "release-checklist", createdAt: "2026-03-17 09:12", size: "640 KB" },
];

export function BackupsPage() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-sky-200/70">Backups</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">Restore points</h3>
        </div>
        <p className="text-sm text-slate-400">Backups should be first-class, not a side-effect of uninstall.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Created at</th>
              <th className="px-4 py-3 font-medium">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {backups.map((backup) => (
              <tr key={`${backup.name}-${backup.createdAt}`} className="bg-slate-950/30 text-slate-200">
                <td className="px-4 py-4">{backup.name}</td>
                <td className="px-4 py-4">{backup.createdAt}</td>
                <td className="px-4 py-4">{backup.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
