import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Payment, Project } from "@/types/database";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const service = createServiceRoleClient();

  const { data: clientData } = await service.from("clients").select("*").eq("id", id).maybeSingle();
  const client = clientData as Client | null;
  if (!client) notFound();

  const { data: projectsData } = await service
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  const projects = (projectsData ?? []) as Project[];

  const projectIds = projects.map((p) => p.id);
  const { data: paymentsData } =
    projectIds.length > 0
      ? await service.from("payments").select("*").in("project_id", projectIds)
      : { data: [] };
  const payments = (paymentsData ?? []) as Payment[];

  const paidByProject = new Map<string, number>();
  for (const payment of payments) {
    paidByProject.set(payment.project_id, (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount));
  }

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">
            {client.company ?? client.full_name}
          </h1>
          {client.company && <p className="mt-1 text-paper-dim">{client.full_name}</p>}
          <p className="mt-2 font-ledger text-sm text-paper-dim">{client.email}</p>
          <p className="mt-1 font-ledger text-xs text-paper-dim">
            Cliente desde {formatDate(client.created_at)}
          </p>
        </div>
        <Link
          href={`/admin/proyectos/nuevo?cliente=${client.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink transition hover:bg-lime-deep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo proyecto
        </Link>
      </div>

      <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-paper">Proyectos</h2>

      {projects.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline p-8 text-center">
          <p className="text-sm text-paper-dim">Este cliente todavía no tiene proyectos.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => {
            const paid = paidByProject.get(project.id) ?? 0;
            const remaining = Math.max(0, Number(project.total_price) - paid);

            return (
              <Link
                key={project.id}
                href={`/admin/proyectos/${project.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-ink-raised p-5 transition hover:border-lime"
              >
                <div>
                  <p className="font-medium text-paper">{project.name}</p>
                  <p className="mt-1 font-ledger text-xs text-paper-dim">
                    Resta {formatCurrency(remaining, project.currency)} de{" "}
                    {formatCurrency(Number(project.total_price), project.currency)}
                  </p>
                </div>
                <StatusPill status={project.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
