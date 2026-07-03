import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = !!(supabaseUrl && anonKey);

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIP(req);

  // 20 lookups per IP per minute — prevents code enumeration
  if (!rateLimit(`lookup:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
  }

  const { id } = await params;
  const normalizedId = id.trim().toUpperCase();

  // Basic format validation — avoids hitting DB with garbage
  if (!/^[A-Z0-9]{4,12}$/.test(normalizedId)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const sb = createClient(supabaseUrl!, anonKey!);
  const { data } = await sb
    .from("clients")
    .select("id, display_name, keywords, drive_link")
    .eq("id", normalizedId)
    .eq("active", true)
    .single();

  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    displayName: data.display_name,
    keywords: data.keywords,
    driveLink: data.drive_link,
  });
}
