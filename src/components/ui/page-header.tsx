import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-ledger text-xs uppercase tracking-[0.24em] text-lime">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-3xl font-semibold text-paper">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-paper-dim">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
