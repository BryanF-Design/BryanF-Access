import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Link2, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Ledger } from "@/components/ledger";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { ProjectChangeCalendar } from "@/components/project-change-calendar";
import { formatShortDate } from "@/lib/format";
import {
  deleteDeliverable,
  deleteMilestone,
  deletePayment,
  deleteProjectResource,
  moveMilestone,
  updateDeliverableStatus,
  updateMilestoneStatus,
  updateProjectStatus,
} from "@/app/admin/actions";
import {
  EditProjectForm,
  NewDeliverableForm,
  NewMilestoneForm,
  NewPaymentForm,
  NewProjectEventForm,
  NewResourceForm,
} from "./forms";
import type {
  Client,
  Deliverable,
  Milestone,
  Payment,
  Project,
  ProjectEvent,
  ProjectResource,
} from "@/types/database";

const PROJECT_STATUS_OPTIONS = [
  { value: "planeacion", label: "En planeación" },
  { value: "en_progreso", label: "En progreso" },
  { value: "en_revision", label: "En revisión" },
  { value: "pausado", label: "Pausado" },
  { value: "completado", label: "Completado" },
];

const MILESTONE_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completado", label: "Completado" },
];

const DELIVERABLE_STATUS_OPTIONS = [
  { value: "en_progreso", label: "En progreso" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "entregado", label: "Entregado" },
];

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const service = createServiceRoleClient();

  const { data: projectData } = await service.from("projects").select("*").eq("id", id).maybeSingle();
  const project = projectData as Project | null;
  if (!project) notFound();

  const [
    { data: clientData },
    { data: milestonesData },
    { data: deliverablesData },
    { data: paymentsData },
    { data: resourcesData },
    { data: eventsData },
  ] = await Promise.all([
    service.from("clients").select("*").eq("id", project.client_id).maybeSingle(),
    service.from("milestones").select("*").eq("project_id", id).order("position", { ascending: true }),
    service.from("deliverables").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    service.from("payments").select("*").eq("project_id", id).order("paid_at", { ascending: false }),
    service.from("project_resources").select("*").eq("project_id", id).order("position", { ascending: true }),
    service
      .from("project_events")
      .select("*")
      .eq("project_id", id)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const client = clientData as Client | null;
  const milestones = (milestonesData ?? []) as Milestone[];
  const deliverables = (deliverablesData ?? []) as Deliverable[];
  const payments = (paymentsData ?? []) as Payment[];
  const resources = (resourcesData ?? []) as ProjectResource[];
  const events = (eventsData ?? []) as ProjectEvent[];
  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      {client && (
        <Link
          href={`/admin/clientes/${client.id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {client.company ?? client.full_name}
        </Link>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-paper">{project.name}</h1>
        <form action={updateProjectStatus}>
          <input type="hidden" name="projectId" value={project.id} />
          <AutoSubmitSelect name="status" defaultValue={project.status} options={PROJECT_STATUS_OPTIONS} />
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Ledger
          projectName={project.name}
          totalPrice={Number(project.total_price)}
          currency={project.currency}
          paidTotal={paidTotal}
        />
        <EditProjectForm project={project} />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-paper">Calendario de cambios</h2>
            <p className="mt-1 text-sm text-paper-dim">
              Bitacora compartida para contenidos, revisiones y cambios importantes.
            </p>
          </div>
        </div>
        <ProjectChangeCalendar events={events} showVisibility />
        <div className="mt-4">
          <NewProjectEventForm projectId={project.id} />
        </div>
      </section>

      {/* Pagos */}
      <section className="mt-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">Pagos</h2>
        <div className="mb-4 grid gap-2">
          {payments.length === 0 ? (
            <p className="text-sm text-paper-dim">Todavía no hay pagos registrados.</p>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-ink-raised px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-ledger text-sm text-lime">
                    {formatShortDate(payment.paid_at)}
                  </span>
                  <span className="font-ledger text-sm text-paper">
                    {new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: project.currency,
                    }).format(Number(payment.amount))}
                  </span>
                  {payment.method && <span className="text-sm text-paper-dim">{payment.method}</span>}
                  {payment.note && <span className="text-sm text-paper-dim">— {payment.note}</span>}
                </div>
                <form action={deletePayment}>
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    type="submit"
                    aria-label="Eliminar pago"
                    className="text-paper-dim transition hover:text-rose"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
        <NewPaymentForm projectId={project.id} />
      </section>

      {/* Cronograma */}
      <section className="mt-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">Cronograma</h2>
        <div className="mb-4 grid gap-2">
          {milestones.length === 0 ? (
            <p className="text-sm text-paper-dim">Todavía no hay etapas.</p>
          ) : (
            milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-ink-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-paper">{milestone.title}</p>
                  {milestone.description && (
                    <p className="text-sm text-paper-dim">{milestone.description}</p>
                  )}
                  <p className="font-ledger text-xs text-paper-dim">
                    {formatShortDate(milestone.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={moveMilestone}>
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="Mover arriba"
                      className="rounded border border-hairline px-2 py-1 text-paper-dim transition hover:border-lime hover:text-lime disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveMilestone}>
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === milestones.length - 1}
                      aria-label="Mover abajo"
                      className="rounded border border-hairline px-2 py-1 text-paper-dim transition hover:border-lime hover:text-lime disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={updateMilestoneStatus}>
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={milestone.status}
                      options={MILESTONE_STATUS_OPTIONS}
                    />
                  </form>
                  <form action={deleteMilestone}>
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button
                      type="submit"
                      aria-label="Eliminar etapa"
                      className="text-paper-dim transition hover:text-rose"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
        <NewMilestoneForm projectId={project.id} />
      </section>

      {/* Recursos */}
      <section className="mt-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">Recursos</h2>
        <div className="mb-4 grid gap-2">
          {resources.length === 0 ? (
            <p className="text-sm text-paper-dim">Todavia no hay recursos del proyecto.</p>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-ink-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-paper">
                    <Link2 className="h-4 w-4 text-lime" aria-hidden="true" />
                    {resource.title}
                  </p>
                  <p className="font-ledger text-xs uppercase text-paper-dim">{resource.resource_type}</p>
                  {resource.description && (
                    <p className="mt-1 text-sm text-paper-dim">{resource.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper-dim transition hover:text-lime"
                    aria-label="Abrir recurso"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <form action={deleteProjectResource}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button
                      type="submit"
                      aria-label="Eliminar recurso"
                      className="text-paper-dim transition hover:text-rose"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
        <NewResourceForm projectId={project.id} />
      </section>

      {/* Entregables */}
      <section className="mt-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">Entregables</h2>
        <div className="mb-4 grid gap-2">
          {deliverables.length === 0 ? (
            <p className="text-sm text-paper-dim">Todavía no hay entregables.</p>
          ) : (
            deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-ink-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-paper">
                    {deliverable.name}
                    {deliverable.version && (
                      <span className="ml-2 font-ledger text-xs text-paper-dim">
                        {deliverable.version}
                      </span>
                    )}
                  </p>
                  {deliverable.description && (
                    <p className="text-sm text-paper-dim">{deliverable.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {deliverable.storage_path && (
                    <a
                      href={`/api/admin/deliverables/${deliverable.id}/download`}
                      className="text-paper-dim transition hover:text-lime"
                      aria-label="Descargar"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  <form action={updateDeliverableStatus}>
                    <input type="hidden" name="deliverableId" value={deliverable.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={deliverable.status}
                      options={DELIVERABLE_STATUS_OPTIONS}
                    />
                  </form>
                  <form action={deleteDeliverable}>
                    <input type="hidden" name="deliverableId" value={deliverable.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button
                      type="submit"
                      aria-label="Eliminar entregable"
                      className="text-paper-dim transition hover:text-rose"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
        <NewDeliverableForm projectId={project.id} milestones={milestones} />
      </section>
    </div>
  );
}
