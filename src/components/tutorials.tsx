import { PlaySquare } from "lucide-react";
import { tutorialSteps } from "@/lib/tutorials";

export function Tutorials() {
  return (
    <div className="grid gap-3">
      {tutorialSteps.map((step) => (
        <details
          key={step.slug}
          className="group rounded-card border border-hairline bg-ink-raised p-4 transition open:border-lime/60 open:shadow-soft"
        >
          <summary className="flex cursor-pointer list-none items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-dim text-lime">
              <PlaySquare className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-paper">{step.title}</span>
              <span className="mt-1 block text-sm text-paper-dim">{step.description}</span>
            </span>
            <span className="mt-1 text-sm text-paper-dim transition group-open:rotate-180" aria-hidden="true">
              v
            </span>
          </summary>

          <div className="mt-4 space-y-4 border-t border-hairline pt-4">
            {step.instructions && (
              <ol className="grid gap-2 text-sm text-paper-dim">
                {step.instructions.map((instruction, index) => (
                  <li key={instruction} className="flex gap-2">
                    <span className="font-ledger text-lime">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="grid gap-3">
              {step.assets.map((asset) =>
                asset.type === "video" ? (
                  <video
                    key={asset.src}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-lg border border-hairline bg-ink"
                    src={asset.src}
                  />
                ) : (
                  // Protected same-origin assets rely on the user's auth cookie.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={asset.src}
                    src={asset.src}
                    alt={asset.alt}
                    loading="lazy"
                    className="w-full rounded-lg border border-hairline bg-ink object-contain"
                  />
                ),
              )}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
