import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Deliverable } from "@/types/database";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Scoped client: RLS means this select only returns a row if the signed-in
  // user's client record actually owns the project this deliverable belongs to.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle<Pick<Deliverable, "id" | "storage_path">>();

  if (!deliverable || !deliverable.storage_path) {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }

  const service = createServiceRoleClient();
  const { data: signed, error } = await service.storage
    .from("deliverables")
    .createSignedUrl(deliverable.storage_path, 60);

  if (error || !signed) {
    return NextResponse.json({ error: "No se pudo generar el enlace de descarga." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
