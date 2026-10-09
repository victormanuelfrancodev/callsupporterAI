"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { BookOpenTextIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import type { KnowledgeItem } from "@/lib/types";
import { Card, btn, input } from "../ui";
import { ActionForm } from "./action-form";
import { SaveButton } from "./save-button";

export function KnowledgeEditor({ initial, save, softLimit }: {
  initial: KnowledgeItem[];
  save: (json: string) => Promise<{ error?: string }>;
  softLimit: number;
}) {
  const [items, setItems] = useState<KnowledgeItem[]>(initial);
  const [q, setQ] = useState("");
  const set = (id: string, patch: Partial<KnowledgeItem>) => setItems(items.map((k) => (k.id === id ? { ...k, ...patch } : k)));

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? items.filter((k) => `${k.question} ${k.answer}`.toLowerCase().includes(needle)) : items;
  }, [items, q]);

  return (
    <ActionForm action={() => save(JSON.stringify(items))} className="space-y-4">
      <Card
        title="Questions & answers"
        icon={BookOpenTextIcon}
        action={
          items.length > 3 ? (
            <label className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 w-44 rounded-full border border-zinc-200 pl-8 pr-3 text-sm outline-none focus:border-indigo-300" />
            </label>
          ) : (
            <span className="text-xs text-zinc-400">{items.length}</span>
          )
        }
      >
        <p className="mb-4 text-sm text-zinc-500">
          The agent answers only from here and from tool results. Write the exact facts: numbers, conditions and what it must never offer.
        </p>

        <div className="space-y-3">
          {visible.map((k) => (
            <div key={k.id} className="group rounded-xl border border-zinc-200 p-3 transition-colors focus-within:border-indigo-200 focus-within:bg-indigo-50/30">
              <div className="flex items-center gap-2">
                <input
                  value={k.question}
                  onChange={(e) => set(k.id, { question: e.target.value })}
                  placeholder="Question the customer asks"
                  className={clsx(input, "border-transparent bg-transparent font-medium focus:bg-white")}
                />
                <button type="button" title="Delete" onClick={() => setItems(items.filter((x) => x.id !== k.id))} className={btn.icon}>
                  <TrashIcon className="size-[18px]" />
                </button>
              </div>
              <textarea
                value={k.answer}
                onChange={(e) => set(k.id, { answer: e.target.value })}
                placeholder="Exact answer the agent should give"
                rows={2}
                className={clsx(input, "mt-1 h-auto border-transparent bg-transparent py-2 leading-relaxed text-zinc-600 focus:bg-white")}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems([...items, { id: `k${Date.now()}`, question: "", answer: "" }])}
          className={clsx(btn.secondary, "mt-4")}
        >
          <PlusIcon className="size-4" weight="bold" /> Add question
        </button>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {items.length > softLimit ? (
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <WarningIcon className="size-4" weight="duotone" /> Over {softLimit} entries: move long manuals to the ElevenLabs knowledge base.
          </p>
        ) : (
          <span />
        )}
        <SaveButton />
      </div>
    </ActionForm>
  );
}
