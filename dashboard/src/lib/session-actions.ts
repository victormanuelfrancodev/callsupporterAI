"use server";

import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/server";

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
