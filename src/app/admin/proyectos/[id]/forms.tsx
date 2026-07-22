"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createDeliverable,
  createMilestone,
  createPayment,
  createProjectEvent,
  createProjectResource,
  updateProject,
  type ActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldStyles, fieldStylesSm, labelStyles } from "@/components/ui/field";
import type { Milestone, Project } from "@/types/database";

const initialState: ActionState = { ok: true, message: "" };

function ErrorMessage({ state }: { state: ActionState }) {
  if (state.ok || !state.message) return null;
  return (
    <p role="alert" className="text-sm text-rose">
      {state.message}
    </p>
  );
}

/** Clears the form after a successful submit, but leaves it filled in on the
 * first render and on validation errors so the admin doesn't lose their input. */
function useResetOnSuccess(state: ActionState, formRef: React.RefObject<HTMLFormElement | null>) {
  const submitted = useRef(false);
  useEffect(() => {
    if (submitted.current && state.ok) {
      formRef.current?.reset();
    }
    submitted.current = true;
  }, [state, formRef]);
}

export function EditProjectForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(updateProject, initialState);

  return (
    <Card variant="surface" padding="lg">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="projectId" value={project.id} />

        <div>
          <label htmlFor="name" className={labelStyles}>
            Nombre del proyecto
          </label>
          <input id="name" name="name" required defaultValue={project.name} className={fieldStyles} />
        </div>

        <div>
          <label htmlFor="summary" className={labelStyles}>
            Resumen
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={2}
            defaultValue={project.summary ?? ""}
            className={fieldStyles}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="totalPrice" className={labelStyles}>
              Precio total
            </label>
            <input
              id="totalPrice"
              name="totalPrice"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={project.total_price}
              className={`${fieldStyles} font-ledger`}
            />
          </div>
          <div>
            <label htmlFor="currency" className={labelStyles}>
              Moneda
            </label>
            <input
              id="currency"
              name="currency"
              required
              defaultValue={project.currency}
              className={`${fieldStyles} font-ledger`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={labelStyles}>
              Inicio
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={project.start_date ?? ""}
              className={fieldStyles}
            />
          </div>
          <div>
            <label htmlFor="targetEndDate" className={labelStyles}>
              Meta de entrega
            </label>
            <input
              id="targetEndDate"
              name="targetEndDate"
              type="date"
              defaultValue={project.target_end_date ?? ""}
              className={fieldStyles}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
          {state.ok && state.message && <span className="text-sm text-lime">{state.message}</span>}
          <ErrorMessage state={state} />
        </div>
      </form>
    </Card>
  );
}

export function NewMilestoneForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createMilestone, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input name="title" required placeholder="Título de la etapa" className={fieldStylesSm} />
        <input name="description" placeholder="Descripción (opcional)" className={fieldStylesSm} />
        <input name="dueDate" type="date" className={fieldStylesSm} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Agregando…" : "Agregar etapa"}
        </Button>
        <div className="sm:col-span-4">
          <ErrorMessage state={state} />
        </div>
      </form>
    </Card>
  );
}

export function NewDeliverableForm({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  const [state, formAction, pending] = useActionState(createDeliverable, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form ref={formRef} action={formAction} className="grid gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Nombre del entregable" className={fieldStylesSm} />
          <input name="version" placeholder="Versión (opcional, ej. v1)" className={fieldStylesSm} />
        </div>
        <input name="description" placeholder="Descripción (opcional)" className={fieldStylesSm} />
        <div className="grid gap-3 sm:grid-cols-3">
          <select name="milestoneId" defaultValue="" className={fieldStylesSm}>
            <option value="">Sin etapa</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="en_progreso" className={fieldStylesSm}>
            <option value="en_progreso">En progreso</option>
            <option value="en_revision">En revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="entregado">Entregado</option>
          </select>
          <input
            name="file"
            type="file"
            className={`${fieldStylesSm} file:mr-3 file:rounded-md file:border-0 file:bg-hairline file:px-3 file:py-1 file:text-paper`}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="justify-self-start">
          {pending ? "Guardando…" : "Agregar entregable"}
        </Button>
        <ErrorMessage state={state} />
      </form>
    </Card>
  );
}

export function NewResourceForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createProjectResource, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form ref={formRef} action={formAction} className="grid gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="resource-title" className={labelStyles}>
              Nombre del recurso
            </label>
            <input
              id="resource-title"
              name="title"
              required
              placeholder="Carpeta de Drive"
              className={fieldStylesSm}
            />
          </div>
          <div>
            <label htmlFor="resource-url" className={labelStyles}>
              URL
            </label>
            <input
              id="resource-url"
              name="url"
              type="url"
              required
              placeholder="https://..."
              className={fieldStylesSm}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <div>
            <label htmlFor="resource-type" className={labelStyles}>
              Tipo
            </label>
            <select id="resource-type" name="resourceType" defaultValue="drive" className={fieldStylesSm}>
              <option value="drive">Drive</option>
              <option value="url">Enlace</option>
              <option value="tutorial">Tutorial</option>
              <option value="credential">Acceso</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="resource-description" className={labelStyles}>
              Descripcion
            </label>
            <input
              id="resource-description"
              name="description"
              placeholder="Uso interno para el cliente"
              className={fieldStylesSm}
            />
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="justify-self-start">
          {pending ? "Guardando..." : "Agregar recurso"}
        </Button>
        <ErrorMessage state={state} />
      </form>
    </Card>
  );
}

export function NewProjectEventForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createProjectEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form ref={formRef} action={formAction} className="grid gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div>
            <label htmlFor="event-title" className={labelStyles}>
              Cambio o contenido
            </label>
            <input
              id="event-title"
              name="title"
              required
              placeholder="Se actualizo la propuesta de contenidos"
              className={fieldStylesSm}
            />
          </div>
          <div>
            <label htmlFor="event-date" className={labelStyles}>
              Fecha
            </label>
            <input
              id="event-date"
              name="eventDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={fieldStylesSm}
            />
          </div>
          <div>
            <label htmlFor="event-type" className={labelStyles}>
              Tipo
            </label>
            <select id="event-type" name="eventType" defaultValue="content" className={fieldStylesSm}>
              <option value="content">Contenido</option>
              <option value="review">Revision</option>
              <option value="meeting">Reunion</option>
              <option value="project">Proyecto</option>
              <option value="milestone">Etapa</option>
              <option value="deliverable">Entregable</option>
              <option value="resource">Recurso</option>
              <option value="payment">Pago</option>
              <option value="other">Nota</option>
            </select>
          </div>
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Detalle breve para que todos sepan que se movio o que deben revisar."
          className={fieldStylesSm}
        />
        <div className="grid gap-3 sm:grid-cols-[220px_auto]">
          <select name="visibility" defaultValue="client" className={fieldStylesSm}>
            <option value="client">Visible para cliente</option>
            <option value="admin">Solo interno</option>
          </select>
          <Button type="submit" variant="secondary" size="sm" disabled={pending} className="justify-self-start">
            {pending ? "Agregando..." : "Agregar al calendario"}
          </Button>
        </div>
        {state.ok && state.message && <p className="text-sm text-lime">{state.message}</p>}
        <ErrorMessage state={state} />
      </form>
    </Card>
  );
}

export function NewPaymentForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createPayment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 sm:grid-cols-[auto_auto_1fr_auto_auto]"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="Monto"
          className={fieldStylesSm}
        />
        <input
          name="paidAt"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={fieldStylesSm}
        />
        <input name="method" placeholder="Método (opcional)" className={fieldStylesSm} />
        <input name="note" placeholder="Nota (opcional)" className={fieldStylesSm} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Agregando…" : "Agregar pago"}
        </Button>
        <div className="sm:col-span-5">
          <ErrorMessage state={state} />
        </div>
      </form>
    </Card>
  );
}
