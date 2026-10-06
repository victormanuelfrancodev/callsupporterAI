"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BuildingsIcon,
  CaretUpDownIcon,
  ChartBarIcon,
  CheckIcon,
  GearSixIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SirenIcon,
  TrayIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/ssr";
import { TONE_CLASSES } from "@/lib/meta";
import type { Tone } from "@/lib/types";

export interface WorkspaceLink {
  slug: string;
  name: string;
  industry: string;
  color: Tone;
}

type Badges = { escalations: number; review: number };

const NAV = [
  { path: "", label: "Inbox", icon: TrayIcon, badge: null },
  { path: "/escalaciones", label: "Escalaciones", icon: SirenIcon, badge: "escalations" },
  { path: "/metricas", label: "Métricas", icon: ChartBarIcon, badge: null },
  { path: "/calidad", label: "Calidad", icon: ShieldCheckIcon, badge: "review" },
] as const;

const SECONDARY = [
  { path: "/probar", label: "Probar agente", icon: PhoneCallIcon, badge: null },
  { path: "/ajustes", label: "Ajustes", icon: GearSixIcon, badge: null },
] as const;

export function WorkspaceMark({ ws, size = "md" }: { ws: Pick<WorkspaceLink, "name" | "color">; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center rounded-lg font-semibold",
        { sm: "size-6 text-[11px]", md: "size-8 text-sm", lg: "size-11 rounded-xl text-base" }[size],
        TONE_CLASSES[ws.color].solid,
      )}
    >
      {ws.name[0]?.toUpperCase()}
    </span>
  );
}

function Switcher({ current, workspaces, isAdmin }: { current: WorkspaceLink; workspaces: WorkspaceLink[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-zinc-50"
      >
        <WorkspaceMark ws={current} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-zinc-900">{current.name}</span>
          <span className="block truncate text-xs text-zinc-500">{current.industry}</span>
        </span>
        <CaretUpDownIcon className="size-4 text-zinc-400" />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-200/60">
          {workspaces.map((w) => (
            <Link
              key={w.slug}
              href={`/w/${w.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <WorkspaceMark ws={w} size="sm" />
              <span className="flex-1 truncate">{w.name}</span>
              {w.slug === current.slug ? <CheckIcon className="size-4 text-indigo-600" weight="bold" /> : null}
            </Link>
          ))}
          {isAdmin ? (
            <>
              <div className="my-1 border-t border-zinc-100" />
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <span className="grid size-6 place-items-center">
                  <BuildingsIcon className="size-[18px]" weight="duotone" />
                </span>
                Administrar clientes
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({ current, workspaces, isAdmin, badges, email, demo, signOut }: {
  current: WorkspaceLink;
  workspaces: WorkspaceLink[];
  isAdmin: boolean;
  badges: Badges;
  email: string;
  demo: boolean;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const base = `/w/${current.slug}`;
  const isActive = (path: string) =>
    path === "" ? pathname === base || pathname.startsWith(`${base}/c/`) : pathname.startsWith(base + path);

  const renderItem = (n: (typeof NAV)[number] | (typeof SECONDARY)[number]) => {
    const active = isActive(n.path);
    const count = n.badge ? badges[n.badge] : 0;
    const Icon = n.icon;
    return (
      <Link
        key={n.path}
        href={base + n.path}
        className={clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-indigo-50 text-indigo-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
        )}
      >
        <Icon className="size-5" weight={active ? "duotone" : "regular"} />
        <span className="flex-1">{n.label}</span>
        {count > 0 ? (
          <span
            className={clsx(
              "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
              n.badge === "escalations" ? "bg-rose-500 text-white" : "bg-zinc-200 text-zinc-700",
            )}
          >
            {count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white px-3 py-4 md:flex">
        <Switcher current={current} workspaces={workspaces} isAdmin={isAdmin} />

        <nav className="mt-6 flex flex-col gap-1">{NAV.map(renderItem)}</nav>
        <div className="mx-3 my-4 border-t border-zinc-100" />
        <nav className="flex flex-col gap-1">{SECONDARY.map(renderItem)}</nav>

        <div className="mt-auto space-y-3">
          {demo ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              Modo demo: los cambios viven en memoria hasta reiniciar el servidor.
            </p>
          ) : null}
          <div className="flex items-center gap-2 px-2">
            <UserCircleIcon className="size-7 shrink-0 text-zinc-300" weight="duotone" />
            <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{email}</span>
            {!demo ? (
              <form action={signOut}>
                <button title="Cerrar sesión" className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  <SignOutIcon className="size-4" />
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      {/* Mobile: switcher on top, tabs at the bottom */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        <Switcher current={current} workspaces={workspaces} isAdmin={isAdmin} />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {[...NAV, SECONDARY[1]].map((n) => {
          const active = isActive(n.path);
          const count = n.badge ? badges[n.badge] : 0;
          const Icon = n.icon;
          return (
            <Link
              key={n.path}
              href={base + n.path}
              className={clsx("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-indigo-600" : "text-zinc-500")}
            >
              <span className="relative">
                <Icon className="size-6" weight={active ? "duotone" : "regular"} />
                {count > 0 ? (
                  <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                    {count}
                  </span>
                ) : null}
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
