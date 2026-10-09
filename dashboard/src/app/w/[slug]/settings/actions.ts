"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { TONES } from "@/lib/meta";
import { ICON_NAMES } from "@/lib/icons";
import { checkAgent, syncAgent } from "@/lib/elevenlabs-api";
import { store } from "@/lib/store";
import type { CustomField, KnowledgeItem, Option, Role, Tone, WorkspaceConfig } from "@/lib/types";

type Result = { error?: string };

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const done = (slug: string) => revalidatePath(`/w/${slug}`, "layout");

export async function saveGeneral(slug: string, form: FormData) {
  const { workspace } = await requireOwner(slug);
  const color = str(form, "color") as Tone;
  await store.updateWorkspace(workspace.id, {
    name: str(form, "name") || workspace.name,
    color: TONES.includes(color) ? color : workspace.color,
  });
  done(slug);
}

export async function saveAgent(slug: string, form: FormData) {
  const { workspace } = await requireOwner(slug);
  await store.updateWorkspace(workspace.id, {
    config: {
      agent: {
        ...workspace.config.agent,
        businessContext: str(form, "businessContext"),
        languages: str(form, "languages"),
        greeting: str(form, "greeting"),
        extraRules: str(form, "extraRules"),
      },
    },
  });
  done(slug);
}

function cleanOptions(raw: unknown): Option[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .map((o: Partial<Option>) => {
      const label = String(o.label ?? "").trim().slice(0, 40);
      const value = (String(o.value ?? "").trim() || slugify(label)).slice(0, 40);
      return {
        value,
        label,
        description: String(o.description ?? "").trim().slice(0, 200) || undefined,
        icon: o.icon && ICON_NAMES.includes(o.icon) ? o.icon : undefined,
        tone: TONES.includes(o.tone as Tone) ? (o.tone as Tone) : "neutral",
      };
    })
    .filter((o) => o.label && o.value && !seen.has(o.value) && seen.add(o.value));
}

export async function saveClassification(slug: string, json: string): Promise<{ error?: string }> {
  const { workspace } = await requireOwner(slug);
  const parsed = JSON.parse(json) as WorkspaceConfig["classification"];
  const topics = cleanOptions(parsed.topics);
  if (topics.length < 2) return { error: "You need at least two named topics" };
  const fields: CustomField[] = (Array.isArray(parsed.fields) ? parsed.fields : [])
    .map((f) => ({
      key: (f.key || slugify(f.label)).slice(0, 30),
      label: String(f.label ?? "").trim().slice(0, 30),
      icon: f.icon && ICON_NAMES.includes(f.icon) ? f.icon : undefined,
      options: cleanOptions(f.options),
    }))
    .filter((f) => f.label && f.options.length >= 2);

  await store.updateWorkspace(workspace.id, { config: { classification: { topics, fields } } });
  done(slug);
  return {};
}

export async function saveEscalation(slug: string, form: FormData) {
  const { workspace } = await requireOwner(slug);
  const topics = new Set(workspace.config.classification.topics.map((t) => t.value));
  const min = Number(str(form, "minConfidence"));
  await store.updateWorkspace(workspace.id, {
    config: {
      escalation: {
        slackWebhookUrl: str(form, "slackWebhookUrl"),
        minConfidence: Number.isFinite(min) ? Math.min(0.95, Math.max(0.5, min / 100)) : 0.75,
        alwaysEscalateTopics: form.getAll("alwaysEscalateTopics").map(String).filter((t) => topics.has(t)),
        escalateWhenVeryUpset: form.get("escalateWhenVeryUpset") === "on",
        responseTime: str(form, "responseTime") || "about 30 minutes",
      },
    },
  });
  done(slug);
}

export type ConnectResult = { ok?: boolean; name?: string; error?: string };

/** Saves the agent ID (and optional client API key) only after ElevenLabs confirms the agent exists. */
export async function connectElevenLabs(slug: string, _prev: ConnectResult, form: FormData): Promise<ConnectResult> {
  const { workspace } = await requireOwner(slug);
  const agentId = str(form, "elevenlabsAgentId");
  const apiKey = form.get("clearApiKey") === "on" ? "" : str(form, "elevenlabsApiKey") || workspace.config.agent.elevenlabsApiKey || "";

  if (agentId) {
    const other = await store.getWorkspaceByAgentId(agentId);
    if (other && other.id !== workspace.id) return { error: `That Agent ID is already used by ${other.name}.` };
    const check = await checkAgent(agentId, apiKey || process.env.ELEVENLABS_API_KEY);
    if (!check.ok) return { error: check.error };
    await store.updateWorkspace(workspace.id, {
      config: { agent: { ...workspace.config.agent, elevenlabsAgentId: agentId, elevenlabsApiKey: apiKey } },
    });
    done(slug);
    return { ok: true, name: check.name };
  }

  await store.updateWorkspace(workspace.id, {
    config: { agent: { ...workspace.config.agent, elevenlabsAgentId: "", elevenlabsApiKey: apiKey } },
  });
  done(slug);
  return {};
}

export async function saveConnection(slug: string, form: FormData): Promise<Result> {
  const { workspace } = await requireOwner(slug);
  await store.updateWorkspace(workspace.id, {
    config: {
      integrations: {
        orderLookupUrl: str(form, "orderLookupUrl"),
        orderLookupToken: str(form, "orderLookupToken") || workspace.config.integrations.orderLookupToken,
        statusFeedUrl: str(form, "statusFeedUrl"),
        statusFeedLabel: str(form, "statusFeedLabel") || "Provider incident",
      },
    },
  });
  done(slug);
  return {};
}

export async function rotateSecrets(slug: string) {
  const { workspace } = await requireOwner(slug);
  await store.rotateSecrets(workspace.id);
  done(slug);
}

export async function inviteMember(slug: string, form: FormData) {
  const { workspace } = await requireOwner(slug);
  const email = str(form, "email").toLowerCase();
  if (!email.includes("@")) return;
  const role: Role = str(form, "role") === "owner" ? "owner" : "member";
  const origin = process.env.APP_URL ?? `https://${(await headers()).get("host")}`;
  await store.inviteMember(workspace.id, email, role, `${origin}/auth/callback`);
  done(slug);
}

export async function removeMember(slug: string, userId: string) {
  const { workspace, viewer } = await requireOwner(slug);
  if (userId === viewer.id) return;
  await store.removeMember(workspace.id, userId);
  done(slug);
}

export async function saveKnowledge(slug: string, json: string): Promise<Result> {
  const { workspace } = await requireOwner(slug);
  const raw = JSON.parse(json) as KnowledgeItem[];
  const items = (Array.isArray(raw) ? raw : [])
    .map((k, i) => ({
      id: String(k.id || `k${Date.now()}${i}`).slice(0, 40),
      question: String(k.question ?? "").trim().slice(0, 300),
      answer: String(k.answer ?? "").trim().slice(0, 2000),
    }))
    .filter((k) => k.question && k.answer);
  await store.updateWorkspace(workspace.id, { config: { knowledge: { items } } });
  done(slug);
  return {};
}

/** Pushes the generated prompt + greeting to the ElevenLabs agent and records the result. */
export async function syncToElevenLabs(slug: string): Promise<Result> {
  const { workspace } = await requireOwner(slug);
  const result = await syncAgent(workspace).catch((e: unknown) => ({ error: e instanceof Error ? e.message : "Sync failed" }));
  await store.updateWorkspace(workspace.id, {
    config: { agent: { ...workspace.config.agent, lastSync: { at: new Date().toISOString(), error: result.error } } },
  });
  done(slug);
  return result;
}
