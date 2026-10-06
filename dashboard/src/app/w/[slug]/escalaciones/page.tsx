import clsx from "clsx";
import Link from "next/link";
import { CaretRightIcon, ConfettiIcon, SirenIcon, TimerIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { Avatar, Chip, EmptyState, PENDING, PageHeader } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { ESCALATION_STATUS, TONE_CLASSES, URGENCY, topicMeta } from "@/lib/meta";
import { store } from "@/lib/store";
import type { Conversation, EscalationStatus, Workspace } from "@/lib/types";

const URGENCY_RANK = { alta: 0, media: 1, baja: 2 } as const;

function EscalationCard({ c, ws }: { c: Conversation; ws: Workspace }) {
  const e = c.escalation!;
  return (
    <Link
      href={`/w/${ws.slug}/c/${c.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 pl-5 transition-shadow hover:shadow-md hover:shadow-zinc-200/60 sm:p-5 sm:pl-6"
    >
      <span className={clsx("absolute inset-y-0 left-0 w-1", TONE_CLASSES[URGENCY[e.urgency].tone].bar)} />
      <Avatar name={c.customer.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900">{c.customer.name}</p>
          <Chip meta={c.classification ? topicMeta(ws, c.classification.topic.value) : PENDING} size="sm" />
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">{e.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5"><TimerIcon className="size-3.5" />{timeAgo(e.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5"><UserIcon className="size-3.5" />{e.assignee ?? "Sin asignar"}</span>
        </div>
      </div>
      <div className="hidden sm:block">
        <Chip meta={{ ...URGENCY[e.urgency], label: `Urgencia ${URGENCY[e.urgency].label.toLowerCase()}` }} />
      </div>
      <CaretRightIcon className="size-5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
    </Link>
  );
}

export default async function EscalationsPage(props: PageProps<"/w/[slug]/escalaciones">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const all = (await store.listConversations(workspace.id)).filter((c) => c.escalation);
  const by = (s: EscalationStatus) =>
    all
      .filter((c) => c.escalation!.status === s)
      .sort(
        (a, b) =>
          URGENCY_RANK[a.escalation!.urgency] - URGENCY_RANK[b.escalation!.urgency] ||
          a.escalation!.createdAt.localeCompare(b.escalation!.createdAt),
      );
  const groups = (["pendiente", "en_curso"] as const).map((s) => ({ s, items: by(s) }));
  const openCount = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <PageHeader icon={SirenIcon} title="Escalaciones" subtitle={`${openCount} esperando a una persona del equipo`} />

      {openCount === 0 ? (
        <EmptyState icon={ConfettiIcon} title="Cola vacía" hint="El agente está resolviendo todo por su cuenta." />
      ) : (
        <div className="space-y-8">
          {groups
            .filter((g) => g.items.length > 0)
            .map(({ s, items }) => (
              <section key={s}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className={clsx("size-2 rounded-full", TONE_CLASSES[ESCALATION_STATUS[s].tone].dot)} />
                  {ESCALATION_STATUS[s].label}
                  <span className="font-normal text-zinc-400">{items.length}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((c) => (
                    <EscalationCard key={c.id} c={c} ws={workspace} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </>
  );
}
