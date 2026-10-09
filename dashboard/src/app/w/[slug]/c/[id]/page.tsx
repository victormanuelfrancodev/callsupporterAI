import clsx from "clsx";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BarricadeIcon,
  BrainIcon,
  ChatCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  GlobeIcon,
  HandGrabbingIcon,
  IdentificationCardIcon,
  MicrophoneIcon,
  PackageIcon,
  RobotIcon,
  SirenIcon,
  SparkleIcon,
  TimerIcon,
  UserIcon,
  UserSwitchIcon,
  WrenchIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import { Avatar, Card, Chip, Confidence, PENDING, btn } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { clock, duration, timeAgo } from "@/lib/format";
import {
  AGENT_ISSUE,
  ESCALATION_STATUS,
  NEXT_STEP,
  RESOLVED,
  SENTIMENT,
  UPSET,
  URGENCY,
  fieldMeta,
  topicMeta,
  type Meta,
} from "@/lib/meta";
import { store } from "@/lib/store";
import type { Conversation, Message } from "@/lib/types";
import { setEscalationStatus } from "../../actions";

const TOOL_ICON: Record<string, PhIcon> = {
  get_order: PackageIcon,
  check_status: BarricadeIcon,
  decide_next_step: BrainIcon,
  escalate_to_human: SirenIcon,
};

function Bubble({ m }: { m: Message }) {
  if (m.role === "tool") {
    const Icon = (m.tool && TOOL_ICON[m.tool]) || WrenchIcon;
    return (
      <div className="flex min-w-0 justify-center">
        <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600">
          <Icon className="size-3.5 shrink-0 text-zinc-400" weight="duotone" />
          <code className="font-mono text-[11px] text-zinc-500">{m.tool}</code>
          <span className="truncate">{m.text}</span>
        </span>
      </div>
    );
  }
  const agent = m.role === "agent";
  return (
    <div className={clsx("flex items-end gap-2", agent ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]",
          agent ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md bg-zinc-100 text-zinc-800",
        )}
      >
        {m.text}
        <span className={clsx("mt-1 block text-[10px]", agent ? "text-indigo-200" : "text-zinc-400")}>{clock(m.at)}</span>
      </div>
      {agent ? (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
          <RobotIcon className="size-4" weight="duotone" />
        </span>
      ) : null}
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: PhIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="size-[18px] shrink-0 text-zinc-400" weight="duotone" />
      <span className="flex-1 text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-900">{children}</span>
    </div>
  );
}

function JudgmentRow({ label, meta, p }: { label: string; meta: Meta; p: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 py-2.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label}</span>
      <span />
      <Chip meta={meta} className="justify-self-start" />
      <Confidence p={p} tone={meta.tone} />
    </div>
  );
}

function RecordCard({ c }: { c: Conversation }) {
  if (!c.record) {
    return (
      <Card title="Order" icon={PackageIcon}>
        <p className="text-sm text-zinc-500">The agent didn&apos;t look up an order.</p>
      </Card>
    );
  }
  const r = c.record;
  return (
    <Card title="Order" icon={PackageIcon} action={<code className="font-mono text-xs text-zinc-500">{r.reference}</code>}>
      <div className="divide-y divide-zinc-100">
        {r.status ? <Field icon={SparkleIcon} label="Status"><Chip meta={{ label: r.status.label, tone: r.status.tone }} size="sm" /></Field> : null}
        {r.fields.map((f) => (
          <Field key={f.label} icon={IdentificationCardIcon} label={f.label}>
            {f.value}
          </Field>
        ))}
      </div>
    </Card>
  );
}

export default async function ConversationPage(props: PageProps<"/w/[slug]/c/[id]">) {
  const { slug, id } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const c = await store.getConversation(workspace.id, id);
  if (!c) notFound();
  const k = c.classification;
  const fields = workspace.config.classification.fields;

  return (
    <>
      <Link href={`/w/${slug}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeftIcon className="size-4" />
        Inbox
      </Link>

      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar name={c.customer.name} tone={k ? SENTIMENT[k.sentiment.value].tone : "neutral"} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{c.customer.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            {c.customer.email ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <EnvelopeSimpleIcon className="size-4 shrink-0" />
                <span className="truncate">{c.customer.email}</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5"><GlobeIcon className="size-4" />{c.customer.language}</span>
            <span className="inline-flex items-center gap-1.5">
              {c.channel === "voice" ? <MicrophoneIcon className="size-4" /> : <ChatCircleIcon className="size-4" />}
              {c.channel === "voice" ? "Voice" : "Chat"}
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><ClockIcon className="size-4" />{duration(c.durationSec)}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 pl-14 sm:w-auto sm:pl-0">
          <Chip meta={k ? topicMeta(workspace, k.topic.value) : PENDING} />
          {k ? <Chip meta={RESOLVED[k.resolved.value]} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Conversation" icon={ChatCircleIcon} action={<span className="text-xs text-zinc-400">{timeAgo(c.startedAt)}</span>}>
          {c.summary ? <p className="mb-5 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">{c.summary}</p> : null}
          <div className="space-y-3">
            {c.messages.length ? c.messages.map((m) => <Bubble key={m.id} m={m} />) : <p className="text-sm text-zinc-500">The transcript arrives when the call ends.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          {c.escalation ? (
            <Card
              title="Escalation"
              icon={SirenIcon}
              action={<Chip meta={ESCALATION_STATUS[c.escalation.status]} size="sm" />}
              className="border-rose-200"
            >
              <p className="text-sm text-zinc-700">{c.escalation.reason}</p>
              <div className="mt-3 divide-y divide-zinc-100">
                <Field icon={SirenIcon} label="Urgency"><Chip meta={URGENCY[c.escalation.urgency]} size="sm" /></Field>
                <Field icon={TimerIcon} label="Created">{timeAgo(c.escalation.createdAt)}</Field>
                <Field icon={UserIcon} label="Assignee">{c.escalation.assignee ?? "Unassigned"}</Field>
              </div>
              {c.escalation.status !== "resolved" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {c.escalation.status === "pending" ? (
                    <form action={setEscalationStatus.bind(null, slug, c.id, "in_progress")}>
                      <button className={clsx(btn.secondary, "w-full")}>
                        <HandGrabbingIcon className="size-4" weight="duotone" /> Take
                      </button>
                    </form>
                  ) : null}
                  <form action={setEscalationStatus.bind(null, slug, c.id, "resolved")} className={c.escalation.status === "pending" ? "" : "col-span-2"}>
                    <button className={clsx(btn.primary, "w-full")}>
                      <CheckCircleIcon className="size-4" weight="duotone" /> Resolve
                    </button>
                  </form>
                </div>
              ) : null}
            </Card>
          ) : null}

          <RecordCard c={c} />

          <Card title="Jev classification" icon={BrainIcon}>
            {k ? (
              <div className="divide-y divide-zinc-100">
                <JudgmentRow label="Topic" meta={topicMeta(workspace, k.topic.value)} p={k.topic.p} />
                {fields.map((f) =>
                  k.fields[f.key] ? (
                    <JudgmentRow key={f.key} label={f.label} meta={fieldMeta(workspace, f.key, k.fields[f.key].value)} p={k.fields[f.key].p} />
                  ) : null,
                )}
                <JudgmentRow label="Outcome" meta={RESOLVED[k.resolved.value]} p={k.resolved.p} />
                <JudgmentRow label="Sentiment" meta={SENTIMENT[k.sentiment.value]} p={k.sentiment.p} />
                <JudgmentRow label="Agent quality" meta={AGENT_ISSUE[k.agentIssue.value]} p={k.agentIssue.p} />
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Classified automatically when the conversation ends.</p>
            )}
          </Card>

          {c.decisions.length > 0 ? (
            <Card title="Live decisions" icon={SparkleIcon}>
              <ol className="space-y-5">
                {c.decisions.map((d) => (
                  <li key={d.at} className="relative border-l-2 border-indigo-100 pl-4">
                    <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-indigo-500" />
                    <p className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
                      {clock(d.at)}
                      {d.action === "escalate" ? (
                        <span className="inline-flex items-center gap-1 text-rose-600">
                          <UserSwitchIcon className="size-3.5" weight="bold" /> escalated
                        </span>
                      ) : null}
                    </p>
                    <div className="divide-y divide-zinc-100">
                      <JudgmentRow label="Next step" meta={NEXT_STEP[d.nextStep.value]} p={d.nextStep.p} />
                      <JudgmentRow label="Intent" meta={topicMeta(workspace, d.intent.value)} p={d.intent.p} />
                      <JudgmentRow label="Urgency" meta={URGENCY[d.urgency.value]} p={d.urgency.p} />
                      <JudgmentRow label="Mood" meta={UPSET[d.upset.value]} p={d.upset.p} />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
