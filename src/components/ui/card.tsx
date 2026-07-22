import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const cardStyles = cva("rounded-card border transition-colors", {
  variants: {
    variant: {
      surface: "border-hairline bg-ink-raised",
      raised: "border-hairline bg-ink-elevated shadow-soft",
      glass: "border-border-glass bg-surface-glass shadow-lift backdrop-blur-xl",
      dashed: "border-dashed border-hairline bg-transparent",
      paper: "border-transparent bg-paper text-ink shadow-lift",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: { variant: "surface", padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, VariantProps<typeof cardStyles> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardStyles({ variant, padding }), className)} {...props} />;
}
