"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createDeliverable,
  createMilestone,
  createPayment,
  createProjectResource,
  updateProject,
  type ActionState,
} from "@/app/admin/actions";
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
    <form action={formAction} className="grid gap-4 rounded-card border border-hairline bg-ink-raised p-6">
      <input type="hidden" name="projectId" value={project.id} />

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-paper">
          Nombre del proyecto
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={project.name}
          className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
        />
      </div>

      <div>
        <label htmlFor="summary" className="mb-2 block text-sm font-medium text-paper">
          Resumen
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={project.summary ?? ""}
          className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="totalPrice" className="mb-2 block text-sm font-medium text-paper">
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
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 font-ledger text-paper outline-none focus:border-lime"
          />
        </div>
        <div>
          <label htmlFor="currency" className="mb-2 block text-sm font-medium text-paper">
            Moneda
          </label>
          <input
            id="currency"
            name="currency"
            required
            defaultValue={project.currency}
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 font-ledger text-paper outline-none focus:border-lime"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-paper">
            Inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={project.start_date ?? ""}
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>
        <div>
          <label htmlFor="targetEndDate" className="mb-2 block text-sm font-medium text-paper">
            Meta de entrega
          </label>
          <input
            id="targetEndDate"
            name="targetEndDate"
            type="date"
            defaultValue={project.target_end_date ?? ""}
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state.ok && state.message && <span className="text-sm text-lime">{state.message}</span>}
        <ErrorMessage state={state} />
      </div>
    </form>
  );
}

export function NewMilestoneForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createMilestone, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useResetOnSuccess(state, formRef);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-card border border-dashed border-hairline p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        required
        placeholder="Título de la etapa"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <input
        name="description"
        placeholder="Descripción (opcional)"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <input
        name="dueDate"
        type="date"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-hairline px-4 py-2 text-sm text-paper transition hover:border-lime hover:text-lime disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar etapa"}
      </button>
      <div className="sm:col-span-4">
        <ErrorMessage state={state} />
      </div>
    </form>
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
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-card border border-dashed border-hairline p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nombre del entregable"
          className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
        />
        <input
          name="version"
          placeholder="Versión (opcional, ej. v1)"
          className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
        />
      </div>
      <input
        name="description"
        placeholder="Descripción (opcional)"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          name="milestoneId"
          defaultValue=""
          className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
        >
          <option value="">Sin etapa</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="en_progreso"
          className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
        >
          <option value="en_progreso">En progreso</option>
          <option value="en_revision">En revisión</option>
          <option value="aprobado">Aprobado</option>
          <option value="entregado">Entregado</option>
        </select>
        <input
          name="file"
          type="file"
          className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper file:mr-3 file:rounded-md file:border-0 file:bg-hairline file:px-3 file:py-1 file:text-paper"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-lg border border-hairline px-4 py-2 text-sm text-paper transition hover:border-lime hover:text-lime disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar entregable"}
      </button>
      <ErrorMessage state={state} />
    </form>
  );
}

export function NewResourceForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createProjectResource, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-card border border-dashed border-hairline p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="resource-title" className="mb-2 block text-sm font-medium text-paper">
            Nombre del recurso
          </label>
          <input
            id="resource-title"
            name="title"
            required
            placeholder="Carpeta de Drive"
            className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
          />
        </div>
        <div>
          <label htmlFor="resource-url" className="mb-2 block text-sm font-medium text-paper">
            URL
          </label>
          <input
            id="resource-url"
            name="url"
            type="url"
            required
            placeholder="https://..."
            className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor="resource-type" className="mb-2 block text-sm font-medium text-paper">
            Tipo
          </label>
          <select
            id="resource-type"
            name="resourceType"
            defaultValue="drive"
            className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
          >
            <option value="drive">Drive</option>
            <option value="url">Enlace</option>
            <option value="tutorial">Tutorial</option>
            <option value="credential">Acceso</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="resource-description" className="mb-2 block text-sm font-medium text-paper">
            Descripcion
          </label>
          <input
            id="resource-description"
            name="description"
            placeholder="Uso interno para el cliente"
            className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-lg border border-hairline px-4 py-2 text-sm text-paper transition hover:border-lime hover:text-lime disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar recurso"}
      </button>
      <ErrorMessage state={state} />
    </form>
  );
}

export function NewPaymentForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createPayment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-card border border-dashed border-hairline p-4 sm:grid-cols-[auto_auto_1fr_auto_auto]"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        required
        placeholder="Monto"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <input
        name="paidAt"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <input
        name="method"
        placeholder="Método (opcional)"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <input
        name="note"
        placeholder="Nota (opcional)"
        className="rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-lime"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-hairline px-4 py-2 text-sm text-paper transition hover:border-lime hover:text-lime disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar pago"}
      </button>
      <div className="sm:col-span-5">
        <ErrorMessage state={state} />
      </div>
    </form>
  );
}
