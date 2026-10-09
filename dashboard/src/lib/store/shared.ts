import { randomBytes } from "node:crypto";
import type { Conversation, DailyPoint } from "../types";

export const newSecret = (prefix: string) => `${prefix}_${randomBytes(24).toString("base64url")}`;

export function emptyConversation(workspaceId: string, id: string): Conversation {
  return {
    id,
    workspaceId,
    customer: { name: "Customer", email: "", language: "—" },
    channel: "voice",
    startedAt: new Date().toISOString(),
    durationSec: 0,
    summary: "",
    messages: [],
    decisions: [],
  };
}

/** Buckets conversations into the last 14 days. */
export function bucketDaily(conversations: Pick<Conversation, "startedAt" | "classification">[]): DailyPoint[] {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { date: d, total: 0, resolved: 0, incident: false };
  });
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const c of conversations) {
    const d = byDate.get(c.startedAt.slice(0, 10));
    if (!d) continue;
    d.total++;
    if (c.classification?.resolved.value === "resolved") d.resolved++;
  }
  return days;
}
