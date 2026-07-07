"use client";

import { useActionState } from "react";
import { createProject, type ActionState } from "@/app/admin/actions";
import type { Client } from "@/types/database";

const initialState: ActionState = { ok: true, message: "" };

export function NewProjectForm({
  clients,
  preselectedClient,
}: {
  clients: Pick<Client, "id" | "full_name" | "company">[];
  preselectedClient: Pick<Client, "id" | "full_name" | "company"> | null;
}) {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-card border border-hairline bg-ink-raised p-6">
      {preselectedClient ? (
        <div>
          <p className="mb-2 text-sm font-medium text-paper">Cliente</p>
          <p className="rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper">
            {preselectedClient.company ?? preselectedClient.full_name}
          </p>
          <input type="hidden" name="clientId" value={preselectedClient.id} />
        </div>
      ) : (
        <div>
          <label htmlFor="clientId" className="mb-2 block text-sm font-medium text-paper">
            Cliente
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          >
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company ?? client.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-paper">
          Nombre del proyecto
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Rediseño de marca"
          className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
        />
      </div>

      <div>
        <label htmlFor="summary" className="mb-2 block text-sm font-medium text-paper">
          Resumen <span className="text-paper-dim">(opcional)</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          placeholder="Identidad visual, empaques y sitio web."
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
            placeholder="68000"
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
            defaultValue="MXN"
            required
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 font-ledger text-paper outline-none focus:border-lime"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-paper">
            Inicio <span className="text-paper-dim">(opcional)</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>
        <div>
          <label htmlFor="targetEndDate" className="mb-2 block text-sm font-medium text-paper">
            Meta de entrega <span className="text-paper-dim">(opcional)</span>
          </label>
          <input
            id="targetEndDate"
            name="targetEndDate"
            type="date"
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-lime px-4 py-2.5 font-medium text-ink transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear proyecto"}
      </button>

      {!state.ok && state.message && (
        <p role="alert" className="text-center text-sm text-rose">
          {state.message}
        </p>
      )}
    </form>
  );
}
