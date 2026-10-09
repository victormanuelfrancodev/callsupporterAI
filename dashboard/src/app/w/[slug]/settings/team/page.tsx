import { CrownSimpleIcon, EnvelopeSimpleIcon, TrashIcon, UserIcon, UserPlusIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { SaveButton } from "@/components/settings/save-button";
import { Card, Chip, btn, input } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { store } from "@/lib/store";
import { inviteMember, removeMember } from "../actions";

export default async function TeamSettings(props: PageProps<"/w/[slug]/settings/team">) {
  const { slug } = await props.params;
  const { workspace, viewer } = await requireWorkspace(slug);
  const members = await store.listMembers(workspace.id);

  return (
    <div className="max-w-2xl space-y-6">
      <Card title="Invite" icon={UserPlusIcon}>
        <form action={inviteMember.bind(null, slug)} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <EnvelopeSimpleIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input name="email" type="email" required placeholder="person@client.com" className={`${input} pl-10`} />
          </label>
          <select name="role" defaultValue="member" className={`${input} sm:w-40`}>
            <option value="member">CX agent</option>
            <option value="owner">Admin</option>
          </select>
          <SaveButton label="Invite" />
        </form>
        <p className="mt-3 text-xs text-zinc-500">They&apos;ll get a sign-in link by email. CX agents can&apos;t see Settings.</p>
      </Card>

      <Card title="Members" icon={UsersThreeIcon} action={<span className="text-xs text-zinc-400">{members.length}</span>}>
        <ul className="divide-y divide-zinc-100">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                {m.role === "owner" ? <CrownSimpleIcon className="size-[18px]" weight="duotone" /> : <UserIcon className="size-[18px]" weight="duotone" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{m.email}</p>
                <p className="text-xs text-zinc-500">Invited {timeAgo(m.invitedAt)}</p>
              </div>
              <Chip meta={{ label: m.role === "owner" ? "Admin" : "CX agent", tone: m.role === "owner" ? "brand" : "neutral" }} size="sm" />
              {m.userId !== viewer.id ? (
                <form action={removeMember.bind(null, slug, m.userId)}>
                  <button title="Remove access" className={btn.icon}>
                    <TrashIcon className="size-[18px]" />
                  </button>
                </form>
              ) : (
                <span className="size-9" />
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
