"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { DailyPoint } from "@/lib/types";

const TOTAL = "#4f46e5";
const RESOLVED = "#0d9488";

const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "short" });

function Tip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as DailyPoint;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg shadow-zinc-200/50">
      <p className="mb-1.5 font-medium text-zinc-900">{fmtDay(String(label))}</p>
      <p className="flex items-center gap-2 text-zinc-600">
        <span className="size-2 rounded-full" style={{ background: TOTAL }} /> Total
        <span className="ml-auto pl-4 font-semibold tabular-nums text-zinc-900">{p.total}</span>
      </p>
      <p className="flex items-center gap-2 text-zinc-600">
        <span className="size-2 rounded-full" style={{ background: RESOLVED }} /> Sin humano
        <span className="ml-auto pl-4 font-semibold tabular-nums text-zinc-900">{p.resolved}</span>
      </p>
      {p.incident ? <p className="mt-1.5 text-amber-700">Incidencia</p> : null}
    </div>
  );
}

export function VolumeChart({ data }: { data: DailyPoint[] }) {
  const spikes = data.filter((d) => d.incident);
  return (
    <div>
      <div className="mb-4 flex items-center gap-5 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full" style={{ background: TOTAL }} /> Total
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full" style={{ background: RESOLVED }} /> Resueltas sin humano
        </span>
        {spikes.length ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-0 border-l-2 border-dashed border-amber-400" /> Incidencia
          </span>
        ) : null}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TOTAL} stopOpacity={0.14} />
                <stop offset="100%" stopColor={TOTAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f0f0f2" />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDay}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} allowDecimals={false} />
            {spikes.map((d) => (
              <ReferenceLine key={d.date} x={d.date} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} />
            ))}
            <Tooltip content={Tip} cursor={{ stroke: "#d4d4d8", strokeWidth: 1 }} />
            <Area isAnimationActive={false} type="monotone" dataKey="total" stroke={TOTAL} strokeWidth={2} fill="url(#gTotal)" activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
            <Area isAnimationActive={false} type="monotone" dataKey="resolved" stroke={RESOLVED} strokeWidth={2} fill="transparent" activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
