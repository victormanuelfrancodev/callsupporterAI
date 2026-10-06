import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function Home() {
  const viewer = await requireViewer();
  const workspaces = viewer.isAdmin ? await store.listWorkspaces() : await store.listWorkspacesForUser(viewer.id);
  if (workspaces.length === 0) redirect(viewer.isAdmin ? "/admin" : "/login?error=sin-acceso");
  redirect(`/w/${workspaces[0].slug}`);
}
