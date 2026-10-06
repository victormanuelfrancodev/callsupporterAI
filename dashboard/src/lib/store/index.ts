import "server-only";
import { createClient } from "@supabase/supabase-js";
import { memoryStore } from "./memory";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Demo mode: no Supabase configured → in-memory data and no login. */
export const demoMode = !(url && serviceKey);

export const store: Store = demoMode
  ? memoryStore
  : supabaseStore(createClient(url!, serviceKey!, { auth: { persistSession: false, autoRefreshToken: false } }));
