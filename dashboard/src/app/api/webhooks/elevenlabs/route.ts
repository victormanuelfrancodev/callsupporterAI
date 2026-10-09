import type { NextRequest } from "next/server";
import { verifySignature, type PostCallPayload } from "@/lib/elevenlabs";
import { handlePostCall } from "@/lib/post-call";
import { store } from "@/lib/store";

// Shared post-call webhook for agents hosted in the platform's own ElevenLabs
// account: one webhook for every client, routed to the workspace by agent_id.
export async function POST(req: NextRequest) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "ELEVENLABS_WEBHOOK_SECRET is not set" }, { status: 503 });

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("elevenlabs-signature"), secret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }
  const payload = JSON.parse(raw) as PostCallPayload;
  if (payload.type !== "post_call_transcription") return Response.json({ ignored: payload.type });

  if (!payload.data.agent_id) return Response.json({ error: "missing agent_id" }, { status: 400 });
  const ws = await store.getWorkspaceByAgentId(payload.data.agent_id);
  if (!ws) return Response.json({ error: "no workspace for this agent_id" }, { status: 404 });
  return Response.json(await handlePostCall(ws, payload));
}
