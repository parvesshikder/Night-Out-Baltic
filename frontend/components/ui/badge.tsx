import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-white/[0.06] text-slate-300 ring-white/10",
        cyan: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
        emerald: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
        amber: "bg-amber-400/10 text-amber-100 ring-amber-300/20",
        rose: "bg-rose-400/10 text-rose-100 ring-rose-300/20",
      },
      glow: {
        true: "badge-glow",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      glow: false,
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, glow, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, glow }), className)}
      {...props}
    />
  );
}
