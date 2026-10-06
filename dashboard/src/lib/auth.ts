import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { demoMode, store } from "./store";
import { DEMO_USER } from "./store/seed";
import { sessionClient } from "./supabase/server";
import type { Role, Workspace } from "./types";

export interface Viewer {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function getViewer(): Promise<Viewer | null> {
  await connection();
  if (demoMode) return { ...DEMO_USER, isAdmin: true };
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "", isAdmin: await store.isPlatformAdmin(data.user.id) };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) notFound();
  return viewer;
}

export interface WorkspaceAccess {
  viewer: Viewer;
  workspace: Workspace;
  role: Role;
}

/** Resolves the workspace and checks the viewer belongs to it (platform admins see all). */
export async function requireWorkspace(slug: string): Promise<WorkspaceAccess> {
  const viewer = await requireViewer();
  const workspace = await store.getWorkspaceBySlug(slug);
  if (!workspace) notFound();
  const role = viewer.isAdmin ? "owner" : await store.memberRole(workspace.id, viewer.id);
  if (!role) notFound();
  return { viewer, workspace, role };
}

export async function requireOwner(slug: string): Promise<WorkspaceAccess> {
  const access = await requireWorkspace(slug);
  if (access.role !== "owner") throw new Error("Solo los administradores del workspace pueden cambiar esto");
  return access;
}
