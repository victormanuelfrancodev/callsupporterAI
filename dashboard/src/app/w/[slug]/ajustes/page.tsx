import clsx from "clsx";
import { CalendarBlankIcon, LinkSimpleIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/ssr";
import { SaveButton } from "@/components/settings/save-button";
import { Card, FormField, input } from "@/components/ui";
import { requireWorkspace } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { TONE_CLASSES, TONES } from "@/lib/meta";
import { saveGeneral } from "./actions";

export default async function GeneralSettings(props: PageProps<"/w/[slug]/ajustes">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);

  return (
    <form action={saveGeneral.bind(null, slug)} className="max-w-2xl space-y-6">
      <Card title="Workspace" icon={SlidersHorizontalIcon}>
        <div className="space-y-5">
          <FormField label="Nombre del cliente">
            <input name="name" defaultValue={workspace.name} className={input} required />
          </FormField>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-800">Color</legend>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <label key={t} className="cursor-pointer">
                  <input type="radio" name="color" value={t} defaultChecked={workspace.color === t} className="peer sr-only" />
                  <span className={clsx("block size-8 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-zinc-900", TONE_CLASSES[t].solid)} />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 rounded-xl bg-zinc-50 p-4 text-sm sm:grid-cols-2">
            <span className="flex items-center gap-2 text-zinc-500">
              <LinkSimpleIcon className="size-4" />
              <code className="font-mono text-xs text-zinc-700">/w/{workspace.slug}</code>
            </span>
            <span className="flex items-center gap-2 text-zinc-500">
              <CalendarBlankIcon className="size-4" />
              Cliente desde {shortDate(workspace.createdAt)}
            </span>
          </div>
        </div>
      </Card>
      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
