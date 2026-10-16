import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PaymentHistory } from "@/components/payment-history";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { isApproved, rowsOrEmpty } from "@/lib/account";
import type { Payment, Project } from "@/types/database";

export const metadata = { title: "Mis pagos - Bitácora" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const [paymentsResult, { data: projects }] = await Promise.all([
    supabase.from("payments").select("*").order("paid_at", { ascending: false }).returns<Payment[]>(),
    supabase.from("projects").select("id, name").returns<Pick<Project, "id" | "name">[]>(),
  ]);
  const payments = rowsOrEmpty(paymentsResult);
  const projectNames = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const approved = payments.filter(isApproved);
  const total = approved.reduce((sum, p) => sum + Number(p.amount), 0);
  const subscriptionTotal = approved.filter((p) => p.subscription_id).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper-dim transition hover:text-lime">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Mi cuenta
      </Link>
      <PageHeader
        eyebrow="Pagos"
        title="Historial de pagos"
        description="Anticipos, saldos y mensualidades. Cada pago trae su folio; el comprobante también te llegó por correo."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card variant="surface" padding="md">
          <p className="text-xs text-paper-dim">Total pagado</p>
          <p className="mt-1 font-ledger text-xl tabular-nums text-paper">{formatCurrency(total)}</p>
        </Card>
        <Card variant="surface" padding="md">
          <p className="text-xs text-paper-dim">En mensualidades</p>
          <p className="mt-1 font-ledger text-xl tabular-nums text-paper">{formatCurrency(subscriptionTotal)}</p>
        </Card>
        <Card variant="surface" padding="md">
          <p className="text-xs text-paper-dim">Pagos registrados</p>
          <p className="mt-1 font-ledger text-xl tabular-nums text-paper">{payments.length}</p>
        </Card>
      </div>

      <div className="mt-8">
        <PaymentHistory payments={payments} projectNames={projectNames} />
      </div>

      <p className="mt-6 text-xs text-paper-dim">
        ¿Necesitas factura o ves algo raro? Escríbenos y lo revisamos el mismo día hábil.
      </p>
    </div>
  );
}
