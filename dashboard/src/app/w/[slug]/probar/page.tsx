import Link from "next/link";
import {
  ArrowRightIcon,
  ChatCenteredDotsIcon,
  LightbulbIcon,
  MicrophoneIcon,
  PhoneCallIcon,
  PlugsConnectedIcon,
  TrayIcon,
} from "@phosphor-icons/react/ssr";
import { AgentWidget } from "@/components/agent-widget";
import { Card, EmptyState, PageHeader, btn } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { iconFor } from "@/lib/icons";

export default async function TryAgentPage(props: PageProps<"/w/[slug]/probar">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const agentId = workspace.config.agent.elevenlabsAgentId;

  return (
    <>
      <PageHeader icon={PhoneCallIcon} title="Probar agente" subtitle="Habla con el agente como si fueras un cliente" />

      {!agentId ? (
        <div className="space-y-4">
          <EmptyState
            icon={PlugsConnectedIcon}
            title="Conecta el agente de ElevenLabs"
            hint="Pega el Agent ID en Ajustes → Conexión y vuelve aquí para llamarlo desde el navegador."
          />
          <div className="flex justify-center">
            <Link href={`/w/${slug}/ajustes/conexion`} className={btn.primary}>
              Ir a Conexión <ArrowRightIcon className="size-4" weight="bold" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card title="Cliente de prueba" icon={MicrophoneIcon}>
            <p className="mb-4 text-sm text-zinc-500">
              Pulsa el botón flotante de abajo a la derecha y permite el micrófono. Al colgar, la conversación aparece en el Inbox ya clasificada.
            </p>
            <AgentWidget agentId={agentId} />
            <Link href={`/w/${slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              <TrayIcon className="size-4" weight="duotone" /> Ver en el Inbox
            </Link>
          </Card>

          <Card title="Qué probar" icon={LightbulbIcon}>
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
            <p className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">Prueba también a enfadarte: el agente debería escalar.</p>
          </Card>
        </div>
      )}
    </>
  );
}
