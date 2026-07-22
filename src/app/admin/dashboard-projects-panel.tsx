"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/status-pill";
import type { ProjectStatus } from "@/types/database";

export interface DashboardProject {
  id: string;
  name: string;
  status: ProjectStatus;
  currency: string;
  totalPrice: number;
  paid: number;
  remaining: number;
  targetEndDate: string | null;
  clientId: string | null;
  clientName: string;
}

export function DashboardProjectsPanel({ projects }: { projects: DashboardProject[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null);
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Todavía no has dado de alta ningún proyecto"
        description="Empieza dando de alta un cliente y su primer proyecto."
        action={
          <Link
            href="/admin/clientes/nuevo"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Nuevo cliente
          </Link>
        }
      />
    );
  }

  const selectedPct =
    selected && selected.totalPrice > 0
      ? Math.min(100, Math.round((selected.paid / selected.totalPrice) * 100))
      : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card variant="surface" padding="none" className="overflow-hidden">
        <ul role="listbox" aria-label="Proyectos" className="divide-y divide-hairline">
          {projects.map((project) => {
            const active = project.id === selected?.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => setSelectedId(project.id)}
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-4 px-5 py-4 text-left transition",
                    active ? "bg-lime/10" : "hover:bg-ink-elevated",
                  )}
                >
                  <Avatar name={project.clientName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-paper">{project.name}</span>
                      <StatusPill status={project.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-paper-dim">
                      {project.clientName}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block font-ledger text-sm tabular-nums text-paper">
                      {formatCurrency(project.remaining, project.currency)}
                    </span>
                    <span className="block text-[11px] text-paper-dim">
                      {formatShortDate(project.targetEndDate)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {selected && (
        <Card variant="glass" padding="lg" className="h-fit lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-lime">
                Detalle
              </p>
              <h3 className="mt-1 truncate font-display text-lg font-semibold text-paper">
                {selected.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-paper-dim">{selected.clientName}</p>
            </div>
            <StatusPill status={selected.status} />
          </div>

          <div className="mt-5 space-y-2.5 border-t border-hairline pt-4 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-paper-dim">Total</span>
              <span className="font-ledger tabular-nums text-paper">
                {formatCurrency(selected.totalPrice, selected.currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-paper-dim">Abonado</span>
              <span className="font-ledger tabular-nums text-paper">
                {formatCurrency(selected.paid, selected.currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-paper-dim">Resta</span>
              <span className="font-ledger text-base tabular-nums text-lime">
                {formatCurrency(selected.remaining, selected.currency)}
              </span>
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink">
            <div className="h-full rounded-full bg-lime" style={{ width: `${selectedPct}%` }} />
          </div>

          <p className="mt-4 border-t border-hairline pt-4 text-xs text-paper-dim">
            Meta de entrega: {formatShortDate(selected.targetEndDate)}
          </p>

          <Link
            href={`/admin/proyectos/${selected.id}`}
            className={cn(buttonStyles({ variant: "secondary", size: "md" }), "mt-5 w-full")}
          >
            Ver proyecto completo
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      )}
    </div>
  );
}
