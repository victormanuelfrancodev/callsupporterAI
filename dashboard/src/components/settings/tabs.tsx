"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainIcon,
  PlugsConnectedIcon,
  RobotIcon,
  SirenIcon,
  SlidersHorizontalIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

const TABS = [
  { path: "", label: "General", icon: SlidersHorizontalIcon },
  { path: "/agente", label: "Agente", icon: RobotIcon },
  { path: "/clasificacion", label: "Clasificación", icon: BrainIcon },
  { path: "/escalado", label: "Escalado", icon: SirenIcon },
  { path: "/conexion", label: "Conexión", icon: PlugsConnectedIcon },
  { path: "/equipo", label: "Equipo", icon: UsersThreeIcon },
];

export function SettingsTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/w/${slug}/ajustes`;
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 sm:mx-0 sm:px-0">
      {TABS.map(({ path, label, icon: Icon }) => {
        const active = path ? pathname.startsWith(base + path) : pathname === base;
        return (
          <Link
            key={path}
            href={base + path}
            className={clsx(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active ? "border-indigo-600 text-indigo-700" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            <Icon className="size-[18px]" weight={active ? "duotone" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
