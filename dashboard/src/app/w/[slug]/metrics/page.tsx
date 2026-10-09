import clsx from "clsx";
import {
  ChartBarIcon,
  ChartLineUpIcon,
  ChatsCircleIcon,
  RobotIcon,
  SirenIcon,
  TagIcon,
  ThumbsDownIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import { Card, PageHeader } from "@/components/ui";
import { VolumeChart } from "@/components/volume-chart";
import { requireWorkspace } from "@/lib/auth";
import { pct } from "@/lib/format";
import { iconFor } from "@/lib/icons";
import { TONE_CLASSES } from "@/lib/meta";
import { store } from "@/lib/store";
import type { Tone } from "@/lib/types";

// Validated two-slot categorical pair for share bars (see VolumeChart).
const SHARE_COLORS = ["bg-teal-600", "bg-indigo-600", "bg-zinc-300"];

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: PhIcon; label: string; value: string; hint: string; tone: Tone }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={clsx("grid size-9 place-items-center rounded-lg", TONE_CLASSES[tone].chip)}>
          <Icon className="size-5" weight="duotone" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

export default async function MetricsPage(props: PageProps<"/w/[slug]/metrics">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const [all, daily] = await Promise.all([store.listConversations(workspace.id), store.dailyVolume(workspace.id)]);
  const classified = all.filter((c) => c.classification);
  const n = classified.length || 1;
  const count = (fn: (c: (typeof classified)[number]) => boolean) => classified.filter(fn).length;

  const resolvedByAgent = count((c) => c.classification!.resolved.value === "resolved");
  const escalated = count((c) => c.classification!.resolved.value === "escalated");
  const negative = count((c) => c.classification!.sentiment.value === "negative");
  const total14 = daily.reduce((s, d) => s + d.total, 0);
  const peak = daily.reduce((a, b) => (b.total > a.total ? b : a), daily[0]);

  const { topics: topicOptions, fields } = workspace.config.classification;
  const topics = topicOptions
    .map((t) => ({ t, n: count((c) => c.classification!.topic.value === t.value) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxTopic = topics[0]?.n ?? 1;

  const field = fields[0];
  const split = field?.options.map((o, i) => ({
    o,
    color: SHARE_COLORS[Math.min(i, SHARE_COLORS.length - 1)],
    n: count((c) => c.classification!.fields[field.key]?.value === o.value),
  }));

  return (
    <>
      <PageHeader icon={ChartBarIcon} title="Metrics" subtitle="How the agent is performing" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={RobotIcon} label="Resolved without a human" value={pct(resolvedByAgent / n)} hint={`${resolvedByAgent} of ${classified.length} conversations`} tone="good" />
        <Kpi icon={ChatsCircleIcon} label="Conversations" value={total14.toLocaleString("en")} hint="Last 14 days" tone="brand" />
        <Kpi icon={SirenIcon} label="Escalated" value={pct(escalated / n)} hint={`${escalated} handed to a person`} tone="bad" />
        <Kpi icon={ThumbsDownIcon} label="Negative sentiment" value={pct(negative / n)} hint={`${negative} upset customers`} tone="warn" />
      </div>

      <Card
        title="Daily volume"
        icon={ChartLineUpIcon}
        className="mt-6"
        action={
          peak?.incident ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              Peak of {peak.total} during {workspace.config.integrations.statusFeedLabel.toLowerCase()}
            </span>
          ) : null
        }
      >
        <VolumeChart data={daily} />
      </Card>

      <div className={clsx("mt-6 grid gap-6", split && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
        <Card title="Top topics" icon={TagIcon}>
          {topics.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <ul className="space-y-4">
              {topics.map(({ t, n: v }) => {
                const Icon = iconFor(t.icon) ?? TagIcon;
                return (
                  <li key={t.value} className="grid grid-cols-[140px_1fr_32px] items-center gap-4" title={`${t.label}: ${v}`}>
                    <span className="flex items-center gap-2 truncate text-sm text-zinc-700">
                      <Icon className="size-[18px] shrink-0 text-zinc-400" weight="duotone" />
                      {t.label}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(v / maxTopic) * 100}%` }} />
                    </span>
                    <span className="text-right text-sm font-medium tabular-nums text-zinc-900">{v}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {field && split ? (
          <Card title={`By ${field.label.toLowerCase()}`} icon={iconFor(field.icon) ?? TagIcon}>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-zinc-100">
              {split.map(({ o, color, n: v }) => (v ? <span key={o.value} title={`${o.label}: ${v}`} className={color} style={{ width: `${(v / n) * 100}%` }} /> : null))}
            </div>
            <ul className="mt-5 space-y-3">
              {split.map(({ o, color, n: v }) => (
                <li key={o.value} className="flex items-center gap-3 text-sm">
                  <span className={clsx("size-2.5 rounded-full", color)} />
                  <span className="flex-1 text-zinc-700">{o.label}</span>
                  <span className="font-medium tabular-nums text-zinc-900">{v}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-zinc-400">{pct(v / n)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}
