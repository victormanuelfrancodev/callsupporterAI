"use client";

import clsx from "clsx";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircleIcon, PlugsConnectedIcon, SpinnerGapIcon, WaveformIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { Card, FormField, btn, input } from "../ui";

type Result = { ok?: boolean; name?: string; error?: string };

function ConnectButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={clsx(btn.primary, "shrink-0")}>
      {pending ? <SpinnerGapIcon className="size-4 animate-spin" /> : <PlugsConnectedIcon className="size-4" weight="duotone" />}
      {pending ? "Connecting" : "Connect"}
    </button>
  );
}

function Status({ state }: { state: Result }) {
  const { pending } = useFormStatus();
  if (pending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <SpinnerGapIcon className="size-5 animate-spin" /> Checking with ElevenLabs…
      </p>
    );
  }
  if (state.error) {
    return (
      <p className="flex items-center gap-2 text-sm text-rose-600">
        <XCircleIcon className="size-5 shrink-0" weight="fill" /> {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircleIcon className="size-5 shrink-0" weight="fill" /> Connected to <span className="font-medium">{state.name}</span>
      </p>
    );
  }
  return <p className="text-sm text-zinc-500">Not connected yet.</p>;
}

export function ElevenLabsConnect({ action, initial, agentId, ownAccount, keyHint }: {
  action: (prev: Result, form: FormData) => Promise<Result>;
  /** Live check done on page load. */
  initial: Result;
  agentId: string;
  ownAccount: boolean;
  keyHint: string;
}) {
  const [state, formAction] = useActionState<Result, FormData>(action, initial);

  return (
    <form action={formAction}>
      <Card title="ElevenLabs agent" icon={WaveformIcon}>
        <div className="space-y-5">
          <FormField label="Agent ID" hint="ElevenLabs → Agents → your agent → Agent ID.">
            <div className="flex gap-2">
              <input name="elevenlabsAgentId" defaultValue={agentId} placeholder="agent_…" className={clsx(input, "font-mono")} />
              <ConnectButton />
            </div>
          </FormField>

          <div className={clsx("rounded-xl px-4 py-3", state.error ? "bg-rose-50" : state.ok ? "bg-emerald-50" : "bg-zinc-50")}>
            <Status state={state} />
          </div>

          <FormField label="Client's own API key" hint={keyHint}>
            <input name="elevenlabsApiKey" type="password" placeholder={ownAccount ? "••••••••" : "sk_…"} className={clsx(input, "font-mono")} />
          </FormField>
          {ownAccount ? (
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="clearApiKey" className="size-4 accent-indigo-600" /> Move this client to my platform account
            </label>
          ) : null}
        </div>
      </Card>
    </form>
  );
}
