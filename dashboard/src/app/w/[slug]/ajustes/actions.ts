"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { TONES } from "@/lib/meta";
import { ICON_NAMES } from "@/lib/icons";
import { store } from "@/lib/store";
import type { CustomField, Option, Role, Tone, WorkspaceConfig } from "@/lib/types";

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
  if (topics.length < 2) return { error: "Necesitas al menos dos temas con nombre" };
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
        responseTime: str(form, "responseTime") || "unos 30 minutos",
      },
    },
  });
  done(slug);
}

export async function saveConnection(slug: string, form: FormData) {
  const { workspace } = await requireOwner(slug);
  await store.updateWorkspace(workspace.id, {
    config: {
      agent: { ...workspace.config.agent, elevenlabsAgentId: str(form, "elevenlabsAgentId") },
      integrations: {
        orderLookupUrl: str(form, "orderLookupUrl"),
        orderLookupToken: str(form, "orderLookupToken") || workspace.config.integrations.orderLookupToken,
        statusFeedUrl: str(form, "statusFeedUrl"),
        statusFeedLabel: str(form, "statusFeedLabel") || "Incidencia del proveedor",
      },
    },
  });
  done(slug);
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
