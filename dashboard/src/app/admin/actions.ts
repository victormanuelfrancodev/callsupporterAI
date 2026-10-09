"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { baseUrl } from "@/lib/base-url";
import { store } from "@/lib/store";
import { TEMPLATES, type TemplateKey } from "@/lib/templates";

export type CreateState = { error?: string };

export async function createClientWorkspace(_: CreateState, form: FormData): Promise<CreateState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const templateKey = String(form.get("template")) as TemplateKey;
  const ownerEmail = String(form.get("ownerEmail") ?? "").trim().toLowerCase();
  const template = TEMPLATES[templateKey];

  if (!name || !slug) return { error: "Add a name and a slug" };
  if (!template) return { error: "Pick a template" };
  if (await store.getWorkspaceBySlug(slug)) return { error: "That slug is already taken" };

  const ws = await store.createWorkspace({
    name,
    slug,
    industry: template.industry,
    color: "brand",
    config: template.build(name),
  });
  if (ownerEmail.includes("@")) {
    await store.inviteMember(ws.id, ownerEmail, "owner", `${await baseUrl()}/auth/callback`);
  }
  redirect(`/w/${ws.slug}/settings/connection`);
}
