import { ChatTeardropTextIcon, RobotIcon, ScrollIcon } from "@phosphor-icons/react/ssr";
import { CopyButton } from "@/components/settings/copy-field";
import { SaveButton } from "@/components/settings/save-button";
import { SyncCard } from "@/components/settings/sync-card";
import { Card, FormField, input } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { syncBlocker } from "@/lib/elevenlabs-api";
import { buildSystemPrompt } from "@/lib/prompt";
import { saveAgent, syncToElevenLabs } from "../actions";

const textarea = `${input} h-auto min-h-24 py-2.5 leading-relaxed`;

export default async function AgentSettings(props: PageProps<"/w/[slug]/settings/agent">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const a = workspace.config.agent;
  const prompt = buildSystemPrompt(workspace);

  return (
    <div className="space-y-6">
      <SyncCard sync={syncToElevenLabs.bind(null, slug)} lastSync={a.lastSync} missing={syncBlocker(workspace)} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <form action={saveAgent.bind(null, slug)} className="space-y-6">
          <Card title="Personality" icon={RobotIcon}>
            <div className="space-y-5">
              <FormField label="About the business" hint="The agent and Jev use this as context.">
                <textarea name="businessContext" defaultValue={a.businessContext} rows={3} className={textarea} />
              </FormField>
              <FormField label="Languages">
                <input name="languages" defaultValue={a.languages} className={input} />
              </FormField>
              <FormField label="Greeting" hint="Sent as the agent's First message when you sync.">
                <input name="greeting" defaultValue={a.greeting} className={input} />
              </FormField>
              <FormField label="Extra rules" hint="One per line.">
                <textarea name="extraRules" defaultValue={a.extraRules} rows={4} placeholder="Never share the office phone number" className={textarea} />
              </FormField>
            </div>
          </Card>
          <div className="flex justify-end">
            <SaveButton />
          </div>
        </form>

        <Card title="System prompt" icon={ScrollIcon} action={<CopyButton value={prompt} />}>
          <p className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
            <ChatTeardropTextIcon className="size-4" weight="duotone" />
            Generated from your settings and knowledge. Sync it, or copy it into ElevenLabs by hand.
          </p>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">{prompt}</pre>
        </Card>
      </div>
    </div>
  );
}
