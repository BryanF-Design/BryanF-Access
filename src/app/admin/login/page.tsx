"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { ok: false, message: "" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

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
          <p className="font-ledger text-xs uppercase tracking-[0.3em] text-lime">Admin</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-paper">BryanF Access</h1>
          <p className="mt-3 text-sm text-paper-dim">
            Acceso privado para administrar clientes, proyectos y entregables.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-5 rounded-card border border-hairline bg-ink-raised p-6"
        >
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-paper">
              Contraseña admin
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-hairline bg-ink px-4 py-3 text-paper outline-none focus:border-lime focus:ring-2 focus:ring-lime/30"
            />
          </div>

          <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="website">No llenar este campo</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-4 py-3 font-medium text-ink transition hover:bg-lime-deep focus:outline-none focus:ring-2 focus:ring-lime/70 focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {pending ? "Entrando..." : "Entrar a admin"}
          </button>

          <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-paper-dim">
            {state.message}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-paper-dim">
          Clientes:{" "}
          <Link href="/login" className="text-lime hover:text-lime-deep">
            entrar con magic link
          </Link>
        </p>
      </div>
    </main>
  );
}
