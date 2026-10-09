import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";

// Magic-link and invite emails land here with a one-time code.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect("/login?error=link");
  }
  redirect("/");
}
