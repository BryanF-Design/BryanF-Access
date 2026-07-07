import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency } from "@/lib/format";
import type { Payment, Project } from "@/types/database";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-display text-2xl font-semibold text-paper">Todavía no hay proyectos</p>
        <p className="mt-3 max-w-sm text-sm text-paper-dim">
          En cuanto tu asesor active un proyecto en Bitácora, aparecerá aquí.
        </p>
      </div>
    );
  }

  if (projects.length === 1) {
    redirect(`/proyecto/${projects[0].id}`);
  }

  const projectIds = projects.map((p) => p.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .in("project_id", projectIds)
    .returns<Payment[]>();

  const paidByProject = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount),
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-paper">Tus proyectos</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const paid = paidByProject.get(project.id) ?? 0;
          const pct = project.total_price > 0 ? Math.min(100, (paid / project.total_price) * 100) : 0;

          return (
            <Link
              key={project.id}
              href={`/proyecto/${project.id}`}
              className="group rounded-card border border-hairline bg-ink-raised p-6 transition hover:border-lime"
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
                {formatCurrency(paid, project.currency)} de {formatCurrency(project.total_price, project.currency)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
