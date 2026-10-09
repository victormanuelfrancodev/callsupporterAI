import { KnowledgeEditor } from "@/components/settings/knowledge-editor";
import { SyncCard } from "@/components/settings/sync-card";
import { requireWorkspace } from "@/lib/auth";
import { syncBlocker } from "@/lib/elevenlabs-api";
import { KNOWLEDGE_SOFT_LIMIT } from "@/lib/prompt";
import { saveKnowledge, syncToElevenLabs } from "../actions";

export default async function KnowledgeSettings(props: PageProps<"/w/[slug]/settings/knowledge">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);

  return (
    <div className="max-w-3xl space-y-6">
      <SyncCard sync={syncToElevenLabs.bind(null, slug)} lastSync={workspace.config.agent.lastSync} missing={syncBlocker(workspace)} />
      <KnowledgeEditor
        initial={workspace.config.knowledge?.items ?? []}
        save={saveKnowledge.bind(null, slug)}
        softLimit={KNOWLEDGE_SOFT_LIMIT}
      />
    </div>
  );
}
