import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const badgeStyles = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ledger text-[11px] uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-paper-dim/30 bg-paper-dim/15 text-paper-dim",
        lime: "border-lime/30 bg-lime/15 text-lime",
        amber: "border-amber/30 bg-amber/15 text-amber",
        rose: "border-rose/30 bg-rose/15 text-rose",
        sky: "border-sky/30 bg-sky/15 text-sky",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeStyles> {
  dot?: boolean;
}

export function Badge({ className, tone, dot = true, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
