import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Admin } from "@/types/database";

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNext(request.nextUrl.searchParams.get("next"));
  const origin = request.nextUrl.origin;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle<Admin>();

  if (admin) {
    return NextResponse.redirect(`${origin}${next.startsWith("/admin") ? next : "/admin"}`);
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/admin") ? "/" : next}`);
}
