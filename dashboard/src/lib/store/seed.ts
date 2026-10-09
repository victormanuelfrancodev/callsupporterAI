import { TEMPLATES } from "../templates";
import type { Conversation, DailyPoint, Member, Workspace } from "../types";

// Initial state for demo mode (no Supabase): one real workspace, no sample data.

export const DEMO_USER = { id: "demo-user", email: "demo@callsupporter.ai" };

export function seed() {
  const t = TEMPLATES.esim;
  const jj: Workspace = {
    id: "ws_journey_japan",
    slug: "journey-japan",
    name: "Journey Japan",
    industry: t.industry,
    color: "brand",
    createdAt: new Date().toISOString(),
    config: t.build("Journey Japan"),
    // Stable in demo mode so the tools configured in ElevenLabs keep working across restarts.
    toolSecret: "tool_demo_journey-japan",
    webhookSecret: "whsec_demo_journey-japan",
  };
  jj.config.integrations.statusFeedUrl = "https://n8n.francodev.fit/webhook/iijmio-mantenimiento?format=json";
  // Journey Japan's knowledge lives in the ElevenLabs knowledge base (knowledge/journey-japan-kb.md).
  jj.config.knowledge = { items: [] };
  jj.config.agent.businessContext =
    "Journey Japan eSIM (JJ eSIM) sells prepaid, data-only travel eSIMs for visitors to Japan: the 10GB, 20GB and 50GB Data plans and True Unlimited 5G. You handle voice support calls.";
  jj.config.agent.greeting =
    "[warmly] Hello there! Welcome to Journey Japan. My name is Hana, and I'm here to help you with your eSIM today. How can I assist you?";

  const owner: Member = { userId: DEMO_USER.id, email: DEMO_USER.email, role: "owner", invitedAt: new Date().toISOString() };

  return {
    workspaces: [jj],
    members: new Map<string, Member[]>([[jj.id, [owner]]]),
    conversations: [] as Conversation[],
    daily: new Map<string, DailyPoint[]>(),
  };
}
