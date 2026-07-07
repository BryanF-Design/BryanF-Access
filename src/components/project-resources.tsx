import { ExternalLink, FolderKanban, KeyRound, Link2, PlaySquare } from "lucide-react";
import type { ProjectResource } from "@/types/database";

const LABELS: Record<ProjectResource["resource_type"], string> = {
  drive: "Drive",
  url: "Enlace",
  tutorial: "Tutorial",
  credential: "Acceso",
  other: "Recurso",
};

const ICONS = {
  drive: FolderKanban,
  url: Link2,
  tutorial: PlaySquare,
  credential: KeyRound,
  other: Link2,
};

export function ProjectResources({ resources }: { resources: ProjectResource[] }) {
  if (resources.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-8 text-center">
        <p className="text-sm text-paper-dim">Todavia no hay recursos vinculados a este proyecto.</p>
      </div>
    );
  }

  const sorted = [...resources].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));

  return (
    <div className="grid gap-3">
      {sorted.map((resource) => {
        const Icon = ICONS[resource.resource_type];

        return (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-16 items-start justify-between gap-4 rounded-card border border-hairline bg-ink-raised p-4 transition hover:border-lime"
          >
            <span className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-dim text-lime">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-paper">{resource.title}</span>
                <span className="mt-1 block font-ledger text-[11px] uppercase text-paper-dim">
                  {LABELS[resource.resource_type]}
                </span>
                {resource.description && (
                  <span className="mt-2 block text-sm text-paper-dim">{resource.description}</span>
                )}
              </span>
            </span>
            <ExternalLink
              className="mt-1 h-4 w-4 shrink-0 text-paper-dim transition group-hover:text-lime"
              aria-hidden="true"
            />
          </a>
        );
      })}
    </div>
  );
}
