import Link from "next/link";
import { LogOut } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { signOut } from "@/lib/actions/sign-out";
import { Avatar } from "@/components/ui/avatar";
import { LogoMark } from "@/components/ui/logo-mark";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return children;
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-6 sm:gap-9">
            <Link href="/admin" className="shrink-0">
              <LogoMark size="sm" subtitle="Admin" />
            </Link>
            <AdminNav />
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-44 truncate text-sm text-paper-dim sm:inline">
              {admin.full_name}
            </span>
            <Avatar name={admin.full_name} size="sm" />
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

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
