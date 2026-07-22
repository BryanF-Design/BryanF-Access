import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

const ACCENTS = {
  lime: { chip: "bg-lime/15 text-lime", line: "text-lime" },
  amber: { chip: "bg-amber/15 text-amber", line: "text-amber" },
  rose: { chip: "bg-rose/15 text-rose", line: "text-rose" },
  sky: { chip: "bg-sky/15 text-sky", line: "text-sky" },
} as const;

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 88 - 6;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-9 w-full", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  sparkline,
  accent = "lime",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { label: string; tone: "positive" | "negative" | "neutral" };
  sparkline?: number[];
  accent?: keyof typeof ACCENTS;
  className?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <Card variant="raised" padding="lg" className={cn("relative", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-paper-dim">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-paper">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            a.chip,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {delta && (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 font-ledger text-[11px] uppercase tracking-wide",
            delta.tone === "positive" && "text-lime",
            delta.tone === "negative" && "text-rose",
            delta.tone === "neutral" && "text-paper-dim",
          )}
        >
          {delta.label}
        </p>
      )}

      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} className={cn("mt-3", a.line)} />
      )}
    </Card>
  );
}
