import clsx from "clsx";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import { TONE_CLASSES, type Meta } from "@/lib/meta";
import type { Tone } from "@/lib/types";
import { initials, pct } from "@/lib/format";

export function Chip({ meta, size = "md", className }: { meta: Meta; size?: "sm" | "md"; className?: string }) {
  const Icon = meta.icon;
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONE_CLASSES[meta.tone].chip,
        className,
      )}
    >
      {Icon ? <Icon className={size === "sm" ? "size-3" : "size-3.5"} weight="bold" /> : null}
      {meta.label}
    </span>
  );
}

/** Icon-only status marker with an accessible tooltip label. */
export function StatusIcon({ meta, className }: { meta: Meta; className?: string }) {
  const Icon = meta.icon;
  if (!Icon) return null;
  return (
    <span title={meta.label} aria-label={meta.label} className={clsx("inline-flex", TONE_CLASSES[meta.tone].text, className)}>
      <Icon className="size-[22px]" weight="duotone" />
    </span>
  );
}

export function Avatar({ name, tone = "neutral" }: { name: string; tone?: Tone }) {
  return (
    <span
      className={clsx(
        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
        TONE_CLASSES[tone].chip,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Card({ title, icon: Icon, action, children, className }: {
  title?: string;
  icon?: PhIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-2xl border border-zinc-200/80 bg-white", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            {Icon ? <Icon className="size-[18px] text-zinc-400" weight="duotone" /> : null}
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Confidence({ p, tone = "brand" }: { p: number; tone?: Tone }) {
  return (
    <span className="flex items-center gap-2" title={`Confianza ${pct(p)}`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
        <span className={clsx("block h-full rounded-full", TONE_CLASSES[tone].bar)} style={{ width: pct(p) }} />
      </span>
      <span className="w-9 text-right text-xs tabular-nums text-zinc-500">{pct(p)}</span>
    </span>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, children }: {
  icon: PhIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="size-[22px]" weight="duotone" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }: { icon: PhIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-400">
        <Icon className="size-7" weight="duotone" />
      </span>
      <p className="font-medium text-zinc-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export const PENDING: Meta = { label: "Sin clasificar", tone: "neutral" };

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60",
  icon: "grid size-9 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
};

export const input =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50";

export function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}
