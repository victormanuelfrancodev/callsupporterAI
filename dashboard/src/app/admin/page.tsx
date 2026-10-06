import Link from "next/link";
import { BuildingsIcon, CaretRightIcon, ChatsCircleIcon, HeadsetIcon, PlusCircleIcon, SirenIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { WorkspaceMark } from "@/components/sidebar";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { store } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import { NewClientForm } from "./new-client-form";

export default async function AdminPage() {
  await requireAdmin();
  const workspaces = await store.listWorkspaces();
  const rows = await Promise.all(
    workspaces.map(async (w) => {
      const [conversations, members] = await Promise.all([store.listConversations(w.id), store.listMembers(w.id)]);
      return {
        w,
        members: members.length,
        conversations: conversations.length,
        open: conversations.filter((c) => c.escalation && c.escalation.status !== "resuelta").length,
      };
    }),
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-4 sm:px-8">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <HeadsetIcon className="size-5" weight="fill" />
          </span>
          <span className="font-semibold text-zinc-900">CallSupporter AI</span>
          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Admin</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <PageHeader icon={BuildingsIcon} title="Clientes" subtitle={`${workspaces.length} workspaces activos`} />

        <ul className="mb-10 grid gap-3 sm:grid-cols-2">
          {rows.map(({ w, members, conversations, open }) => (
            <li key={w.id}>
              <Link
                href={`/w/${w.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 transition-shadow hover:shadow-md hover:shadow-zinc-200/60"
              >
                <WorkspaceMark ws={w} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900">{w.name}</p>
                  <p className="text-xs text-zinc-500">{w.industry} · desde {shortDate(w.createdAt)}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5" title="Conversaciones"><ChatsCircleIcon className="size-4" weight="duotone" />{conversations}</span>
                    <span className="inline-flex items-center gap-1.5" title="Escalaciones abiertas"><SirenIcon className="size-4" weight="duotone" />{open}</span>
                    <span className="inline-flex items-center gap-1.5" title="Miembros"><UsersThreeIcon className="size-4" weight="duotone" />{members}</span>
                  </div>
                </div>
                <CaretRightIcon className="size-5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </Link>
            </li>
          ))}
        </ul>

        <Card title="Nuevo cliente" icon={PlusCircleIcon}>
          <NewClientForm templates={Object.entries(TEMPLATES).map(([key, t]) => ({ key, label: t.label, description: t.description }))} />
        </Card>
      </main>
    </div>
  );
}
