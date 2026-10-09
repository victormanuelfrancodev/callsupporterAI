import type { NextRequest } from "next/server";
import { verifySignature, type PostCallPayload } from "@/lib/elevenlabs";
import { handlePostCall } from "@/lib/post-call";
import { store } from "@/lib/store";

// Post-call webhook for a client that uses its own ElevenLabs account
// (one webhook per account, signed with the workspace's secret).
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
  return Response.json(await handlePostCall(ws, payload));
}
