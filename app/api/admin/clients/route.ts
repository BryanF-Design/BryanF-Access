import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { staticClients } from "@/lib/clients";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseReady = !!(supabaseUrl && serviceKey);

function getAdminClient() {
  if (!isSupabaseReady) return null;
  return createClient(supabaseUrl!, serviceKey!);
}

export async function GET() {
  const sb = getAdminClient();

  if (!sb) {
    // Return static clients as if they were from DB
    const rows = staticClients.map((c) => ({
      id: c.id,
      display_name: c.displayName,
      keywords: c.keywords,
      drive_link: c.driveLink,
      active: true,
      created_at: new Date().toISOString(),
    }));
    return NextResponse.json({ clients: rows, supabaseReady: false });
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
  const body = await req.json();
  const { id, display_name, keywords, drive_link } = body;

  if (!id || !display_name || !keywords?.length || !drive_link) {
    return NextResponse.json({ error: "Campos incompletos." }, { status: 400 });
  }

  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json({ error: "Supabase no configurado. Configura SUPABASE_SERVICE_ROLE_KEY." }, { status: 501 });
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
