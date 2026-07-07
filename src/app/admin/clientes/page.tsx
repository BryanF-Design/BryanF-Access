import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Client, Project } from "@/types/database";

export default async function AdminClientsPage() {
  await requireAdmin();
  const service = createServiceRoleClient();

  const [{ data: clientsData }, { data: projectsData }] = await Promise.all([
    service.from("clients").select("*").order("created_at", { ascending: false }),
    service.from("projects").select("id, client_id, status"),
  ]);

  const clients = (clientsData ?? []) as Client[];
  const projects = (projectsData ?? []) as Pick<Project, "id" | "client_id" | "status">[];

  const projectCountByClient = new Map<string, number>();
  for (const project of projects) {
    projectCountByClient.set(project.client_id, (projectCountByClient.get(project.client_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-paper">Clientes</h1>
        <Link
          href="/admin/clientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink transition hover:bg-lime-deep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-hairline p-8 text-center">
          <p className="text-sm text-paper-dim">Todavía no has dado de alta ningún cliente.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clientes/${client.id}`}
              className="rounded-card border border-hairline bg-ink-raised p-5 transition hover:border-lime"
            >
              <p className="font-medium text-paper">{client.company ?? client.full_name}</p>
              {client.company && <p className="text-sm text-paper-dim">{client.full_name}</p>}
              <p className="mt-1 font-ledger text-xs text-paper-dim">{client.email}</p>
              <p className="mt-3 font-ledger text-xs text-lime">
                {projectCountByClient.get(client.id) ?? 0} proyecto(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
