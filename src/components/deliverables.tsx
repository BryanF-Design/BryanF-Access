import { Download, FileX2 } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { formatShortDate } from "@/lib/format";
import type { Deliverable } from "@/types/database";

export function Deliverables({ deliverables }: { deliverables: Deliverable[] }) {
  if (deliverables.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-8 text-center">
        <p className="text-sm text-paper-dim">
          Todavía no hay entregables publicados para este proyecto.
        </p>
      </div>
    );
  }

  const sorted = [...deliverables].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="grid gap-3">
      {sorted.map((deliverable) => (
        <div
          key={deliverable.id}
          className="flex flex-col gap-3 rounded-card border border-hairline bg-ink-raised p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-paper">{deliverable.name}</p>
              {deliverable.version && (
                <p className="font-ledger text-xs text-paper-dim">{deliverable.version}</p>
              )}
            </div>
            <StatusPill status={deliverable.status} />
          </div>

          {deliverable.description && (
            <p className="text-sm text-paper-dim">{deliverable.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-ledger text-xs text-paper-dim">
              {deliverable.delivered_at
                ? `Entregado el ${formatShortDate(deliverable.delivered_at)}`
                : "Aún en curso"}
            </span>

            {deliverable.storage_path ? (
              <a
                href={`/api/deliverables/${deliverable.id}/download`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-sm text-paper transition hover:border-lime hover:text-lime"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Descargar
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-paper-dim/60">
                <FileX2 className="h-3.5 w-3.5" aria-hidden="true" />
                Sin archivo
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
