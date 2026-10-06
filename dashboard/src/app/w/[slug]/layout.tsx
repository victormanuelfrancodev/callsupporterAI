import { IncidentBanner } from "@/components/incident-banner";
import { Sidebar } from "@/components/sidebar";
import { requireWorkspace } from "@/lib/auth";
import { signOut } from "@/lib/session-actions";
import { getIncidents } from "@/lib/status-feed";
import { demoMode, store } from "@/lib/store";

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[slug]">) {
  const { slug } = await params;
  const { viewer, workspace } = await requireWorkspace(slug);
  const [conversations, workspaces, incidents] = await Promise.all([
    store.listConversations(workspace.id),
    viewer.isAdmin ? store.listWorkspaces() : store.listWorkspacesForUser(viewer.id),
    getIncidents(workspace.config.integrations.statusFeedUrl),
  ]);
  const link = (w: typeof workspace) => ({ slug: w.slug, name: w.name, industry: w.industry, color: w.color });

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar
        current={link(workspace)}
        workspaces={workspaces.map(link)}
        isAdmin={viewer.isAdmin}
        email={viewer.email}
        demo={demoMode}
        signOut={signOut}
        badges={{
          escalations: conversations.filter((c) => c.escalation && c.escalation.status !== "resuelta").length,
          review: conversations.filter((c) => c.classification && c.classification.agentIssue.value !== "ninguno").length,
        }}
      />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {incidents.length > 0 ? (
            <div className="mb-6">
              <IncidentBanner items={incidents} label={workspace.config.integrations.statusFeedLabel} />
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
