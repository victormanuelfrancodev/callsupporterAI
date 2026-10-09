import clsx from "clsx";
import {
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  DatabaseIcon,
  KeyIcon,
  PlugsConnectedIcon,
  WebhooksLogoIcon,
  WrenchIcon,
} from "@phosphor-icons/react/ssr";
import { ActionForm } from "@/components/settings/action-form";
import { ElevenLabsConnect } from "@/components/settings/elevenlabs-connect";
import { CopyButton, CopyField } from "@/components/settings/copy-field";
import { SaveButton } from "@/components/settings/save-button";
import { Card, FormField, btn, input } from "@/components/ui";
import { TOOL_SPECS, toolConfig } from "@/lib/agent-tools";
import { requireWorkspace } from "@/lib/auth";
import { baseUrl } from "@/lib/base-url";
import { checkAgent, elevenlabsKey } from "@/lib/elevenlabs-api";
import { jevConfigured } from "@/lib/jev";
import { connectElevenLabs, rotateSecrets, saveConnection } from "../actions";

function Check({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? CheckCircleIcon : CircleDashedIcon;
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icon className={clsx("size-5", ok ? "text-emerald-600" : "text-zinc-300")} weight={ok ? "fill" : "regular"} />
      <span className={ok ? "text-zinc-700" : "text-zinc-500"}>{label}</span>
    </li>
  );
}

export default async function ConnectionSettings(props: PageProps<"/w/[slug]/settings/connection">) {
  const { slug } = await props.params;
  const { workspace: ws } = await requireWorkspace(slug);
  const base = await baseUrl();
  const { integrations, agent, escalation } = ws.config;
  const ownAccount = Boolean(agent.elevenlabsApiKey);
  const platformKey = Boolean(process.env.ELEVENLABS_API_KEY);
  const agentCheck = agent.elevenlabsAgentId ? await checkAgent(agent.elevenlabsAgentId, elevenlabsKey(ws)) : {};

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <ElevenLabsConnect
          action={connectElevenLabs.bind(null, slug)}
          initial={agentCheck}
          agentId={agent.elevenlabsAgentId}
          ownAccount={ownAccount}
          keyHint={
            ownAccount
              ? "This client uses its own ElevenLabs account. Leave empty to keep the key."
              : platformKey
                ? "Empty: the agent lives in your platform account. Paste a key only if the client has its own account."
                : "Needed to connect. Or set ELEVENLABS_API_KEY to use your own account for every client."
          }
        />

        <ActionForm action={saveConnection.bind(null, slug)} className="space-y-6">
          <Card title="Business data" icon={DatabaseIcon}>
            <div className="space-y-5">
              <FormField label="Orders API" hint='Receives POST {"query"} and returns {"reference", "status": {"label","tone"}, "fields": {...}}.'>
                <input name="orderLookupUrl" type="url" defaultValue={integrations.orderLookupUrl} placeholder="https://api.your-client.com/support/orders" className={input} />
              </FormField>
              <FormField label="Orders API token" hint={integrations.orderLookupToken ? "Saved. Leave empty to keep it." : "Sent as a Bearer token."}>
                <input name="orderLookupToken" type="password" placeholder={integrations.orderLookupToken ? "••••••••" : ""} className={input} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
                <FormField label="Incident feed" hint="JSON with today[] and tomorrow[]. Optional.">
                  <input name="statusFeedUrl" type="url" defaultValue={integrations.statusFeedUrl} className={input} />
                </FormField>
                <FormField label="Label">
                  <input name="statusFeedLabel" defaultValue={integrations.statusFeedLabel} className={input} />
                </FormField>
              </div>
            </div>
          </Card>
          <div className="flex justify-end">
            <SaveButton />
          </div>
        </ActionForm>

        <Card title="Post-call webhook" icon={WebhooksLogoIcon}>
          {ownAccount ? (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                In the client&apos;s ElevenLabs → Settings → Webhooks, create one with this URL and secret and enable <em>post-call transcription</em>.
              </p>
              <div className="space-y-3">
                <CopyField label="URL" value={`${base}/api/webhooks/elevenlabs/${ws.id}`} />
                <CopyField label="HMAC secret" value={ws.webhookSecret} secret />
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                Agents in your platform account share one webhook, set up once in your ElevenLabs → Settings → Webhooks with the secret in
                <code className="mx-1 font-mono text-xs">ELEVENLABS_WEBHOOK_SECRET</code>. Each call is routed to this client by its Agent ID.
              </p>
              <CopyField label="Shared URL" value={`${base}/api/webhooks/elevenlabs`} />
            </>
          )}
        </Card>

        <Card title="Agent tools" icon={WrenchIcon}>
          <p className="mb-4 text-sm text-zinc-500">Add them to the agent as <em>Webhook tools</em>. Each JSON includes its URL, header and parameters. Open a tool to see it.</p>
          <ul className="divide-y divide-zinc-100">
            {TOOL_SPECS.map((spec) => {
              const enabled = spec.enabled(ws);
              const json = JSON.stringify(toolConfig(base, ws, spec), null, 2);
              return (
                <li key={spec.name} className="flex items-start gap-3 py-3">
                  <details className="group min-w-0 flex-1">
                    <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                      <span className={clsx("size-2 shrink-0 rounded-full", enabled ? "bg-emerald-500" : "bg-zinc-300")} />
                      <span className="min-w-0 flex-1">
                        <code className="font-mono text-sm text-zinc-900">{spec.name}</code>
                        <span className="block text-xs text-zinc-500">{enabled ? spec.summary : `${spec.summary} · set up business data first`}</span>
                      </span>
                      <CaretDownIcon className="size-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <pre className="mt-3 max-h-80 select-all overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">{json}</pre>
                  </details>
                  <CopyButton value={json} />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <CopyField label="Authorization header" value={`Bearer ${ws.toolSecret}`} secret />
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6">
        <Card title="Status" icon={PlugsConnectedIcon}>
          <ul className="space-y-3">
            <Check ok={"ok" in agentCheck && agentCheck.ok === true} label="ElevenLabs agent connected" />
            <Check ok={ownAccount || platformKey} label={ownAccount ? "Client's ElevenLabs key" : "Platform ElevenLabs key"} />
            <Check ok={jevConfigured()} label="Jev (TYPESAFE_API_KEY)" />
            <Check ok={Boolean(integrations.orderLookupUrl)} label="Orders API" />
            <Check ok={Boolean(escalation.slackWebhookUrl)} label="Slack for escalations" />
          </ul>
        </Card>
        <Card title="Secrets" icon={KeyIcon}>
          <p className="mb-4 text-sm text-zinc-500">If they leaked, rotate them and re-copy the webhook and tools into ElevenLabs.</p>
          <form action={rotateSecrets.bind(null, slug)}>
            <button className={clsx(btn.secondary, "w-full")}>
              <ArrowsClockwiseIcon className="size-4" /> Rotate secrets
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
