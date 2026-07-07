import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Client, Payment, Project } from "@/types/database";

export default async function AdminDashboard() {
  await requireAdmin();
  const service = createServiceRoleClient();

  const [{ data: projectsData }, { data: clientsData }, { data: paymentsData }] = await Promise.all([
    service.from("projects").select("*").order("target_end_date", { ascending: true }),
    service.from("clients").select("*"),
    service.from("payments").select("*"),
  ]);

  const projects = (projectsData ?? []) as Project[];
  const clients = (clientsData ?? []) as Client[];
  const payments = (paymentsData ?? []) as Payment[];

  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const paidByProject = new Map<string, number>();
  for (const payment of payments) {
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount),
    );
  }

  const activeProjects = projects.filter(
    (p) => p.status !== "completado" && p.status !== "pausado",
  );
  const totalPendiente = activeProjects.reduce((sum, p) => {
    const paid = paidByProject.get(p.id) ?? 0;
    return sum + Math.max(0, Number(p.total_price) - paid);
  }, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-paper">Panel</h1>
        <Link
          href="/admin/clientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink transition hover:bg-lime-deep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-hairline bg-ink-raised p-5">
          <p className="text-sm text-paper-dim">Clientes</p>
          <p className="mt-1 font-display text-2xl font-semibold text-paper">{clients.length}</p>
        </div>
        <div className="rounded-card border border-hairline bg-ink-raised p-5">
          <p className="text-sm text-paper-dim">Proyectos activos</p>
          <p className="mt-1 font-display text-2xl font-semibold text-paper">
            {activeProjects.length}
          </p>
        </div>
        <div className="rounded-card border border-hairline bg-ink-raised p-5">
          <p className="text-sm text-paper-dim">Pendiente de cobro</p>
          <p className="mt-1 font-ledger text-2xl font-semibold text-lime">
            {formatCurrency(totalPendiente, "MXN")}
          </p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-paper">
        Proyectos por entrega
      </h2>

      {projects.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline p-8 text-center">
          <p className="text-sm text-paper-dim">
            Todavía no has dado de alta ningún proyecto.{" "}
            <Link href="/admin/clientes/nuevo" className="text-lime hover:text-lime-deep">
              Empieza con un cliente nuevo
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-hairline">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-paper-dim">
                <th className="px-4 py-3 font-normal">Proyecto</th>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Estatus</th>
                <th className="px-4 py-3 font-normal">Meta de entrega</th>
                <th className="px-4 py-3 text-right font-normal">Resta por cobrar</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const paid = paidByProject.get(project.id) ?? 0;
                const remaining = Math.max(0, Number(project.total_price) - paid);
                const client = clientsById.get(project.client_id);

                return (
                  <tr key={project.id} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/proyectos/${project.id}`}
                        className="font-medium text-paper hover:text-lime"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-paper-dim">
                      {client ? (
                        <Link href={`/admin/clientes/${client.id}`} className="hover:text-lime">
                          {client.company ?? client.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={project.status} />
                    </td>
                    <td className="px-4 py-3 font-ledger text-paper-dim">
                      {formatShortDate(project.target_end_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-ledger text-paper">
                      {formatCurrency(remaining, project.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
