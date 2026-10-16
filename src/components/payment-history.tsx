import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_STATUS, PROVIDER_LABEL, paymentFolio } from "@/lib/account";
import type { Payment } from "@/types/database";

/**
 * Historial de pagos del cliente (proyectos y mensualidades). En celular cada
 * pago es una tarjeta; en escritorio, una tabla.
 */
export function PaymentHistory({
  payments,
  projectNames,
  limit,
}: {
  payments: Payment[];
  /** Nombre del proyecto por id, para el concepto de pagos sin concepto propio. */
  projectNames: Map<string, string>;
  limit?: number;
}) {
  const rows = [...payments]
    .sort((a, b) => (b.paid_at || b.created_at).localeCompare(a.paid_at || a.created_at))
    .slice(0, limit ?? payments.length);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Aún no hay pagos registrados"
        description="Cuando pagues un anticipo, un saldo o tu mensualidad, aparecerá aquí con su comprobante."
      />
    );
  }

  const concept = (p: Payment) =>
    p.concept || (p.project_id ? projectNames.get(p.project_id) : null) || (p.subscription_id ? "Mensualidad" : "Pago");
  const method = (p: Payment) => (p.provider ? PROVIDER_LABEL[p.provider] : null) || p.method || "—";
  const status = (p: Payment) => PAYMENT_STATUS[p.status ?? "aprobado"] ?? PAYMENT_STATUS.aprobado;

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-ink-raised">
      {/* Celular */}
      <ul className="divide-y divide-hairline sm:hidden">
        {rows.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-paper">{concept(p)}</p>
              <p className="mt-0.5 text-xs text-paper-dim">
                {formatDate(p.paid_at)} · {method(p)}
              </p>
              <p className="mt-1 font-ledger text-[11px] text-paper-dim">
                {paymentFolio(p)}
                {p.receipt_url && (
                  <>
                    {" · "}
                    <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-lime">
                      Recibo
                    </a>
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-ledger text-sm tabular-nums text-paper">
                {formatCurrency(Number(p.amount), p.currency || "MXN")}
              </p>
              <Badge tone={status(p).tone} className="mt-1.5">
                {status(p).label}
              </Badge>
            </div>
          </li>
        ))}
      </ul>

      {/* Escritorio */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-hairline font-ledger text-[11px] uppercase tracking-wide text-paper-dim">
            <th scope="col" className="px-5 py-3 font-normal">Fecha</th>
            <th scope="col" className="px-5 py-3 font-normal">Concepto</th>
            <th scope="col" className="px-5 py-3 font-normal">Método</th>
            <th scope="col" className="px-5 py-3 font-normal">Estado</th>
            <th scope="col" className="px-5 py-3 text-right font-normal">Monto</th>
            <th scope="col" className="px-5 py-3 text-right font-normal">
              <span className="sr-only">Comprobante</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((p) => (
            <tr key={p.id} className="transition hover:bg-ink-elevated/60">
              <td className="whitespace-nowrap px-5 py-3.5 text-paper-dim">{formatDate(p.paid_at)}</td>
              <td className="px-5 py-3.5">
                <p className="text-paper">{concept(p)}</p>
                <p className="font-ledger text-[11px] text-paper-dim">{paymentFolio(p)}</p>
              </td>
              <td className="px-5 py-3.5 text-paper-dim">{method(p)}</td>
              <td className="px-5 py-3.5">
                <Badge tone={status(p).tone}>{status(p).label}</Badge>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-right font-ledger tabular-nums text-paper">
                {formatCurrency(Number(p.amount), p.currency || "MXN")}
              </td>
              <td className="px-5 py-3.5 text-right">
                {p.receipt_url ? (
                  <a
                    href={p.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-lime hover:text-lime-deep"
                  >
                    Recibo
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
