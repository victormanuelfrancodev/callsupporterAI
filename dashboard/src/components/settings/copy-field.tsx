"use client";

import clsx from "clsx";
import { useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react/ssr";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copiar"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={clsx("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", done ? "text-emerald-600" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700", className)}
    >
      {done ? <CheckIcon className="size-4" weight="bold" /> : <CopyIcon className="size-4" />}
    </button>
  );
}

/** Read-only value with copy (and optional reveal for secrets). */
export function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 py-1 pl-3.5 pr-1">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700">{shown ? value : "•".repeat(32)}</code>
        {secret ? (
          <button type="button" title={shown ? "Ocultar" : "Mostrar"} onClick={() => setShown((s) => !s)} className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            {shown ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        ) : null}
        <CopyButton value={value} />
      </div>
    </div>
  );
}
