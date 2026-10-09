import "server-only";
import { buildSystemPrompt } from "./prompt";
import type { Workspace } from "./types";

const API = "https://api.elevenlabs.io/v1/convai";

export function elevenlabsKey(ws: Workspace): string | undefined {
  return ws.config.agent.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || undefined;
}

/**
 * Pushes the generated system prompt and greeting to the workspace's agent.
 * Reads the agent first and only replaces those two fields, so the LLM,
 * tools and knowledge base configured in ElevenLabs stay untouched.
 */
export async function syncAgent(ws: Workspace): Promise<{ error?: string }> {
  const key = elevenlabsKey(ws);
  const agentId = ws.config.agent.elevenlabsAgentId;
  if (!agentId) return { error: "Add the Agent ID in Settings → Connection first." };
  if (!key) return { error: "Add an ElevenLabs API key in Settings → Connection first." };

  const headers = { "xi-api-key": key, "Content-Type": "application/json" };
  const current = await fetch(`${API}/agents/${agentId}`, { headers, signal: AbortSignal.timeout(10000) });
  if (current.status === 401) return { error: "ElevenLabs rejected the API key." };
  if (current.status === 404) return { error: "No agent with that ID in this ElevenLabs account." };
  if (!current.ok) return { error: `ElevenLabs error ${current.status}` };

  const agent = (await current.json()) as {
    conversation_config?: { agent?: { prompt?: Record<string, unknown> } };
  };
  const prompt = { ...(agent.conversation_config?.agent?.prompt ?? {}), prompt: buildSystemPrompt(ws) };

  const res = await fetch(`${API}/agents/${agentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: { agent: { first_message: ws.config.agent.greeting, prompt } } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return { error: `ElevenLabs error ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return {};
}

/** Why the workspace can't sync yet, or undefined when it can. */
export function syncBlocker(ws: Workspace): string | undefined {
  if (!ws.config.agent.elevenlabsAgentId) return "Add the Agent ID in Settings → Connection to enable sync.";
  if (!elevenlabsKey(ws)) return "Add an ElevenLabs API key in Settings → Connection to enable sync.";
}

export type AgentCheck = { ok: true; name: string } | { ok: false; error: string };

/** Confirms the agent exists in the ElevenLabs account the key belongs to. */
export async function checkAgent(agentId: string, key: string | undefined): Promise<AgentCheck> {
  if (!key) return { ok: false, error: "No ElevenLabs API key: add one below or set ELEVENLABS_API_KEY." };
  try {
    const res = await fetch(`${API}/agents/${encodeURIComponent(agentId)}`, {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, error: "ElevenLabs rejected the API key." };
    if (res.status === 404 || res.status === 422) return { ok: false, error: "No agent with this ID in that ElevenLabs account." };
    if (!res.ok) return { ok: false, error: `ElevenLabs error ${res.status}` };
    const agent = (await res.json()) as { name?: string };
    return { ok: true, name: agent.name || agentId };
  } catch {
    return { ok: false, error: "Couldn't reach ElevenLabs. Check your connection and try again." };
  }
}
