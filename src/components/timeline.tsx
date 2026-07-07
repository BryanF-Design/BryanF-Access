import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Milestone } from "@/types/database";

function Dot({ status }: { status: Milestone["status"] }) {
  if (status === "completado") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
          <path d="M2 6.2 4.8 9 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "en_progreso") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-pulse rounded-full border-2 border-lime" />
        <span className="h-2 w-2 rounded-full bg-lime" />
      </span>
    );
  }
  return <span className="h-5 w-5 rounded-full border-2 border-hairline" />;
}

export function Timeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="text-sm text-paper-dim">Aún no hay etapas definidas para este proyecto.</p>;
  }

  const sorted = [...milestones].sort((a, b) => a.position - b.position);

  return (
    <ol className="relative">
      {sorted.map((milestone, index) => (
        <li key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < sorted.length - 1 && (
            <span
              className={cn(
                "absolute left-[9px] top-6 h-[calc(100%-0.5rem)] w-px",
                milestone.status === "completado" ? "bg-lime/50" : "bg-hairline",
              )}
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 shrink-0 pt-0.5">
            <Dot status={milestone.status} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-medium text-paper">{milestone.title}</h3>
              <span className="font-ledger text-xs text-paper-dim">
                {milestone.status === "completado" && milestone.completed_at
                  ? formatDate(milestone.completed_at)
                  : formatDate(milestone.due_date)}
              </span>
            </div>
            {milestone.description && (
              <p className="mt-1 text-sm text-paper-dim">{milestone.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
