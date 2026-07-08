import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Admin } from "@/types/database";

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: admin } = await supabase
        .from("admins")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .maybeSingle<Admin>();

      if (admin) {
        return NextResponse.redirect(`${origin}${next.startsWith("/admin") ? next : "/admin"}`);
      }

      return NextResponse.redirect(`${origin}${next.startsWith("/admin") ? "/admin/login" : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
