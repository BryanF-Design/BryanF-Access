import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { Ledger } from "@/components/ledger";
import { Timeline } from "@/components/timeline";
import { Deliverables } from "@/components/deliverables";
import { ProjectResources } from "@/components/project-resources";
import { Tutorials } from "@/components/tutorials";
import { formatDate } from "@/lib/format";
import type { Deliverable, Milestone, Payment, Project, ProjectResource } from "@/types/database";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: allProjects }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle<Project>(),
    supabase.from("projects").select("id").returns<Pick<Project, "id">[]>(),
  ]);

  // RLS means this is null both when the project doesn't exist and when it
  // belongs to someone else — the client can't tell the difference either way.
  if (!project) notFound();

  const [{ data: payments }, { data: milestones }, { data: deliverables }, { data: resources }] = await Promise.all([
    supabase.from("payments").select("*").eq("project_id", id).returns<Payment[]>(),
    supabase.from("milestones").select("*").eq("project_id", id).returns<Milestone[]>(),
    supabase.from("deliverables").select("*").eq("project_id", id).returns<Deliverable[]>(),
    supabase
      .from("project_resources")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .returns<ProjectResource[]>(),
  ]);

  const paidTotal = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const showBackLink = (allProjects?.length ?? 0) > 1;

  return (
    <div>
      {showBackLink && (
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Todos tus proyectos
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">{project.name}</h1>
          {project.summary && <p className="mt-2 max-w-xl text-paper-dim">{project.summary}</p>}
          <p className="mt-3 font-ledger text-xs text-paper-dim">
            Inicio: {formatDate(project.start_date)} · Meta de entrega:{" "}
            {formatDate(project.target_end_date)}
          </p>
        </div>
        <StatusPill status={project.status} />
      </div>

      <div className="mt-8">
        <Ledger
          projectName={project.name}
          totalPrice={Number(project.total_price)}
          currency={project.currency}
          paidTotal={paidTotal}
        />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section>
          <h2 className="mb-5 font-display text-lg font-semibold text-paper">Cronograma</h2>
          <Timeline milestones={milestones ?? []} />
        </section>

        <section>
          <h2 className="mb-5 font-display text-lg font-semibold text-paper">Entregables</h2>
          <Deliverables deliverables={deliverables ?? []} />
        </section>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section>
          <h2 className="mb-5 font-display text-lg font-semibold text-paper">Recursos</h2>
          <ProjectResources resources={resources ?? []} />
        </section>

        <section>
          <h2 className="mb-5 font-display text-lg font-semibold text-paper">Tutoriales</h2>
          <Tutorials />
        </section>
      </div>
    </div>
  );
}
