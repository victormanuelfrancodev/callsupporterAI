"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";
import { FileDashedIcon, PlusCircleIcon, ShoppingBagIcon, SimCardIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { FormField, btn, input } from "@/components/ui";
import { createClientWorkspace, type CreateState } from "./actions";

const TEMPLATE_ICONS: Record<string, Icon> = { esim: SimCardIcon, ecommerce: ShoppingBagIcon, blank: FileDashedIcon };

const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function NewClientForm({ templates }: { templates: { key: string; label: string; description: string }[] }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createClientWorkspace, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombre del cliente">
          <input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(toSlug(e.target.value));
            }}
            placeholder="Sekai Studios"
            className={input}
          />
        </FormField>
        <FormField label="Slug" hint={`URL: /w/${slug || "…"}`}>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(toSlug(e.target.value));
            }}
            className={clsx(input, "font-mono")}
          />
        </FormField>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-800">Plantilla</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((t, i) => {
            const Icon = TEMPLATE_ICONS[t.key] ?? FileDashedIcon;
            return (
              <label key={t.key} className="cursor-pointer">
                <input type="radio" name="template" value={t.key} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex h-full flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition peer-checked:border-indigo-300 peer-checked:bg-indigo-50/60 peer-checked:ring-4 peer-checked:ring-indigo-50">
                  <Icon className="size-6 text-indigo-600" weight="duotone" />
                  <span className="text-sm font-medium text-zinc-900">{t.label}</span>
                  <span className="text-xs text-zinc-500">{t.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <FormField label="Email del administrador del cliente" hint="Opcional. Le llegará una invitación para entrar.">
        <input name="ownerEmail" type="email" placeholder="cx@cliente.com" className={input} />
      </FormField>

      <div className="flex items-center justify-end gap-3">
        {state.error ? (
          <span className="flex items-center gap-1.5 text-sm text-rose-600">
            <WarningCircleIcon className="size-4" weight="duotone" /> {state.error}
          </span>
        ) : null}
        <button disabled={pending} className={btn.primary}>
          {pending ? <SpinnerGapIcon className="size-4 animate-spin" /> : <PlusCircleIcon className="size-4" weight="duotone" />}
          Crear cliente
        </button>
      </div>
    </form>
  );
}
