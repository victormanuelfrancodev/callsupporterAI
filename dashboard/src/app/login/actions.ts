"use server";

import { headers } from "next/headers";
import { sessionClient } from "@/lib/supabase/server";

export type LoginState = { sent?: string; error?: string };

export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Escribe un email válido" };
  const origin = process.env.APP_URL ?? `https://${(await headers()).get("host")}`;
  const supabase = await sessionClient();
  // Only invited users can sign in: accounts are created from /admin or Ajustes → Equipo.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: "No encontramos una cuenta con ese email. Pide una invitación a tu administrador." };
  return { sent: email };
}
