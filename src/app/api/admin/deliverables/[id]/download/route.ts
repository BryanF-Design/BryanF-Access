import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const service = createServiceRoleClient();
  const { data: deliverable } = await service
    .from("deliverables")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const storagePath = (deliverable as { storage_path: string | null } | null)?.storage_path;
  if (!storagePath) {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }

  const { data: signed, error } = await service.storage
    .from("deliverables")
    .createSignedUrl(storagePath, 60);

  if (error || !signed) {
    return NextResponse.json({ error: "No se pudo generar el enlace de descarga." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
