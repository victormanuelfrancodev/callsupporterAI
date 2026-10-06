"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { BrainIcon, ListPlusIcon, PlusIcon, SquaresFourIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { ICONS, ICON_NAMES } from "@/lib/icons";
import { TONE_CLASSES, TONES } from "@/lib/meta";
import type { CustomField, Option, Tone, WorkspaceConfig } from "@/lib/types";
import { Card, btn, input } from "../ui";
import { SaveButton } from "./save-button";

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return { open, setOpen, ref };
}

function IconPicker({ value, tone, onChange }: { value?: string; tone: Tone; onChange: (v: string) => void }) {
  const { open, setOpen, ref } = usePopover();
  const Icon = (value && ICONS[value]) || SquaresFourIcon;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Elegir icono"
        onClick={() => setOpen(!open)}
        className={clsx("grid size-10 place-items-center rounded-xl transition-colors", TONE_CLASSES[tone].chip)}
      >
        <Icon className="size-5" weight="duotone" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 grid w-[17rem] grid-cols-7 gap-1 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-200/60">
          {ICON_NAMES.map((name) => {
            const I = ICONS[name];
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={clsx("grid size-8 place-items-center rounded-lg", value === name ? "bg-indigo-50 text-indigo-600" : "text-zinc-600 hover:bg-zinc-100")}
              >
                <I className="size-[18px]" weight="duotone" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TonePicker({ value, onChange }: { value: Tone; onChange: (t: Tone) => void }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button type="button" title="Color" onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-xl hover:bg-zinc-100">
        <span className={clsx("size-4 rounded-full", TONE_CLASSES[value].dot)} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 flex gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-200/60">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={clsx("size-6 rounded-full ring-offset-2", TONE_CLASSES[t].dot, value === t && "ring-2 ring-zinc-900")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OptionRow({ option, withIcon, onChange, onRemove }: {
  option: Option;
  withIcon: boolean;
  onChange: (o: Option) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 py-2 sm:grid-cols-[auto_11rem_1fr_auto_auto]">
      {withIcon ? (
        <IconPicker value={option.icon} tone={option.tone} onChange={(icon) => onChange({ ...option, icon })} />
      ) : (
        <span className={clsx("mx-3 size-2.5 rounded-full", TONE_CLASSES[option.tone].dot)} />
      )}
      <input value={option.label} onChange={(e) => onChange({ ...option, label: e.target.value })} placeholder="Nombre" className={input} />
      <input
        value={option.description ?? ""}
        onChange={(e) => onChange({ ...option, description: e.target.value })}
        placeholder="Cuándo aplica (lo lee Jev)"
        className={clsx(input, "col-span-4 row-start-2 sm:col-span-1 sm:row-start-auto")}
      />
      <TonePicker value={option.tone} onChange={(tone) => onChange({ ...option, tone })} />
      <button type="button" title="Eliminar" onClick={onRemove} className={btn.icon}>
        <TrashIcon className="size-[18px]" />
      </button>
    </div>
  );
}

const newOption = (): Option => ({ value: "", label: "", tone: "neutral" });

export function ClassificationEditor({ initial, save }: {
  initial: WorkspaceConfig["classification"];
  save: (json: string) => Promise<{ error?: string }>;
}) {
  const [topics, setTopics] = useState<Option[]>(initial.topics);
  const [fields, setFields] = useState<CustomField[]>(initial.fields);
  const [error, setError] = useState("");

  const setField = (i: number, f: CustomField) => setFields(fields.map((x, j) => (j === i ? f : x)));

  return (
    <form
      action={async () => {
        setError("");
        const res = await save(JSON.stringify({ topics, fields })).catch(() => ({ error: "No se pudo guardar" }));
        if (res.error) setError(res.error);
      }}
      className="space-y-6"
    >
      <Card title="Temas" icon={BrainIcon} action={<span className="text-xs text-zinc-400">{topics.length} temas</span>}>
        <p className="mb-3 text-sm text-zinc-500">Jev clasifica cada conversación en uno de estos temas. Incluye uno tipo «Otro».</p>
        <div className="divide-y divide-zinc-100">
          {topics.map((t, i) => (
            <OptionRow
              key={i}
              option={t}
              withIcon
              onChange={(o) => setTopics(topics.map((x, j) => (j === i ? o : x)))}
              onRemove={() => setTopics(topics.filter((_, j) => j !== i))}
            />
          ))}
        </div>
        <button type="button" onClick={() => setTopics([...topics, newOption()])} className={clsx(btn.secondary, "mt-3")}>
          <PlusIcon className="size-4" weight="bold" /> Añadir tema
        </button>
      </Card>

      {fields.map((f, i) => (
        <Card key={i}>
          <div className="mb-3 flex items-center gap-2">
            <IconPicker value={f.icon} tone="neutral" onChange={(icon) => setField(i, { ...f, icon })} />
            <input
              value={f.label}
              onChange={(e) => setField(i, { ...f, label: e.target.value })}
              placeholder="Nombre del campo, p. ej. Carrier"
              className={clsx(input, "font-medium")}
            />
            <button type="button" title="Eliminar campo" onClick={() => setFields(fields.filter((_, j) => j !== i))} className={btn.icon}>
              <TrashIcon className="size-[18px]" />
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {f.options.map((o, oi) => (
              <OptionRow
                key={oi}
                option={o}
                withIcon={false}
                onChange={(next) => setField(i, { ...f, options: f.options.map((x, j) => (j === oi ? next : x)) })}
                onRemove={() => setField(i, { ...f, options: f.options.filter((_, j) => j !== oi) })}
              />
            ))}
          </div>
          <button type="button" onClick={() => setField(i, { ...f, options: [...f.options, newOption()] })} className={clsx(btn.secondary, "mt-3")}>
            <PlusIcon className="size-4" weight="bold" /> Añadir opción
          </button>
        </Card>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFields([...fields, { key: "", label: "", options: [newOption(), newOption()] }])}
          className={btn.secondary}
        >
          <ListPlusIcon className="size-4" weight="duotone" /> Añadir campo personalizado
        </button>
        <div className="flex items-center gap-3">
          {error ? (
            <span className="flex items-center gap-1.5 text-sm text-rose-600">
              <WarningCircleIcon className="size-4" weight="duotone" /> {error}
            </span>
          ) : null}
          <SaveButton />
        </div>
      </div>
    </form>
  );
}
