import { formatCurrency } from "@/lib/format";

function LedgerRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={emphasis ? "text-ink" : "text-ink/60"}>{label}</span>
      <span className="leader-dots h-4 flex-1" />
      <span
        className={`font-ledger tabular-nums ${
          emphasis ? "text-xl font-medium text-lime-deep" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function Ledger({
  projectName,
  totalPrice,
  currency,
  paidTotal,
}: {
  projectName: string;
  totalPrice: number;
  currency: string;
  paidTotal: number;
}) {
  const remaining = Math.max(0, totalPrice - paidTotal);
  const pct = totalPrice > 0 ? Math.min(100, Math.round((paidTotal / totalPrice) * 100)) : 0;
  const isSettled = remaining <= 0 && totalPrice > 0;

  return (
    <div className="relative overflow-hidden rounded-card border border-hairline bg-paper text-ink shadow-glow">
      <div className="torn-edge h-3 bg-ink" />

      <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
        <div className="flex items-baseline justify-between">
          <p className="font-ledger text-[11px] uppercase tracking-[0.25em] text-ink/50">
            Resumen de cuenta
          </p>
          <p className="font-ledger text-[11px] text-ink/50">{currency}</p>
        </div>
        <h2 className="mt-1 truncate font-display text-lg font-semibold">{projectName}</h2>

        <div className="mt-6 space-y-3 text-[15px]">
          <LedgerRow label="Total del proyecto" value={formatCurrency(totalPrice, currency)} />
          <LedgerRow label="Abonado a la fecha" value={formatCurrency(paidTotal, currency)} />
        </div>

        <div className="my-5 border-t border-dashed border-ink/20" />

        <LedgerRow
          label={isSettled ? "Proyecto liquidado" : "Resta por liquidar"}
          value={formatCurrency(remaining, currency)}
          emphasis
        />

        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-lime-deep transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-ledger text-xs text-ink/50">
            {pct}% liquidado
            {isSettled ? " · gracias por tu confianza" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
