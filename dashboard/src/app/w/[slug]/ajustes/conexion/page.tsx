import clsx from "clsx";
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  DatabaseIcon,
  KeyIcon,
  PlugsConnectedIcon,
  WaveformIcon,
  WebhooksLogoIcon,
  WrenchIcon,
} from "@phosphor-icons/react/ssr";
import { CopyButton, CopyField } from "@/components/settings/copy-field";
import { SaveButton } from "@/components/settings/save-button";
import { Card, FormField, btn, input } from "@/components/ui";
import { TOOL_SPECS, toolConfig } from "@/lib/agent-tools";
import { requireWorkspace } from "@/lib/auth";
import { baseUrl } from "@/lib/base-url";
import { jevConfigured } from "@/lib/jev";
import { rotateSecrets, saveConnection } from "../actions";

function Check({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? CheckCircleIcon : CircleDashedIcon;
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icon className={clsx("size-5", ok ? "text-emerald-600" : "text-zinc-300")} weight={ok ? "fill" : "regular"} />
      <span className={ok ? "text-zinc-700" : "text-zinc-500"}>{label}</span>
    </li>
  );
}

export default async function ConnectionSettings(props: PageProps<"/w/[slug]/ajustes/conexion">) {
  const { slug } = await props.params;
  const { workspace: ws } = await requireWorkspace(slug);
  const base = await baseUrl();
  const { integrations, agent, escalation } = ws.config;
  const webhookUrl = `${base}/api/webhooks/elevenlabs/${ws.id}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <form action={saveConnection.bind(null, slug)} className="space-y-6">
          <Card title="Agente de ElevenLabs" icon={WaveformIcon}>
            <FormField label="Agent ID" hint="ElevenLabs → Agents → tu agente → Agent ID. Se usa en «Probar agente».">
              <input name="elevenlabsAgentId" defaultValue={agent.elevenlabsAgentId} placeholder="agent_…" className={clsx(input, "font-mono")} />
            </FormField>
          </Card>

          <Card title="Datos del negocio" icon={DatabaseIcon}>
            <div className="space-y-5">
              <FormField label="API de pedidos" hint='Recibe POST {"query"} y responde {"reference", "status": {"label","tone"}, "fields": {...}}.'>
                <input name="orderLookupUrl" type="url" defaultValue={integrations.orderLookupUrl} placeholder="https://api.tu-cliente.com/support/orders" className={input} />
              </FormField>
              <FormField label="Token de la API de pedidos" hint={integrations.orderLookupToken ? "Guardado. Déjalo vacío para mantenerlo." : "Se envía como Bearer."}>
                <input name="orderLookupToken" type="password" placeholder={integrations.orderLookupToken ? "••••••••" : ""} className={input} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
                <FormField label="Feed de incidencias" hint="JSON con today[] y tomorrow[]. Opcional.">
                  <input name="statusFeedUrl" type="url" defaultValue={integrations.statusFeedUrl} className={input} />
                </FormField>
                <FormField label="Nombre">
                  <input name="statusFeedLabel" defaultValue={integrations.statusFeedLabel} className={input} />
                </FormField>
              </div>
            </div>
          </Card>
          <div className="flex justify-end">
            <SaveButton />
          </div>
        </form>

        <Card title="Webhook post-llamada" icon={WebhooksLogoIcon}>
          <p className="mb-4 text-sm text-zinc-500">
            En ElevenLabs → Settings → Webhooks, crea uno con esta URL y este secreto, y actívalo como <em>post-call transcription</em> en el agente.
          </p>
          <div className="space-y-3">
            <CopyField label="URL" value={webhookUrl} />
            <CopyField label="Secreto HMAC" value={ws.webhookSecret} secret />
          </div>
        </Card>

        <Card title="Tools del agente" icon={WrenchIcon}>
          <p className="mb-4 text-sm text-zinc-500">Añádelas en el agente como <em>Webhook tools</em>. Cada una trae su URL, cabecera y parámetros: copia el JSON.</p>
          <ul className="divide-y divide-zinc-100">
            {TOOL_SPECS.map((spec) => {
              const enabled = spec.enabled(ws);
              return (
                <li key={spec.name} className="flex items-center gap-3 py-3">
                  <span className={clsx("size-2 shrink-0 rounded-full", enabled ? "bg-emerald-500" : "bg-zinc-300")} />
                  <div className="min-w-0 flex-1">
                    <code className="font-mono text-sm text-zinc-900">{spec.name}</code>
                    <p className="text-xs text-zinc-500">{enabled ? spec.summary : `${spec.summary} · configura los datos del negocio`}</p>
                  </div>
                  <CopyButton value={JSON.stringify(toolConfig(base, ws, spec), null, 2)} />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <CopyField label="Cabecera Authorization" value={`Bearer ${ws.toolSecret}`} secret />
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6">
        <Card title="Estado" icon={PlugsConnectedIcon}>
          <ul className="space-y-3">
            <Check ok={Boolean(agent.elevenlabsAgentId)} label="Agent ID de ElevenLabs" />
            <Check ok={jevConfigured()} label="Jev (TYPESAFE_API_KEY)" />
            <Check ok={Boolean(integrations.orderLookupUrl)} label="API de pedidos" />
            <Check ok={Boolean(escalation.slackWebhookUrl)} label="Slack para escalaciones" />
          </ul>
        </Card>
        <Card title="Secretos" icon={KeyIcon}>
          <p className="mb-4 text-sm text-zinc-500">Si se filtraron, rótalos y vuelve a copiar el webhook y las tools en ElevenLabs.</p>
          <form action={rotateSecrets.bind(null, slug)}>
            <button className={clsx(btn.secondary, "w-full")}>
              <ArrowsClockwiseIcon className="size-4" /> Rotar secretos
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
