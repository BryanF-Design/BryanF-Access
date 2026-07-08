import Image from "next/image";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin";
import { signOut } from "@/lib/actions/sign-out";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return children;
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-hairline bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-5 sm:gap-8">
            <Link href="/admin" className="flex min-w-0 items-center gap-3">
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
                  Admin
                </span>
              </span>
            </Link>
            <nav aria-label="Admin" className="flex items-center gap-5 text-sm">
              <Link href="/admin" className="text-paper-dim transition hover:text-lime">
                Panel
              </Link>
              <Link href="/admin/clientes" className="text-paper-dim transition hover:text-lime">
                Clientes
              </Link>
            </nav>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-44 truncate text-sm text-paper-dim sm:inline">
              {admin.full_name}
            </span>
            <form action={signOut}>
              <button className="rounded-lg border border-hairline px-3 py-2 text-sm text-paper-dim transition hover:border-lime hover:text-lime focus:outline-none focus:ring-2 focus:ring-lime/70">
                Cerrar sesion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
