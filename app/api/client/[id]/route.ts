import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { staticClients } from "@/lib/clients";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = !!(supabaseUrl && anonKey);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const normalizedId = id.trim().toUpperCase();

  if (isSupabaseConfigured) {
    const sb = createClient(supabaseUrl!, anonKey!);
    const { data } = await sb
      .from("clients")
      .select("id, display_name, keywords, drive_link")
      .eq("id", normalizedId)
      .eq("active", true)
      .single();

    if (data) {
      return NextResponse.json({
        id: data.id,
        displayName: data.display_name,
        keywords: data.keywords,
        driveLink: data.drive_link,
      });
    }
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Fallback to static list
  const client = staticClients.find((c) => c.id.toUpperCase() === normalizedId);
  if (!client) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}
