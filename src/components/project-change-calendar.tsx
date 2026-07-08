import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  EyeOff,
  FileText,
  FolderKanban,
  Link2,
  MessageSquareText,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatShortDate } from "@/lib/format";
import type { ProjectEvent, ProjectEventType } from "@/types/database";

const EVENT_LABELS: Record<ProjectEventType, string> = {
  project: "Proyecto",
  payment: "Pago",
  milestone: "Etapa",
  deliverable: "Entregable",
  resource: "Recurso",
  content: "Contenido",
  meeting: "Reunion",
  review: "Revision",
  other: "Nota",
};

const EVENT_ICONS = {
  project: PenLine,
  payment: CreditCard,
  milestone: CheckCircle2,
  deliverable: FileText,
  resource: FolderKanban,
  content: MessageSquareText,
  meeting: CalendarDays,
  review: ClipboardCheck,
  other: Link2,
};

function toLocalDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthDays(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function ProjectChangeCalendar({
  events,
  title = "Calendario de cambios",
  emptyMessage = "Todavia no hay cambios publicados en el calendario.",
  showVisibility = false,
}: {
  events: ProjectEvent[];
  title?: string;
  emptyMessage?: string;
  showVisibility?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-8 text-center">
        <p className="text-sm text-paper-dim">{emptyMessage}</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => {
    const dateCompare = b.event_date.localeCompare(a.event_date);
    return dateCompare || b.created_at.localeCompare(a.created_at);
  });
  const anchor = toLocalDate(sorted[0].event_date);
  const days = buildMonthDays(anchor);
  const activeMonth = monthKey(anchor);
  const eventsByDate = new Map<string, ProjectEvent[]>();

  for (const event of sorted) {
    const bucket = eventsByDate.get(event.event_date) ?? [];
    bucket.push(event);
    eventsByDate.set(event.event_date, bucket);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-card border border-hairline bg-ink-raised p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-paper">{title}</p>
            <p className="font-ledger text-xs text-paper-dim">
              {new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(anchor)}
            </p>
          </div>
          <CalendarDays className="h-5 w-5 text-lime" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-ledger text-[10px] uppercase text-paper-dim">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((date) => {
            const key = date.toISOString().slice(0, 10);
            const dayEvents = eventsByDate.get(key) ?? [];
            const inMonth = monthKey(date) === activeMonth;

            return (
              <div
                key={key}
                className={cn(
                  "min-h-11 rounded-lg border border-transparent bg-ink px-1.5 py-1 text-center",
                  dayEvents.length > 0 && "border-lime/60 bg-lime-dim",
                  !inMonth && "opacity-35",
                )}
              >
                <span className="font-ledger text-xs text-paper">{date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-lime" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3">
        {sorted.map((event) => {
          const Icon = EVENT_ICONS[event.event_type];

          return (
            <article
              key={event.id}
              className="rounded-card border border-hairline bg-ink-raised p-4 transition hover:border-lime/70"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-dim text-lime">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-paper">{event.title}</p>
                    <span className="rounded-full border border-hairline px-2 py-0.5 font-ledger text-[10px] uppercase text-paper-dim">
                      {EVENT_LABELS[event.event_type]}
                    </span>
                    {showVisibility && event.visibility === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-hairline px-2 py-0.5 font-ledger text-[10px] uppercase text-amber">
                        <EyeOff className="h-3 w-3" aria-hidden="true" />
                        Interno
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm leading-6 text-paper-dim">{event.description}</p>
                  )}
                  <p className="mt-3 font-ledger text-xs text-paper-dim">
                    {formatShortDate(event.event_date)} - {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
