import clsx from "clsx";
import { SirenIcon, SlackLogoIcon } from "@phosphor-icons/react/ssr";
import { SaveButton } from "@/components/settings/save-button";
import { Card, FormField, input } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { saveEscalation } from "../actions";

export default async function EscalationSettings(props: PageProps<"/w/[slug]/settings/escalation">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const e = workspace.config.escalation;

  return (
    <form action={saveEscalation.bind(null, slug)} className="max-w-2xl space-y-6">
      <Card title="When to hand off to a person" icon={SirenIcon}>
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-zinc-800">Topics that are always escalated</legend>
            <p className="mb-3 text-xs text-zinc-500">If Jev detects one of these topics, the agent hands the case to the team.</p>
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
              <span className="block text-sm font-medium text-zinc-800">Escalate when the customer is very upset</span>
              <span className="block text-xs text-zinc-500">Even if the topic isn&apos;t in the list</span>
            </span>
            <input type="checkbox" name="escalateWhenVeryUpset" defaultChecked={e.escalateWhenVeryUpset} className="peer sr-only" />
            <span className={clsx("relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition peer-checked:bg-indigo-600", "after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5")} />
          </label>

          <FormField label="Minimum Jev confidence (%)" hint="Below this value the agent asks for more context instead of acting.">
            <div className="w-28">
              <input type="number" name="minConfidence" min={50} max={95} step={5} defaultValue={Math.round(e.minConfidence * 100)} className={input} />
            </div>
          </FormField>

          <FormField label="Response time the agent promises">
            <input name="responseTime" defaultValue={e.responseTime} className={input} />
          </FormField>
        </div>
      </Card>

      <Card title="Notifications" icon={SlackLogoIcon}>
        <FormField label="Slack incoming webhook" hint="Every escalation is posted here with a link to the conversation.">
          <input name="slackWebhookUrl" type="url" defaultValue={e.slackWebhookUrl} placeholder="https://hooks.slack.com/services/…" className={input} />
        </FormField>
      </Card>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
