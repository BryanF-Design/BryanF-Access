import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseReady = !!(supabaseUrl && serviceKey);

function getAdminClient() {
  if (!isSupabaseReady) return null;
  return createClient(supabaseUrl!, serviceKey!);
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function requireAuth(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? "";
  return verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json({ clients: [], supabaseReady: false });
  }

  const { data, error } = await sb
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data, supabaseReady: true });
}

export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const ip = getIP(req);
  if (!rateLimit(`admin-write:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas peticiones." }, { status: 429 });
  }

  const body = await req.json();
  const { id, display_name, keywords, drive_link } = body;

  if (!id || !display_name || !keywords?.length || !drive_link) {
    return NextResponse.json({ error: "Campos incompletos." }, { status: 400 });
  }

  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase no configurado. Configura SUPABASE_SERVICE_ROLE_KEY." },
      { status: 501 }
    );
  }

  const { error } = await sb.from("clients").insert({
    id,
    display_name,
    keywords,
    drive_link,
    active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id, active } = await req.json();
  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 501 });
  }

  const { error } = await sb.from("clients").update({ active }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  }

  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 501 });
  }

  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
