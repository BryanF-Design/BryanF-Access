"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { requestMagicLink, type LoginActionState } from "./actions";

const initialState: LoginActionState = { ok: false, message: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);
  const [token, setToken] = useState("");

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Image
            src="/logo.png"
            alt="BryanF Design"
            width={104}
            height={104}
            priority
            className="mx-auto mb-5 h-20 w-auto"
          />
          <p className="font-ledger text-xs uppercase tracking-[0.3em] text-lime">
            BryanF Design
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-paper">Bitacora</h1>
          <p className="mt-3 text-sm text-paper-dim">
            Seguimiento privado de entregables, cronograma, recursos y saldo del proyecto.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-5 rounded-card border border-hairline bg-ink-raised p-6"
        >
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-paper">
              Correo electronico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@empresa.com"
              className="w-full rounded-lg border border-hairline bg-ink px-4 py-3 text-paper outline-none placeholder:text-paper-dim/60 focus:border-lime focus:ring-2 focus:ring-lime/30"
            />
          </div>

          <div
            className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor="website">No llenar este campo</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <input type="hidden" name="turnstileToken" value={token} />
          <TurnstileWidget onToken={setToken} />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-lime px-4 py-3 font-medium text-ink transition hover:bg-lime-deep focus:outline-none focus:ring-2 focus:ring-lime/70 focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Enviando..." : "Enviar enlace de acceso"}
          </button>

          <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-paper-dim">
            {state.message}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-paper-dim">
          Acceso exclusivo para clientes y equipo de BryanF Design.
        </p>
      </div>
    </main>
  );
}
