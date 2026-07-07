import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./new-project-form";
import type { Client } from "@/types/database";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  await requireAdmin();
  const service = createServiceRoleClient();

  const { data: clientsData } = await service
    .from("clients")
    .select("id, full_name, company")
    .order("full_name", { ascending: true });
  const clients = (clientsData ?? []) as Pick<Client, "id" | "full_name" | "company">[];

  const preselectedClient = cliente ? (clients.find((c) => c.id === cliente) ?? null) : null;

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={preselectedClient ? `/admin/clientes/${preselectedClient.id}` : "/admin/clientes"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {preselectedClient ? (preselectedClient.company ?? preselectedClient.full_name) : "Clientes"}
      </Link>

      <h1 className="font-display text-2xl font-semibold text-paper">Nuevo proyecto</h1>
      <p className="mt-2 text-sm text-paper-dim">
        Después podrás agregar el cronograma, entregables y pagos desde el proyecto.
      </p>

      <NewProjectForm clients={clients} preselectedClient={preselectedClient} />
    </div>
  );
}
