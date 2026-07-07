import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/sign-out";
import { WHATSAPP_LINK } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
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
      <main className="flex min-h-dvh flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <Image
            src="/logo.png"
            alt="BryanF Design"
            width={96}
            height={96}
            priority
            className="mx-auto mb-6 h-16 w-auto"
          />
          <p className="font-display text-2xl font-semibold text-paper">
            Tu cuenta aun no tiene un proyecto vinculado
          </p>
          <p className="mt-3 text-sm text-paper-dim">
            Contacta a tu asesor en BryanF Design para activar tu acceso a Bitacora.
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
              Cerrar sesion
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-hairline bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="BryanF Design"
              width={48}
              height={48}
              priority
              className="h-10 w-auto"
            />
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-tight text-paper">
                Bitacora
              </span>
              <span className="block font-ledger text-[10px] uppercase tracking-[0.24em] text-lime">
                BryanF Design
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir WhatsApp de BryanF Design"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-hairline text-paper-dim transition hover:border-lime hover:text-lime focus:outline-none focus:ring-2 focus:ring-lime/70"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
            </a>
            <span className="hidden max-w-44 truncate text-sm text-paper-dim sm:inline">
              {client.company ?? client.full_name}
            </span>
            <form action={signOut}>
              <button className="rounded-lg border border-hairline px-3 py-2 text-sm text-paper-dim transition hover:border-lime hover:text-lime focus:outline-none focus:ring-2 focus:ring-lime/70">
                Cerrar sesion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
