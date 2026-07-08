"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { createClientAccount, type ActionState } from "@/app/admin/actions";

const initialState: ActionState = { ok: true, message: "" };

export function NewClientForm() {
  const [state, formAction, pending] = useActionState(createClientAccount, initialState);

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin/clientes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Clientes
      </Link>

      <h1 className="font-display text-2xl font-semibold text-paper">Nuevo cliente</h1>
      <p className="mt-2 text-sm text-paper-dim">
        Esto crea la cuenta de acceso. El cliente pide su enlace desde{" "}
        <span className="font-ledger">/login</span> usando este correo.
      </p>

      <form action={formAction} className="mt-6 space-y-5 rounded-card border border-hairline bg-ink-raised p-6">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-paper">
            Nombre del contacto
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            placeholder="Ana Torres"
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>

        <div>
          <label htmlFor="company" className="mb-2 block text-sm font-medium text-paper">
            Empresa <span className="text-paper-dim">(opcional)</span>
          </label>
          <input
            id="company"
            name="company"
            placeholder="Cafe Alameda"
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-paper">
            Correo electronico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ana@cafealameda.com"
            className="w-full rounded-lg border border-hairline bg-ink px-4 py-2.5 text-paper outline-none focus:border-lime"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-lime px-4 py-2.5 font-medium text-ink transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creando..." : "Crear cliente"}
        </button>

        {!state.ok && state.message && (
          <p role="alert" className="text-center text-sm text-rose">
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
