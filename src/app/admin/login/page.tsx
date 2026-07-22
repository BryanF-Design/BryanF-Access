"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/ui/logo-mark";
import { loginAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { ok: false, message: "" };

const FEATURES = [
  {
    icon: Users,
    title: "Clientes centralizados",
    description: "Perfiles, credenciales y proyectos en un solo lugar.",
  },
  {
    icon: LayoutDashboard,
    title: "Panel operativo",
    description: "Cronograma, entregables y pagos de cada proyecto.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso protegido",
    description: "Contraseña dedicada + verificación humana Turnstile.",
  },
];

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-dvh flex-1">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-hairline bg-ink px-14 py-12 lg:flex">
        <div className="mesh-glow grid-texture absolute inset-0" aria-hidden="true" />
        <Image
          src="/icon-mark.png"
          alt=""
          width={520}
          height={520}
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 opacity-[0.05]"
        />

        <div className="relative">
          <LogoMark size="lg" title="BryanF Access" subtitle="Panel admin" glow />
        </div>

        <div className="relative max-w-md">
          <p className="font-ledger text-xs uppercase tracking-[0.28em] text-lime">
            Equipo BryanF Design
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-paper">
            Administra cada proyecto sin perder detalle.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-paper-dim">
            Da de alta clientes, da seguimiento a entregables y mantén el cronograma y los
            pagos siempre al día.
          </p>

          <ul className="mt-9 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime">
                  <feature.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-paper">{feature.title}</p>
                  <p className="text-xs text-paper-dim">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-paper-dim">
          &copy; {new Date().getFullYear()} BryanF Design &middot; Acceso privado
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-14 sm:px-10">
        <div className="mesh-glow absolute inset-0 lg:hidden" aria-hidden="true" />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <LogoMark
              size="lg"
              title="BryanF Access"
              subtitle="Panel admin"
              glow
              className="mx-auto justify-center"
            />
          </div>

          <div className="mb-7 hidden text-left lg:block">
            <p className="font-ledger text-xs uppercase tracking-[0.28em] text-lime">Admin</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-paper">
              Entrar al panel
            </h1>
          </div>
          <p className="mb-7 text-center text-sm text-paper-dim lg:hidden">
            Acceso privado para administrar clientes, proyectos y entregables.
          </p>

          <Card variant="glass" padding="lg">
            <form action={formAction} className="space-y-5">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-paper">
                  Contraseña admin
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-dim"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-hairline bg-ink px-4 py-3 pl-10 pr-11 text-paper outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-dim transition hover:text-lime"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={pending}
                className="w-full"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                )}
                {pending ? "Entrando..." : "Entrar a admin"}
              </Button>

              <p
                role="status"
                aria-live="polite"
                className="min-h-5 text-center text-sm text-paper-dim"
              >
                {state.message}
              </p>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-paper-dim">
            Clientes:{" "}
            <Link href="/login" className="text-lime hover:text-lime-deep">
              entrar con magic link
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
