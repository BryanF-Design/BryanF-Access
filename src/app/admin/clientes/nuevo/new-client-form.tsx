"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { createClientAccount, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldStyles, labelStyles } from "@/components/ui/field";

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

      <Card variant="surface" padding="lg" className="mt-6">
        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="fullName" className={labelStyles}>
              Nombre del contacto
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              placeholder="Ana Torres"
              className={fieldStyles}
            />
          </div>

          <div>
            <label htmlFor="company" className={labelStyles}>
              Empresa <span className="text-paper-dim">(opcional)</span>
            </label>
            <input id="company" name="company" placeholder="Cafe Alameda" className={fieldStyles} />
          </div>

          <div>
            <label htmlFor="email" className={labelStyles}>
              Correo electronico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ana@cafealameda.com"
              className={fieldStyles}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelStyles}>
                Telefono <span className="text-paper-dim">(opcional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+52 55 0000 0000"
                className={fieldStyles}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelStyles}>
                Pais <span className="text-paper-dim">(opcional)</span>
              </label>
              <input id="country" name="country" placeholder="Mexico" className={fieldStyles} />
            </div>
          </div>

          <div>
            <label htmlFor="industry" className={labelStyles}>
              Rubro o rama <span className="text-paper-dim">(opcional)</span>
            </label>
            <input
              id="industry"
              name="industry"
              placeholder="Arquitectura, ecommerce, salud, restaurante..."
              className={fieldStyles}
            />
          </div>

          <div>
            <label htmlFor="driveUrl" className={labelStyles}>
              Link de Drive <span className="text-paper-dim">(opcional)</span>
            </label>
            <input
              id="driveUrl"
              name="driveUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              className={fieldStyles}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
            {pending ? "Creando..." : "Crear cliente"}
          </Button>

          {!state.ok && state.message && (
            <p role="alert" className="text-center text-sm text-rose">
              {state.message}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
