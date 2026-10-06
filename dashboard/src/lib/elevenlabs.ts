import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Message } from "./types";

const TOLERANCE_SEC = 30 * 60;

/** Verifies the `ElevenLabs-Signature: t=<unix>,v0=<hex hmac-sha256("t.body")>` header. */
export function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || !parts.v0 || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SEC) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v0);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface Turn {
  role: "user" | "agent";
  message: string | null;
  time_in_call_secs: number;
  tool_results?: { tool_name: string; result_value?: string }[] | null;
}

export interface PostCallPayload {
  type: string;
  data: {
    agent_id: string;
    conversation_id: string;
    transcript: Turn[];
    metadata?: { start_time_unix_secs?: number; call_duration_secs?: number; phone_call?: unknown };
    analysis?: { transcript_summary?: string };
    conversation_initiation_client_data?: { dynamic_variables?: Record<string, string | number | boolean | null> };
  };
}

export function transcriptToMessages(p: PostCallPayload["data"]): Message[] {
  const start = (p.metadata?.start_time_unix_secs ?? Date.now() / 1000) * 1000;
  const out: Message[] = [];
  p.transcript.forEach((turn, i) => {
    const at = new Date(start + turn.time_in_call_secs * 1000).toISOString();
    for (const r of turn.tool_results ?? []) {
      out.push({ id: `${i}-t${out.length}`, role: "tool", tool: r.tool_name, text: (r.result_value ?? "").slice(0, 160), at });
    }
    if (turn.message) out.push({ id: `${i}`, role: turn.role, text: turn.message, at });
  });
  return out;
}
