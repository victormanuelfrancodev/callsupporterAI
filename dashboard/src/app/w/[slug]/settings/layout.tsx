import { GearSixIcon, LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { SettingsTabs } from "@/components/settings/tabs";
import { PageHeader } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";

export default async function SettingsLayout({ children, params }: LayoutProps<"/w/[slug]/settings">) {
  const { slug } = await params;
  const { workspace, role } = await requireWorkspace(slug);
  return (
    <>
      <PageHeader icon={GearSixIcon} title="Settings" subtitle={`Configure ${workspace.name}'s agent`} />
      <SettingsTabs slug={slug} />
      {role === "owner" ? (
        children
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-5 text-sm text-zinc-600">
          <LockSimpleIcon className="size-5 text-zinc-400" weight="duotone" />
          Only workspace admins can view and change settings.
        </div>
      )}
    </>
  );
}
