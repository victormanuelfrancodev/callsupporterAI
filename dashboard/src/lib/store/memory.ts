import { randomUUID } from "node:crypto";
import type { Conversation, Workspace } from "../types";
import { DEMO_USER, seed } from "./seed";
import { bucketDaily, emptyConversation, newSecret } from "./shared";
import type { Store } from "./types";

// In-memory store for demo mode. Lives on globalThis so dev hot-reloads keep
// edits; everything resets when the server restarts.
type State = ReturnType<typeof seed>;
const g = globalThis as unknown as { __csStore?: State };
const state = (): State => (g.__csStore ??= seed());

function ws(id: string): Workspace {
  const w = state().workspaces.find((x) => x.id === id);
  if (!w) throw new Error(`Workspace ${id} not found`);
  return w;
}

export const memoryStore: Store = {
  async isPlatformAdmin(userId) {
    return userId === DEMO_USER.id;
  },

  async listWorkspaces() {
    return state().workspaces;
  },
  async listWorkspacesForUser(userId) {
    const s = state();
    return s.workspaces.filter((w) => s.members.get(w.id)?.some((m) => m.userId === userId));
  },
  async getWorkspaceBySlug(slug) {
    return state().workspaces.find((w) => w.slug === slug);
  },
  async getWorkspaceById(id) {
    return state().workspaces.find((w) => w.id === id);
  },
  async getWorkspaceByAgentId(agentId) {
    return state().workspaces.find((w) => w.config.agent.elevenlabsAgentId === agentId);
  },
  async createWorkspace(input) {
    const s = state();
    if (s.workspaces.some((w) => w.slug === input.slug)) throw new Error("That slug already exists");
    const w: Workspace = {
      ...input,
      id: `ws_${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      toolSecret: newSecret("tool"),
      webhookSecret: newSecret("whsec"),
    };
    s.workspaces.push(w);
    s.members.set(w.id, []);
    return w;
  },
  async updateWorkspace(id, patch) {
    const w = ws(id);
    if (patch.name !== undefined) w.name = patch.name;
    if (patch.color !== undefined) w.color = patch.color;
    if (patch.config) w.config = { ...w.config, ...patch.config };
    return w;
  },
  async rotateSecrets(id) {
    const w = ws(id);
    w.toolSecret = newSecret("tool");
    w.webhookSecret = newSecret("whsec");
    return w;
  },

  async memberRole(workspaceId, userId) {
    return state().members.get(workspaceId)?.find((m) => m.userId === userId)?.role;
  },
  async listMembers(workspaceId) {
    return state().members.get(workspaceId) ?? [];
  },
  async inviteMember(workspaceId, email, role) {
    const list = state().members.get(workspaceId) ?? [];
    if (list.some((m) => m.email === email)) return;
    list.push({ userId: `u_${randomUUID().slice(0, 8)}`, email, role, invitedAt: new Date().toISOString() });
    state().members.set(workspaceId, list);
  },
  async removeMember(workspaceId, userId) {
    const s = state();
    s.members.set(workspaceId, (s.members.get(workspaceId) ?? []).filter((m) => m.userId !== userId));
  },

  async listConversations(workspaceId) {
    return state()
      .conversations.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },
  async getConversation(workspaceId, id) {
    return state().conversations.find((c) => c.workspaceId === workspaceId && c.id === id);
  },
  async upsertConversation(workspaceId, id, patch) {
    const s = state();
    const i = s.conversations.findIndex((c) => c.workspaceId === workspaceId && c.id === id);
    const next: Conversation = { ...(i >= 0 ? s.conversations[i] : emptyConversation(workspaceId, id)), ...patch, workspaceId, id };
    if (i >= 0) s.conversations[i] = next;
    else s.conversations.push(next);
    return next;
  },
  async dailyVolume(workspaceId) {
    const seeded = state().daily.get(workspaceId);
    if (seeded) return seeded;
    return bucketDaily(await this.listConversations(workspaceId));
  },
};
