import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ClientsDirectory, type ClientDirectoryEntry } from "./clients-directory";
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
    projectCountByClient.set(
      project.client_id,
      (projectCountByClient.get(project.client_id) ?? 0) + 1,
    );
  }

  const directory: ClientDirectoryEntry[] = clients.map((client) => ({
    id: client.id,
    name: client.company ?? client.full_name,
    fullName: client.full_name,
    email: client.email,
    industry: client.industry,
    country: client.country,
    phone: client.phone,
    projectCount: projectCountByClient.get(client.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Directorio de clientes y sus proyectos."
        actions={
          <Link href="/admin/clientes/nuevo">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cliente
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        <ClientsDirectory clients={directory} />
      </div>
    </div>
  );
}
