import Link from "next/link";
import { CaretRightIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { Chip, Confidence, EmptyState, PageHeader } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { AGENT_ISSUE, TONE_CLASSES, topicMeta } from "@/lib/meta";
import { store } from "@/lib/store";
import type { AgentIssue, Classification, Conversation } from "@/lib/types";

export default async function QualityPage(props: PageProps<"/w/[slug]/quality">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const flagged = (await store.listConversations(workspace.id))
    .filter((c): c is Conversation & { classification: Classification } => Boolean(c.classification && c.classification.agentIssue.value !== "none"))
    .sort((a, b) => b.classification.agentIssue.p - a.classification.agentIssue.p);

  const counts = (Object.keys(AGENT_ISSUE) as AgentIssue[])
    .filter((k) => k !== "none")
    .map((k) => ({ k, n: flagged.filter((c) => c.classification.agentIssue.value === k).length }));

  return (
    <>
      <PageHeader icon={ShieldCheckIcon} title="Quality review" subtitle="Conversations where Jev flagged an agent issue" />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {counts.map(({ k, n }) => {
          const meta = AGENT_ISSUE[k];
          const Icon = meta.icon!;
          return (
            <div key={k} className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TONE_CLASSES[meta.tone].chip}`}>
                <Icon className="size-[22px]" weight="duotone" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900">{n}</p>
                <p className="text-xs text-zinc-500 sm:text-sm">{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {flagged.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title="All good" hint="No conversations flagged for review." />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
          {flagged.map((c) => {
            const issue = c.classification.agentIssue;
            return (
              <li key={c.id}>
                <Link href={`/w/${slug}/c/${c.id}`} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-zinc-50 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip meta={AGENT_ISSUE[issue.value]} />
                      <Chip meta={topicMeta(workspace, c.classification.topic.value)} size="sm" className="hidden sm:inline-flex" />
                    </div>
                    <p className="mt-2 truncate text-sm text-zinc-600">
                      <span className="font-medium text-zinc-900">{c.customer.name}</span>
                      <span className="mx-2 text-zinc-300">·</span>
                      {c.summary}
                    </p>
                  </div>
                  <div className="hidden flex-col items-end gap-1 sm:flex">
                    <Confidence p={issue.p} tone={AGENT_ISSUE[issue.value].tone} />
                    <span className="text-xs text-zinc-400">{timeAgo(c.startedAt)}</span>
                  </div>
                  <CaretRightIcon className="size-5 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
