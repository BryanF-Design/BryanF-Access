import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Client, Payment, Project } from "@/types/database";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Todavía no hay proyectos"
        description="En cuanto tu asesor active un proyecto en Bitácora, aparecerá aquí."
        className="mt-6"
      />
    );
  }

  if (projects.length === 1) {
    redirect(`/proyecto/${projects[0].id}`);
  }

  const projectIds = projects.map((p) => p.id);
  const [{ data: payments }, { data: client }] = await Promise.all([
    supabase.from("payments").select("*").in("project_id", projectIds).returns<Payment[]>(),
    supabase.from("clients").select("*").maybeSingle<Client>(),
  ]);

  const paidByProject = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Bitácora"
        title="Tus proyectos"
        description="Selecciona un proyecto para ver su cronograma, entregables y saldo."
      />

      {client && (
        <Card variant="surface" padding="lg" className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold text-paper">
                {client.company ?? client.full_name}
              </p>
              <p className="mt-1 text-sm text-paper-dim">
                {[client.industry, client.country].filter(Boolean).join(" - ") || client.email}
              </p>
            </div>
            {client.drive_url && (
              <a
                href={client.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center rounded-lg border border-hairline px-4 py-2 text-sm text-paper transition hover:border-lime hover:text-lime"
              >
                Abrir Drive principal
              </a>
            )}
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const paid = paidByProject.get(project.id) ?? 0;
          const pct = project.total_price > 0 ? Math.min(100, (paid / project.total_price) * 100) : 0;

          return (
            <Link key={project.id} href={`/proyecto/${project.id}`} className="group block">
              <Card
                variant="surface"
                padding="lg"
                className="h-full transition group-hover:border-lime group-hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-paper group-hover:text-lime">
                    {project.name}
                  </h2>
                  <StatusPill status={project.status} />
                </div>
                <p className="mt-2 text-sm text-paper-dim">{project.summary}</p>
                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 font-ledger text-xs text-paper-dim">
                  {formatCurrency(paid, project.currency)} de{" "}
                  {formatCurrency(project.total_price, project.currency)}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
