"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { store } from "@/lib/store";
import type { EscalationStatus } from "@/lib/types";

export async function setEscalationStatus(slug: string, conversationId: string, status: EscalationStatus) {
  const { workspace, viewer } = await requireWorkspace(slug);
  const c = await store.getConversation(workspace.id, conversationId);
  if (!c?.escalation) return;
  await store.upsertConversation(workspace.id, conversationId, {
    escalation: { ...c.escalation, status, assignee: c.escalation.assignee ?? viewer.email.split("@")[0] },
  });
  revalidatePath(`/w/${slug}`, "layout");
}
