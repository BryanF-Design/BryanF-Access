import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-hairline px-8 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lime-dim text-lime">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="font-display text-lg font-semibold text-paper">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-paper-dim">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
