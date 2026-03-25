import { useMemo, useState } from "react";
import { Boxes, Compass, HardDriveDownload, Link2 } from "lucide-react";
import {
  useAddSkillRepo,
  useDiscoverableSkills,
  useRemoveSkillRepo,
  useSkillRepos,
} from "../skills/use-skills";
import { useI18n } from "../../shared/lib/i18n";
import {
  EmptyPanel,
  PageIntro,
  PageLayout,
  Panel,
  StatCard,
  Badge,
  inputClassName,
  primaryButtonClassName,
  dangerButtonClassName,
  listItemClassName,
} from "../../shared/components/workbench-ui";

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
    <PageLayout>
      <PageIntro
        eyebrow={isZh ? "来源" : "Sources"}
        title={isZh ? "技能来源与发现" : "Skill sources and discovery"}
        description={
          isZh
            ? "这一页专门负责仓库、ZIP 与本地导入入口。把来源管理与技能工作台拆开，避免 Installed 页面承担过多上下文。"
            : "This workbench is dedicated to repositories, ZIP flows, and discovery so Installed does not need to carry every import context at once."
        }
        aside={
          <>
            <StatCard
              icon={Boxes}
              label={isZh ? "仓库" : "Repositories"}
              value={String(repos.length)}
              helper={isZh ? "已配置来源" : "Configured sources"}
              tone="blue"
            />
            <StatCard
              icon={Compass}
              label={isZh ? "发现" : "Discovery"}
              value={String(discoverableSkills.length)}
              helper={isZh ? "可发现技能" : "Discoverable skills"}
              tone="violet"
            />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_0.95fr]">
        <Panel
          eyebrow={isZh ? "仓库" : "Repositories"}
          title={isZh ? "已配置的技能来源" : "Configured skill sources"}
          description={
            isZh
              ? "仓库配置由 Skill Studio 后端持久化。这里的表单只负责维护来源，不再承担安装页面的其它职责。"
              : "Repositories are persisted by the Skill Studio backend. This form stays focused on source maintenance instead of mixing in installation workflows."
          }
        >
          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder={
                isZh
                  ? "owner/name 或 https://github.com/owner/name"
                  : "owner/name or https://github.com/owner/name"
              }
              className={inputClassName}
            />
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder={isZh ? "分支" : "branch"}
              className={inputClassName}
            />
            <button type="button" onClick={handleAddRepo} className={primaryButtonClassName}>
              {isZh ? "添加仓库" : "Add repo"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {reposLoading ? (
              <EmptyPanel
                title={isZh ? "正在加载仓库" : "Loading repositories"}
                description={
                  isZh
                    ? "正在从 Rust 存储加载仓库..."
                    : "Loading repositories from Rust store..."
                }
              />
            ) : repos.length === 0 ? (
              <EmptyPanel
                title={isZh ? "还没有配置仓库" : "No repositories yet"}
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
                  <article key={repoKey} className={listItemClassName}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{repoKey}</div>
                          <Badge tone="blue">{repo.branch}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {isZh ? "可发现技能" : "Discoverable skills"}: {groupedSkills.get(repoKey) ?? 0}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRepo(repo.owner, repo.name)}
                        className={dangerButtonClassName}
                      >
                        {isZh ? "移除" : "Remove"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={isZh ? "发现" : "Discovery"}
          title={isZh ? "可用技能" : "Available skills"}
          description={
            isZh
              ? "可发现技能来自当前已配置仓库。这里只展示真实扫描结果，不再模拟营销页面式数据可视化。"
              : "Discoverable skills come from configured repositories. This pane shows real scan output instead of decorative marketing analytics."
          }
        >
          <div className="space-y-3">
            {discoverableSkills.length === 0 ? (
              <EmptyPanel
                title={isZh ? "发现列表为空" : "Discovery is empty"}
                description={
                  isZh
                    ? "添加仓库后即可填充发现列表。"
                    : "Add a repository to populate the discovery list."
                }
              />
            ) : (
              discoverableSkills.map((skill) => (
                <article key={skill.key} className={listItemClassName}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{skill.name}</div>
                        <Badge tone="violet">{skill.repoBranch}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Link2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        {skill.repoOwner}/{skill.repoName} · {skill.directory}
                      </div>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-2 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-200">
                      <HardDriveDownload className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{skill.description}</p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </PageLayout>
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
