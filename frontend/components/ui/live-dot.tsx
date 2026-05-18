"use client";

import { cn } from "@/lib/utils";

type LiveDotProps = {
  colour?: "cyan" | "emerald" | "amber" | "rose" | "slate";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const colorClass = {
  cyan: "bg-cyan-300 text-cyan-300",
  emerald: "bg-emerald-300 text-emerald-300",
  amber: "bg-amber-300 text-amber-300",
  rose: "bg-rose-300 text-rose-300",
  slate: "bg-slate-300 text-slate-300",
};

const sizeClass = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

export function LiveDot({
  colour = "cyan",
  size = "md",
  className,
}: LiveDotProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", sizeClass[size], className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full opacity-50 motion-safe:animate-ping",
          colorClass[colour],
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-full w-full rounded-full shadow-[0_0_14px_currentColor]",
          colorClass[colour],
        )}
      />
    </span>
  );
}
