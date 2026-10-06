import "server-only";
import type { Incident } from "./types";

/**
 * Reads a status feed shaped like { today: Incident[], tomorrow: Incident[] }
 * (the IIJmio maintenance endpoint uses it) and returns unique incidents.
 */
export async function getIncidents(url: string): Promise<Incident[]> {
  if (!url) return [];
  try {
    const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { today?: Incident[]; tomorrow?: Incident[] } | Incident[];
    const all = Array.isArray(json) ? json : [...(json.today ?? []), ...(json.tomorrow ?? [])];
    const seen = new Set<string>();
    return all.filter((m) => {
      const key = `${m.start}|${m.end}`;
      if (!m.start || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
}
