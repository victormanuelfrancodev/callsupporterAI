"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CaretDownIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MicrophoneIcon,
  SlidersHorizontalIcon,
  TagIcon,
  ThumbsUpIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import { iconFor } from "@/lib/icons";
import { RESOLVED, SENTIMENT, optionMeta, type Meta } from "@/lib/meta";
import { timeAgo } from "@/lib/format";
import type { Conversation, CustomField, Option } from "@/lib/types";
import { Avatar, Chip, EmptyState, PENDING, StatusIcon } from "./ui";

function FilterPill({ icon: Icon, label, value, options, onChange }: {
  icon: PhIcon;
  label: string;
  value: string;
  options: Record<string, Meta>;
  onChange: (v: string) => void;
}) {
  const active = value !== "";
  return (
    <label
      className={clsx(
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border pl-3 pr-8 text-sm transition-colors",
        active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
      )}
    >
      <Icon className="size-4" weight={active ? "bold" : "regular"} />
      <span className="whitespace-nowrap">{active ? options[value]?.label : label}</span>
      <CaretDownIcon className="pointer-events-none absolute right-2.5 size-4 opacity-60" />
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        <option value="">Todos</option>
        {Object.entries(options).map(([k, m]) => (
          <option key={k} value={k}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const toRecord = (options: Option[]) => Object.fromEntries(options.map((o) => [o.value, optionMeta(o)]));

export function InboxList({ slug, conversations, topics, fields }: {
  slug: string;
  conversations: Conversation[];
  topics: Option[];
  fields: CustomField[];
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const activeCount = Object.values(f).filter(Boolean).length;

  const topicMetas = useMemo(() => toRecord(topics), [topics]);
  const primaryField = fields[0];

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return conversations.filter((c) => {
      const k = c.classification;
      if (f.topic && k?.topic.value !== f.topic) return false;
      if (f.resolved && k?.resolved.value !== f.resolved) return false;
      if (f.sentiment && k?.sentiment.value !== f.sentiment) return false;
      for (const field of fields) {
        if (f[`field:${field.key}`] && k?.fields[field.key]?.value !== f[`field:${field.key}`]) return false;
      }
      if (!needle) return true;
      return [c.customer.name, c.customer.email, c.summary, c.record?.reference ?? ""].some((s) => s.toLowerCase().includes(needle));
    });
  }, [conversations, q, f, fields]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, email o pedido"
            className="h-9 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <SlidersHorizontalIcon className="size-4 shrink-0 text-zinc-400" />
          <FilterPill icon={TagIcon} label="Tema" value={f.topic ?? ""} options={topicMetas} onChange={set("topic")} />
          {fields.map((field) => (
            <FilterPill
              key={field.key}
              icon={iconFor(field.icon) ?? TagIcon}
              label={field.label}
              value={f[`field:${field.key}`] ?? ""}
              options={toRecord(field.options)}
              onChange={set(`field:${field.key}`)}
            />
          ))}
          <FilterPill icon={CheckCircleIcon} label="Estado" value={f.resolved ?? ""} options={RESOLVED} onChange={set("resolved")} />
          <FilterPill icon={ThumbsUpIcon} label="Sentimiento" value={f.sentiment ?? ""} options={SENTIMENT} onChange={set("sentiment")} />
          {activeCount > 0 ? (
            <button onClick={() => setF({})} title="Quitar filtros" className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100">
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlassMinusIcon}
          title={conversations.length ? "Nada por aquí" : "Aún no hay conversaciones"}
          hint={conversations.length ? "Prueba con otra búsqueda o quita algún filtro." : "Aparecerán aquí cuando el agente atienda su primera llamada o chat."}
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
          {rows.map((c) => {
            const k = c.classification;
            const topic = k ? topicMetas[k.topic.value] ?? optionMeta(undefined) : PENDING;
            const fieldValue = primaryField && k?.fields[primaryField.key]?.value;
            const fieldOpt = primaryField?.options.find((o) => o.value === fieldValue);
            return (
              <li key={c.id}>
                <Link
                  href={`/w/${slug}/c/${c.id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-zinc-50 sm:px-5"
                >
                  <Avatar name={c.customer.name} tone={k ? SENTIMENT[k.sentiment.value].tone : "neutral"} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900">{c.customer.name}</p>
                      <span className="text-[11px] font-medium text-zinc-400">{c.customer.language}</span>
                      {c.channel === "voz" ? <MicrophoneIcon className="size-3.5 text-zinc-400" aria-label="Voz" /> : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{c.summary || "Conversación en curso"}</p>
                    <div className="mt-2 flex items-center gap-1.5 sm:hidden">
                      <Chip meta={topic} size="sm" />
                      {fieldOpt && fieldOpt.value !== "desconocido" ? <Chip meta={optionMeta(fieldOpt)} size="sm" /> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden w-36 sm:block">
                      <Chip meta={topic} />
                    </div>
                    {primaryField ? (
                      <span className="hidden w-12 truncate text-xs font-semibold text-zinc-500 lg:block">
                        {fieldOpt && fieldOpt.value !== "desconocido" ? fieldOpt.label : "—"}
                      </span>
                    ) : null}
                    {k ? (
                      <div className="flex items-center gap-2.5">
                        <StatusIcon meta={RESOLVED[k.resolved.value]} />
                        <StatusIcon meta={SENTIMENT[k.sentiment.value]} className="hidden sm:inline-flex" />
                      </div>
                    ) : null}
                    <span className="hidden w-28 whitespace-nowrap text-right text-xs text-zinc-400 md:block">{timeAgo(c.startedAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
