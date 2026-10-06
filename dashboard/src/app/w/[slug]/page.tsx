import { TrayIcon } from "@phosphor-icons/react/ssr";
import { InboxList } from "@/components/inbox-list";
import { PageHeader } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function InboxPage(props: PageProps<"/w/[slug]">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  const conversations = await store.listConversations(workspace.id);
  const open = conversations.filter((c) => c.classification?.resolved.value !== "si").length;

  return (
    <>
      <PageHeader icon={TrayIcon} title="Inbox" subtitle={`${conversations.length} conversaciones · ${open} abiertas o escaladas`} />
      <InboxList
        slug={slug}
        conversations={conversations}
        topics={workspace.config.classification.topics}
        fields={workspace.config.classification.fields}
      />
    </>
  );
}
