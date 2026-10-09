import Link from "next/link";
import {
  ArrowRightIcon,
  ChatCenteredDotsIcon,
  LightbulbIcon,
  MicrophoneIcon,
  PhoneCallIcon,
  PlugsConnectedIcon,
} from "@phosphor-icons/react/ssr";
import { AgentCall } from "@/components/agent-call";
import { Card, EmptyState, PageHeader, btn } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { iconFor } from "@/lib/icons";

export default async function TryAgentPage(props: PageProps<"/w/[slug]/test">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const agentId = workspace.config.agent.elevenlabsAgentId;

  return (
    <>
      <PageHeader icon={PhoneCallIcon} title="Test agent" subtitle="Talk to the agent as if you were a customer" />

      {!agentId ? (
        <div className="space-y-4">
          <EmptyState
            icon={PlugsConnectedIcon}
            title="Connect the ElevenLabs agent"
            hint="Paste the Agent ID in Settings → Connection, then come back to call it from your browser."
          />
          <div className="flex justify-center">
            <Link href={`/w/${slug}/settings/connection`} className={btn.primary}>
              Go to Connection <ArrowRightIcon className="size-4" weight="bold" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card title="Test call" icon={MicrophoneIcon}>
            <AgentCall agentId={agentId} inboxHref={`/w/${slug}`} />
          </Card>

          <Card title="What to try" icon={LightbulbIcon}>
            <ul className="space-y-3">
              {workspace.config.classification.topics.slice(0, 5).map((t) => {
                const Icon = iconFor(t.icon) ?? ChatCenteredDotsIcon;
                return (
                  <li key={t.value} className="flex items-start gap-3 text-sm">
                    <Icon className="mt-0.5 size-[18px] shrink-0 text-zinc-400" weight="duotone" />
                    <span>
                      <span className="font-medium text-zinc-800">{t.label}</span>
                      {t.description ? <span className="block text-xs text-zinc-500">{t.description}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">Try getting angry too: the agent should escalate.</p>
          </Card>
        </div>
      )}
    </>
  );
}
