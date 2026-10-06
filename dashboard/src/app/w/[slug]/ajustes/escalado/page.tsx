import clsx from "clsx";
import { SirenIcon, SlackLogoIcon } from "@phosphor-icons/react/ssr";
import { SaveButton } from "@/components/settings/save-button";
import { Card, FormField, input } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { saveEscalation } from "../actions";

export default async function EscalationSettings(props: PageProps<"/w/[slug]/ajustes/escalado">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const e = workspace.config.escalation;

  return (
    <form action={saveEscalation.bind(null, slug)} className="max-w-2xl space-y-6">
      <Card title="Cuándo pasar a una persona" icon={SirenIcon}>
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-zinc-800">Temas que siempre se escalan</legend>
            <p className="mb-3 text-xs text-zinc-500">Si Jev detecta uno de estos temas, el agente pasa el caso al equipo.</p>
            <div className="flex flex-wrap gap-2">
              {workspace.config.classification.topics.map((t) => {
                const Icon = iconFor(t.icon);
                return (
                  <label key={t.value} className="cursor-pointer">
                    <input type="checkbox" name="alwaysEscalateTopics" value={t.value} defaultChecked={e.alwaysEscalateTopics.includes(t.value)} className="peer sr-only" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition peer-checked:border-rose-200 peer-checked:bg-rose-50 peer-checked:text-rose-700">
                      {Icon ? <Icon className="size-4" weight="duotone" /> : null}
                      {t.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-50 p-4">
            <span>
              <span className="block text-sm font-medium text-zinc-800">Escalar si el cliente está muy molesto</span>
              <span className="block text-xs text-zinc-500">Aunque el tema no esté en la lista</span>
            </span>
            <input type="checkbox" name="escalateWhenVeryUpset" defaultChecked={e.escalateWhenVeryUpset} className="peer sr-only" />
            <span className={clsx("relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition peer-checked:bg-indigo-600", "after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5")} />
          </label>

          <FormField label="Confianza mínima de Jev (%)" hint="Por debajo de este valor el agente pide más contexto en vez de actuar.">
            <div className="w-28">
              <input type="number" name="minConfidence" min={50} max={95} step={5} defaultValue={Math.round(e.minConfidence * 100)} className={input} />
            </div>
          </FormField>

          <FormField label="Tiempo de respuesta que promete el agente">
            <input name="responseTime" defaultValue={e.responseTime} className={input} />
          </FormField>
        </div>
      </Card>

      <Card title="Notificaciones" icon={SlackLogoIcon}>
        <FormField label="Slack incoming webhook" hint="Cada escalación llega a este canal con un enlace a la conversación.">
          <input name="slackWebhookUrl" type="url" defaultValue={e.slackWebhookUrl} placeholder="https://hooks.slack.com/services/…" className={input} />
        </FormField>
      </Card>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
