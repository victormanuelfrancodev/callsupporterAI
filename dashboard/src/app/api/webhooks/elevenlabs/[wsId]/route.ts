import type { NextRequest } from "next/server";
import { verifySignature, transcriptToMessages, type PostCallPayload } from "@/lib/elevenlabs";
import { classifyConversation, jevConfigured } from "@/lib/jev";
import { store } from "@/lib/store";

// ElevenLabs post-call webhook: store the transcript and classify it with Jev.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/webhooks/elevenlabs/[wsId]">) {
  const { wsId } = await ctx.params;
  const ws = await store.getWorkspaceById(wsId);
  if (!ws) return Response.json({ error: "not found" }, { status: 404 });

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("elevenlabs-signature"), ws.webhookSecret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(raw) as PostCallPayload;
  if (payload.type !== "post_call_transcription") return Response.json({ ignored: payload.type });

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
      name: String(vars.customer_name ?? existing?.customer.name ?? "Cliente"),
      email: String(vars.customer_email ?? existing?.customer.email ?? ""),
      language: String(vars.language ?? "—").toUpperCase(),
    },
    channel: d.metadata?.phone_call || vars.channel !== "chat" ? "voz" : "chat",
    startedAt: new Date((d.metadata?.start_time_unix_secs ?? Date.now() / 1000) * 1000).toISOString(),
    durationSec: Math.round(d.metadata?.call_duration_secs ?? 0),
    summary: d.analysis?.transcript_summary ?? "",
    messages,
    ...(classification ? { classification } : {}),
  });

  return Response.json({ ok: true, classified: Boolean(classification) });
}
