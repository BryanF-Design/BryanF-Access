"use client";

import { useActionState } from "react";
import { createProject, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldStyles, labelStyles } from "@/components/ui/field";
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
    <Card variant="surface" padding="lg" className="mt-6">
      <form action={formAction} className="space-y-5">
        {preselectedClient ? (
          <div>
            <p className={labelStyles}>Cliente</p>
            <p className="rounded-lg border border-hairline bg-ink-elevated px-4 py-2.5 text-paper">
              {preselectedClient.company ?? preselectedClient.full_name}
            </p>
            <input type="hidden" name="clientId" value={preselectedClient.id} />
          </div>
        ) : (
          <div>
            <label htmlFor="clientId" className={labelStyles}>
              Cliente
            </label>
            <select id="clientId" name="clientId" required defaultValue="" className={fieldStyles}>
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
          <label htmlFor="name" className={labelStyles}>
            Nombre del proyecto
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Rediseño de marca"
            className={fieldStyles}
          />
        </div>

        <div>
          <label htmlFor="summary" className={labelStyles}>
            Resumen <span className="text-paper-dim">(opcional)</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={2}
            placeholder="Identidad visual, empaques y sitio web."
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
              placeholder="68000"
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
              defaultValue="MXN"
              required
              className={`${fieldStyles} font-ledger`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={labelStyles}>
              Inicio <span className="text-paper-dim">(opcional)</span>
            </label>
            <input id="startDate" name="startDate" type="date" className={fieldStyles} />
          </div>
          <div>
            <label htmlFor="targetEndDate" className={labelStyles}>
              Meta de entrega <span className="text-paper-dim">(opcional)</span>
            </label>
            <input id="targetEndDate" name="targetEndDate" type="date" className={fieldStyles} />
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
          {pending ? "Creando…" : "Crear proyecto"}
        </Button>

        {!state.ok && state.message && (
          <p role="alert" className="text-center text-sm text-rose">
            {state.message}
          </p>
        )}
      </form>
    </Card>
  );
}
