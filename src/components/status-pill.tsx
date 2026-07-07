import { cn } from "@/lib/cn";
import type { DeliverableStatus, MilestoneStatus, ProjectStatus } from "@/types/database";

type Status = ProjectStatus | MilestoneStatus | DeliverableStatus;

const LABELS: Record<Status, string> = {
  planeacion: "En planeación",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  pausado: "Pausado",
  completado: "Completado",
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  entregado: "Entregado",
};

const STYLES: Record<Status, string> = {
  planeacion: "bg-paper-dim/15 text-paper-dim border-paper-dim/30",
  en_progreso: "bg-lime/15 text-lime border-lime/30",
  en_revision: "bg-amber/15 text-amber border-amber/30",
  pausado: "bg-rose/15 text-rose border-rose/30",
  completado: "bg-lime/15 text-lime border-lime/30",
  pendiente: "bg-paper-dim/15 text-paper-dim border-paper-dim/30",
  aprobado: "bg-lime/15 text-lime border-lime/30",
  entregado: "bg-lime/15 text-lime border-lime/30",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-ledger text-[11px] uppercase tracking-wide",
        STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
