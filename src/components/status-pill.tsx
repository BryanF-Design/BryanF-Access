import { Badge, type BadgeProps } from "@/components/ui/badge";
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

const TONES: Record<Status, NonNullable<BadgeProps["tone"]>> = {
  planeacion: "neutral",
  en_progreso: "lime",
  en_revision: "amber",
  pausado: "rose",
  completado: "lime",
  pendiente: "neutral",
  aprobado: "lime",
  entregado: "lime",
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge tone={TONES[status]} className={className}>
      {LABELS[status]}
    </Badge>
  );
}
