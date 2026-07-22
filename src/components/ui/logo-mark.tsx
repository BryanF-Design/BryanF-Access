import Image from "next/image";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { chip: 30, gap: "gap-2.5", text: "text-sm", sub: "text-[9px] tracking-[0.2em]" },
  md: { chip: 40, gap: "gap-3", text: "text-lg", sub: "text-[10px] tracking-[0.22em]" },
  lg: { chip: 56, gap: "gap-3.5", text: "text-2xl", sub: "text-[11px] tracking-[0.24em]" },
  xl: { chip: 84, gap: "gap-4", text: "text-4xl", sub: "text-xs tracking-[0.28em]" },
} as const;

export function LogoMark({
  size = "md",
  title = "Bitácora",
  subtitle = "BryanF Design",
  withText = true,
  glow = false,
  className,
}: {
  size?: keyof typeof SIZES;
  title?: string;
  subtitle?: string;
  withText?: boolean;
  glow?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex min-w-0 items-center", s.gap, className)}>
      <span className="relative shrink-0" style={{ width: s.chip, height: s.chip }}>
        {glow && (
          <span
            className="absolute -inset-2 rounded-[32%] bg-lime/25 blur-xl"
            aria-hidden="true"
          />
        )}
        <Image
          src="/icon-mark.png"
          alt={withText ? "" : "BryanF Design"}
          width={s.chip}
          height={s.chip}
          priority
          className="relative rounded-[28%] shadow-soft ring-1 ring-border-glass"
        />
      </span>
      {withText && (
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate font-display font-semibold leading-tight text-paper",
              s.text,
            )}
          >
            {title}
          </span>
          <span className={cn("block truncate font-ledger uppercase text-lime", s.sub)}>
            {subtitle}
          </span>
        </span>
      )}
    </span>
  );
}
