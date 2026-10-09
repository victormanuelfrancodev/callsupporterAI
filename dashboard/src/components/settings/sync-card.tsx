"use client";

import clsx from "clsx";
import { useState, useTransition } from "react";
import { ArrowsClockwiseIcon, CheckCircleIcon, CloudArrowUpIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { timeAgo } from "@/lib/format";
import { Card, btn } from "../ui";

export function SyncCard({ sync, lastSync, missing }: {
  sync: () => Promise<{ error?: string }>;
  lastSync?: { at: string; error?: string };
  /** Why sync can't run yet (no agent id / no key), if any. */
  missing?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; at?: string } | null>(null);
  const shown = result ?? lastSync;

  return (
    <Card title="ElevenLabs agent" icon={CloudArrowUpIcon}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 text-sm">
          {missing ? (
            <p className="text-zinc-500">{missing}</p>
          ) : shown?.error ? (
            <p className="flex items-center gap-2 text-rose-600">
              <WarningCircleIcon className="size-5 shrink-0" weight="duotone" /> {shown.error}
            </p>
          ) : shown?.at ? (
            <p className="flex items-center gap-2 text-zinc-600">
              <CheckCircleIcon className="size-5 shrink-0 text-emerald-600" weight="fill" /> Prompt, greeting and knowledge synced {timeAgo(shown.at)}
            </p>
          ) : (
            <p className="text-zinc-500">Push the prompt, greeting and knowledge to the agent. Sync again after every change.</p>
          )}
        </div>
        <button
          type="button"
          disabled={pending || Boolean(missing)}
          onClick={() =>
            start(async () => {
              const r = await sync();
              setResult({ ...r, at: new Date().toISOString() });
            })
          }
          className={clsx(btn.primary)}
        >
          {pending ? <SpinnerGapIcon className="size-4 animate-spin" /> : <ArrowsClockwiseIcon className="size-4" weight="bold" />}
          Sync to ElevenLabs
        </button>
      </div>
    </Card>
  );
}
