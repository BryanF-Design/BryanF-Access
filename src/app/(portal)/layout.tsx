import Link from "next/link";
import { LogOut, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/sign-out";
import { WHATSAPP_LINK } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { LogoMark } from "@/components/ui/logo-mark";
import type { Client } from "@/types/database";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, company")
    .eq("auth_user_id", user.id)
    .maybeSingle<Pick<Client, "id" | "full_name" | "company">>();

  if (!client) {
    return (
      <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6 text-center">
        <div className="mesh-glow absolute inset-0" aria-hidden="true" />
        <div className="relative max-w-sm">
          <LogoMark size="lg" glow className="mx-auto justify-center" />
          <p className="mt-7 font-display text-2xl font-semibold text-paper">
            Tu cuenta aún no tiene un proyecto vinculado
          </p>
          <p className="mt-3 text-sm text-paper-dim">
            Contacta a tu asesor en BryanF Design para activar tu acceso a Bitácora.
          </p>
          <p className="mt-2 text-xs text-paper-dim">
            Si eres del equipo de BryanF, entra en{" "}
            <Link href="/admin" className="text-lime hover:text-lime-deep">
              /admin
            </Link>
            .
          </p>
          <form action={signOut} className="mt-6">
            <button className="text-sm font-medium text-lime hover:text-lime-deep">
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className="shrink-0">
            <LogoMark size="sm" />
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir WhatsApp de BryanF Design"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline text-paper-dim transition hover:border-lime hover:text-lime focus:outline-none focus:ring-2 focus:ring-lime/70"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
            </a>
            <span className="hidden max-w-44 truncate text-sm text-paper-dim sm:inline">
              {client.company ?? client.full_name}
            </span>
            <Avatar name={client.company ?? client.full_name} size="sm" />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline px-3 text-sm text-paper-dim transition hover:border-rose/60 hover:text-rose focus:outline-none focus:ring-2 focus:ring-lime/70"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
