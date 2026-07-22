import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { Ledger } from "@/components/ledger";
import { Timeline } from "@/components/timeline";
import { Deliverables } from "@/components/deliverables";
import { ProjectChangeCalendar } from "@/components/project-change-calendar";
import { ProjectResources } from "@/components/project-resources";
import { Tutorials } from "@/components/tutorials";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatDate, formatShortDate } from "@/lib/format";
import type { Client, Deliverable, Milestone, Payment, Project, ProjectEvent, ProjectResource } from "@/types/database";

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

  const [
    { data: client },
    { data: payments },
    { data: milestones },
    { data: deliverables },
    { data: resources },
    { data: events },
  ] = await Promise.all([
    supabase.from("clients").select("*").maybeSingle<Client>(),
    supabase.from("payments").select("*").eq("project_id", id).returns<Payment[]>(),
    supabase.from("milestones").select("*").eq("project_id", id).returns<Milestone[]>(),
    supabase.from("deliverables").select("*").eq("project_id", id).returns<Deliverable[]>(),
    supabase
      .from("project_resources")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .returns<ProjectResource[]>(),
    supabase
      .from("project_events")
      .select("*")
      .eq("project_id", id)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ProjectEvent[]>(),
  ]);

  const paidTotal = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPrice = Number(project.total_price);
  const remaining = Math.max(0, totalPrice - paidTotal);
  const pct = totalPrice > 0 ? Math.min(100, Math.round((paidTotal / totalPrice) * 100)) : 0;
  const showBackLink = (allProjects?.length ?? 0) > 1;
  const visibleResources = (resources ?? []).filter((resource) => resource.resource_type !== "credential");

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
          <p className="font-ledger text-xs uppercase tracking-[0.24em] text-lime">Proyecto</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-paper">{project.name}</h1>
          {project.summary && <p className="mt-2 max-w-xl text-paper-dim">{project.summary}</p>}
          <p className="mt-3 font-ledger text-xs text-paper-dim">
            Inicio: {formatDate(project.start_date)} · Meta de entrega:{" "}
            {formatDate(project.target_end_date)}
          </p>
        </div>
        <StatusPill status={project.status} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Abonado"
          value={formatCurrency(paidTotal, project.currency)}
          accent="lime"
        />
        <StatCard
          icon={PiggyBank}
          label="Resta por liquidar"
          value={formatCurrency(remaining, project.currency)}
          accent="amber"
        />
        <StatCard icon={TrendingUp} label="Progreso" value={`${pct}%`} accent="sky" />
        <StatCard
          icon={CalendarClock}
          label="Meta de entrega"
          value={formatShortDate(project.target_end_date)}
          accent="lime"
        />
      </div>

      <div className="mt-8">
        <Ledger
          projectName={project.name}
          totalPrice={totalPrice}
          currency={project.currency}
          paidTotal={paidTotal}
        />
      </div>

      {client && (
        <Card variant="surface" padding="lg" className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-paper">Base del cliente</h2>
              <p className="mt-1 text-sm text-paper-dim">
                {client.company ?? client.full_name}
                {client.industry ? ` - ${client.industry}` : ""}
                {client.country ? ` - ${client.country}` : ""}
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

      <section className="mt-12">
        <h2 className="mb-5 font-display text-lg font-semibold text-paper">Calendario de cambios</h2>
        <ProjectChangeCalendar events={events ?? []} />
      </section>

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
          <ProjectResources resources={visibleResources} />
        </section>

        <section>
          <h2 className="mb-5 font-display text-lg font-semibold text-paper">Tutoriales</h2>
          <Tutorials />
        </section>
      </div>
    </div>
  );
}
