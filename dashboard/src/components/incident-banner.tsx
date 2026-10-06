import { BarricadeIcon } from "@phosphor-icons/react/ssr";
import { jstRange } from "@/lib/format";
import type { Incident } from "@/lib/types";

export function IncidentBanner({ items, label }: { items: Incident[]; label: string }) {
  if (items.length === 0) return null;
  const live = items.some((m) => m.status === "in_progress");
  const first = items[0];

  return (
    <div
      className={
        live
          ? "flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          : "flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
      }
    >
      <BarricadeIcon className="size-5 shrink-0" weight="duotone" />
      <p className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center">
        <span className="font-semibold">
          {label} · {live ? "en curso" : "programada"}
        </span>
        <span className="mx-2 hidden opacity-40 sm:inline">·</span>
        <span className="tabular-nums">{jstRange(first.start, first.end)}</span>
        {items.length > 1 ? <span className="opacity-70 sm:ml-1">(+{items.length - 1} más)</span> : null}
      </p>
      <span className="hidden text-xs opacity-70 sm:inline">El agente avisa a los clientes que pregunten</span>
    </div>
  );
}
