"use client";

import clsx from "clsx";
import { useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeSlashIcon, XIcon } from "@phosphor-icons/react/ssr";

/**
 * navigator.clipboard only exists on secure origins (https / localhost) and can
 * be blocked inside iframes, so fall back to a hidden textarea + execCommand.
 */
async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const el = document.createElement("textarea");
  el.value = value;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    el.remove();
  }
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      title={state === "failed" ? "Copy blocked by the browser: select the text instead" : "Copy"}
      onClick={async () => {
        setState((await copyText(value)) ? "done" : "failed");
        setTimeout(() => setState("idle"), 2000);
      }}
      className={clsx(
        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
        state === "done" ? "text-emerald-600" : state === "failed" ? "text-rose-600" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
        className,
      )}
    >
      {state === "done" ? <CheckIcon className="size-4" weight="bold" /> : state === "failed" ? <XIcon className="size-4" weight="bold" /> : <CopyIcon className="size-4" />}
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
          <button type="button" title={shown ? "Hide" : "Show"} onClick={() => setShown((s) => !s)} className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            {shown ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        ) : null}
        <CopyButton value={value} />
      </div>
    </div>
  );
}
