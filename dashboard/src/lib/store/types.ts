import type { Conversation, DailyPoint, Member, Role, Workspace, WorkspaceConfig } from "../types";

export interface NewWorkspace {
  slug: string;
  name: string;
  industry: string;
  color: Workspace["color"];
  config: WorkspaceConfig;
}

export interface WorkspacePatch {
  name?: string;
  color?: Workspace["color"];
  config?: Partial<WorkspaceConfig>;
}

export interface Store {
  isPlatformAdmin(userId: string): Promise<boolean>;

  listWorkspaces(): Promise<Workspace[]>;
  listWorkspacesForUser(userId: string): Promise<Workspace[]>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  getWorkspaceById(id: string): Promise<Workspace | undefined>;
  getWorkspaceByAgentId(agentId: string): Promise<Workspace | undefined>;
  createWorkspace(input: NewWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, patch: WorkspacePatch): Promise<Workspace>;
  rotateSecrets(id: string): Promise<Workspace>;

  memberRole(workspaceId: string, userId: string): Promise<Role | undefined>;
  listMembers(workspaceId: string): Promise<Member[]>;
  /** Invites by email (sends the Supabase invite in production). */
  inviteMember(workspaceId: string, email: string, role: Role, redirectTo: string): Promise<void>;
  removeMember(workspaceId: string, userId: string): Promise<void>;

  listConversations(workspaceId: string): Promise<Conversation[]>;
  getConversation(workspaceId: string, id: string): Promise<Conversation | undefined>;
  /** Shallow-merges into an existing conversation or creates it. */
  upsertConversation(workspaceId: string, id: string, patch: Partial<Conversation>): Promise<Conversation>;
  dailyVolume(workspaceId: string): Promise<DailyPoint[]>;
}
