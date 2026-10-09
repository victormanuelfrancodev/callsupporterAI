import "server-only";
import { transcriptToMessages, type PostCallPayload } from "./elevenlabs";
import { classifyConversation, jevConfigured } from "./jev";
import { store } from "./store";
import type { Workspace } from "./types";

/** Stores an ElevenLabs post-call transcript and classifies it with Jev. */
export async function handlePostCall(ws: Workspace, payload: PostCallPayload) {
  const d = payload.data;
  const vars = d.conversation_initiation_client_data?.dynamic_variables ?? {};
  const messages = transcriptToMessages(d);
  const existing = await store.getConversation(ws.id, d.conversation_id);

  const classification = jevConfigured()
    ? await classifyConversation(ws, messages).catch((e) => {
        console.error("[jev classify]", e);
        return undefined;
      })
    : undefined;

  await store.upsertConversation(ws.id, d.conversation_id, {
    customer: {
      name: String(vars.customer_name ?? existing?.customer.name ?? "Customer"),
      email: String(vars.customer_email ?? existing?.customer.email ?? ""),
      language: String(vars.language ?? "—").toUpperCase(),
    },
    channel: d.metadata?.phone_call || vars.channel !== "chat" ? "voice" : "chat",
    startedAt: new Date((d.metadata?.start_time_unix_secs ?? Date.now() / 1000) * 1000).toISOString(),
    durationSec: Math.round(d.metadata?.call_duration_secs ?? 0),
    summary: d.analysis?.transcript_summary ?? "",
    messages,
    ...(classification ? { classification } : {}),
  });

  return { ok: true, classified: Boolean(classification) };
}
