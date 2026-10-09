const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string, now = Date.now()): string {
  const diffMin = Math.round((new Date(iso).getTime() - now) / 60000);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  return rtf.format(Math.round(diffH / 24), "day");
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

export function jstRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tokyo",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  const f = new Intl.DateTimeFormat("en", opts);
  return `${f.format(new Date(startIso))} → ${f.format(new Date(endIso))} JST`;
}

export function duration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m} min ${s.toString().padStart(2, "0")} s` : `${s} s`;
}

export function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
