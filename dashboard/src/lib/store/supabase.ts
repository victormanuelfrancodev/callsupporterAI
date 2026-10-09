import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Member, Workspace } from "../types";
import { bucketDaily, emptyConversation, newSecret } from "./shared";
import type { Store } from "./types";

interface WorkspaceRow {
  id: string;
  slug: string;
  name: string;
  industry: string;
  color: Workspace["color"];
  created_at: string;
  config: Workspace["config"];
  tool_secret: string;
  webhook_secret: string;
}

interface ConversationRow {
  id: string;
  workspace_id: string;
  customer: Conversation["customer"];
  channel: Conversation["channel"];
  started_at: string;
  duration_sec: number;
  summary: string;
  messages: Conversation["messages"];
  record: Conversation["record"] | null;
  decisions: Conversation["decisions"];
  classification: Conversation["classification"] | null;
  escalation: Conversation["escalation"] | null;
}

const toWorkspace = (r: WorkspaceRow): Workspace => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  industry: r.industry,
  color: r.color,
  createdAt: r.created_at,
  config: r.config,
  toolSecret: r.tool_secret,
  webhookSecret: r.webhook_secret,
});

const toConversation = (r: ConversationRow): Conversation => ({
  id: r.id,
  workspaceId: r.workspace_id,
  customer: r.customer,
  channel: r.channel,
  startedAt: r.started_at,
  durationSec: r.duration_sec,
  summary: r.summary,
  messages: r.messages ?? [],
  record: r.record ?? undefined,
  decisions: r.decisions ?? [],
  classification: r.classification ?? undefined,
  escalation: r.escalation ?? undefined,
});

const fromConversation = (c: Conversation): ConversationRow => ({
  id: c.id,
  workspace_id: c.workspaceId,
  customer: c.customer,
  channel: c.channel,
  started_at: c.startedAt,
  duration_sec: c.durationSec,
  summary: c.summary,
  messages: c.messages,
  record: c.record ?? null,
  decisions: c.decisions,
  classification: c.classification ?? null,
  escalation: c.escalation ?? null,
});

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function findUserIdByEmail(db: SupabaseClient, email: string): Promise<string | undefined> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return undefined;
  }
}

/** Service-role store. Callers must authorize the viewer first (see lib/auth). */
export function supabaseStore(db: SupabaseClient): Store {
  const store: Store = {
    async isPlatformAdmin(userId) {
      const data = must(await db.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle());
      return Boolean(data);
    },

    async listWorkspaces() {
      return must<WorkspaceRow[]>(await db.from("workspaces").select("*").order("name")).map(toWorkspace);
    },
    async listWorkspacesForUser(userId) {
      const ids = must<{ workspace_id: string }[]>(
        await db.from("workspace_members").select("workspace_id").eq("user_id", userId),
      ).map((r) => r.workspace_id);
      if (ids.length === 0) return [];
      return must<WorkspaceRow[]>(await db.from("workspaces").select("*").in("id", ids).order("name")).map(toWorkspace);
    },
    async getWorkspaceBySlug(slug) {
      const r = must<WorkspaceRow | null>(await db.from("workspaces").select("*").eq("slug", slug).maybeSingle());
      return r ? toWorkspace(r) : undefined;
    },
    async getWorkspaceById(id) {
      const r = must<WorkspaceRow | null>(await db.from("workspaces").select("*").eq("id", id).maybeSingle());
      return r ? toWorkspace(r) : undefined;
    },
    async getWorkspaceByAgentId(agentId) {
      const r = must<WorkspaceRow | null>(
        await db.from("workspaces").select("*").eq("config->agent->>elevenlabsAgentId", agentId).maybeSingle(),
      );
      return r ? toWorkspace(r) : undefined;
    },
    async createWorkspace(input) {
      const r = must<WorkspaceRow>(
        await db
          .from("workspaces")
          .insert({ ...input, tool_secret: newSecret("tool"), webhook_secret: newSecret("whsec") })
          .select("*")
          .single(),
      );
      return toWorkspace(r);
    },
    async updateWorkspace(id, patch) {
      const current = await store.getWorkspaceById(id);
      if (!current) throw new Error("Workspace not found");
      const r = must<WorkspaceRow>(
        await db
          .from("workspaces")
          .update({
            name: patch.name ?? current.name,
            color: patch.color ?? current.color,
            config: { ...current.config, ...patch.config },
          })
          .eq("id", id)
          .select("*")
          .single(),
      );
      return toWorkspace(r);
    },
    async rotateSecrets(id) {
      const r = must<WorkspaceRow>(
        await db
          .from("workspaces")
          .update({ tool_secret: newSecret("tool"), webhook_secret: newSecret("whsec") })
          .eq("id", id)
          .select("*")
          .single(),
      );
      return toWorkspace(r);
    },

    async memberRole(workspaceId, userId) {
      const r = must<{ role: Member["role"] } | null>(
        await db.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle(),
      );
      return r?.role;
    },
    async listMembers(workspaceId) {
      const rows = must<{ user_id: string; email: string; role: Member["role"]; invited_at: string }[]>(
        await db.from("workspace_members").select("*").eq("workspace_id", workspaceId).order("invited_at"),
      );
      return rows.map((r) => ({ userId: r.user_id, email: r.email, role: r.role, invitedAt: r.invited_at }));
    },
    async inviteMember(workspaceId, email, role, redirectTo) {
      let userId: string | undefined;
      const invite = await db.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (invite.data.user) userId = invite.data.user.id;
      else userId = await findUserIdByEmail(db, email);
      if (!userId) throw new Error(invite.error?.message ?? "Could not send the invite");
      must(
        await db
          .from("workspace_members")
          .upsert({ workspace_id: workspaceId, user_id: userId, email, role }, { onConflict: "workspace_id,user_id" }),
      );
    },
    async removeMember(workspaceId, userId) {
      must(await db.from("workspace_members").delete().eq("workspace_id", workspaceId).eq("user_id", userId));
    },

    async listConversations(workspaceId) {
      return must<ConversationRow[]>(
        await db.from("conversations").select("*").eq("workspace_id", workspaceId).order("started_at", { ascending: false }).limit(500),
      ).map(toConversation);
    },
    async getConversation(workspaceId, id) {
      const r = must<ConversationRow | null>(
        await db.from("conversations").select("*").eq("workspace_id", workspaceId).eq("id", id).maybeSingle(),
      );
      return r ? toConversation(r) : undefined;
    },
    async upsertConversation(workspaceId, id, patch) {
      const current = (await store.getConversation(workspaceId, id)) ?? emptyConversation(workspaceId, id);
      const next: Conversation = { ...current, ...patch, workspaceId, id };
      must(await db.from("conversations").upsert(fromConversation(next), { onConflict: "workspace_id,id" }));
      return next;
    },
    async dailyVolume(workspaceId) {
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const rows = must<Pick<ConversationRow, "started_at" | "classification">[]>(
        await db.from("conversations").select("started_at, classification").eq("workspace_id", workspaceId).gte("started_at", since),
      );
      return bucketDaily(rows.map((r) => ({ startedAt: r.started_at, classification: r.classification ?? undefined })));
    },
  };
  return store;
}
