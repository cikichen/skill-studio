import { useMemo, useState } from "react";
import {
  useAddSkillRepo,
  useDiscoverableSkills,
  useRemoveSkillRepo,
  useSkillRepos,
} from "../skills/use-skills";
import { useI18n } from "../../shared/lib/i18n";

export function SourcesPage() {
  const { isZh } = useI18n();
  const { data: repos = [], isLoading: reposLoading } = useSkillRepos();
  const { data: discoverableSkills = [] } = useDiscoverableSkills();
  const addRepoMutation = useAddSkillRepo();
  const removeRepoMutation = useRemoveSkillRepo();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [error, setError] = useState<string | null>(null);

  const groupedSkills = useMemo(() => {
    const grouped = new Map<string, number>();
    discoverableSkills.forEach((skill) => {
      const key = `${skill.repoOwner}/${skill.repoName}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });
    return grouped;
  }, [discoverableSkills]);

  async function handleAddRepo() {
    setError(null);
    const parsed = parseRepoUrl(repoUrl);

    if (!parsed) {
      setError(
        isZh
          ? "请输入 owner/name 或完整的 GitHub 仓库 URL。"
          : "Use owner/name or a full GitHub repository URL."
      );
      return;
    }

    try {
      await addRepoMutation.mutateAsync({
        owner: parsed.owner,
        name: parsed.name,
        branch: branch.trim() || "main",
        enabled: true,
      });
      setRepoUrl("");
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : String(mutationError)
      );
    }
  }

  async function handleRemoveRepo(owner: string, name: string) {
    setError(null);
    try {
      await removeRepoMutation.mutateAsync({ owner, name });
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : String(mutationError)
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
            {isZh ? "仓库" : "Repositories"}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isZh ? "已配置的技能来源" : "Configured skill sources"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {isZh
              ? "这里延续了 cc-switch 的仓库管理能力：仓库配置现在由 Skill Studio 后端持久化。"
              : "This is the first migrated slice from cc-switch: repositories are now persisted by the Skill Studio backend."}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder={
                isZh
                  ? "owner/name 或 https://github.com/owner/name"
                  : "owner/name or https://github.com/owner/name"
              }
              className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:text-slate-500"
            />
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder={isZh ? "分支" : "branch"}
              className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:text-slate-500"
            />
            <button
              onClick={handleAddRepo}
              className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-900 dark:text-indigo-100 transition hover:bg-indigo-200 dark:bg-indigo-500/20 active:scale-95 transition-all duration-300"
            >
              {isZh ? "添加仓库" : "Add repo"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

          <div className="mt-6 space-y-3">
            {reposLoading ? (
              <SourceEmptyState
                description={
                  isZh
                    ? "正在从 Rust 存储加载仓库..."
                    : "Loading repositories from Rust store..."
                }
              />
            ) : repos.length === 0 ? (
              <SourceEmptyState
                description={
                  isZh
                    ? "还没有配置任何仓库。"
                    : "No repositories configured yet."
                }
              />
            ) : (
              repos.map((repo) => {
                const repoKey = `${repo.owner}/${repo.name}`;
                return (
                  <article
                    key={repoKey}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{repoKey}</div>
                      <div className="mt-1 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                        {isZh ? "分支" : "branch"} {repo.branch} ·{" "}
                        {groupedSkills.get(repoKey) ?? 0}{" "}
                        {isZh ? "个可发现技能" : "discoverable skills"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRepo(repo.owner, repo.name)}
                      className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20"
                    >
                      {isZh ? "移除" : "Remove"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm backdrop-blur-xl p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-indigo-600/80 dark:text-indigo-400/70 font-semibold">
            {isZh ? "发现" : "Discovery"}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isZh ? "可用技能" : "Available skills"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            {isZh
              ? "当前会从已配置的 GitHub 仓库下载 ZIP、扫描真实目录中的 SKILL.md，并在需要时自动回退分支。"
              : "Discoverable skills are now fetched from the configured GitHub repositories by downloading repository ZIPs, scanning real directories for SKILL.md, and resolving branch fallbacks when needed."}
          </p>

          <div className="mt-6 space-y-3">
            {discoverableSkills.length === 0 ? (
              <SourceEmptyState
                description={
                  isZh
                    ? "添加仓库后即可填充发现列表。"
                    : "Add a repository to populate the discovery list."
                }
              />
            ) : (
              discoverableSkills.map((skill) => (
                <article
                  key={skill.key}
                  className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all duration-300 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{skill.name}</div>
                      <div className="mt-1 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                        {skill.repoOwner}/{skill.repoName} · {skill.directory}
                      </div>
                    </div>
                    <span className="rounded-full border border-gray-100 dark:border-slate-800 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
                      {skill.repoBranch}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500 dark:text-slate-400">
                    {skill.description}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceEmptyState({ description }: { description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm px-5 py-8 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
      {description}
    </div>
  );
}

function parseRepoUrl(input: string) {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length !== 2) {
    return null;
  }

  return {
    owner: parts[0],
    name: parts[1],
  };
}
