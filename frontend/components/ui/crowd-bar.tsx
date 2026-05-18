"use client";

import { motion } from "framer-motion";
import type { CrowdVibe } from "@/lib/api";
import { cn } from "@/lib/utils";

type CrowdBarProps = {
  percent: number;
  vibe?: CrowdVibe;
  animate?: boolean;
  showLabel?: boolean;
  className?: string;
  trackClassName?: string;
};

const vibeGradient: Record<CrowdVibe, string> = {
  dead: "from-slate-500 to-slate-300",
  chill: "from-sky-500 to-cyan-300",
  perfect: "from-emerald-500 to-cyan-300",
  busy: "from-amber-400 to-orange-300",
  packed: "from-rose-500 to-pink-300",
};

const vibeGlow: Record<CrowdVibe, string> = {
  dead: "shadow-slate-300/20",
  chill: "shadow-cyan-300/30",
  perfect: "shadow-emerald-300/30",
  busy: "shadow-amber-300/30",
  packed: "shadow-rose-300/35",
};

const signalHeights = [5, 8, 11, 7, 14, 10, 17, 13, 16, 19, 21, 24];

export function CrowdBar({
  percent,
  vibe = "perfect",
  animate = true,
  showLabel = false,
  className,
  trackClassName,
}: CrowdBarProps) {
  const value = Math.max(0, Math.min(120, Math.round(percent)));
  const activePips = Math.max(1, Math.ceil((Math.min(value, 100) / 100) * signalHeights.length));

  return (
    <div
      className={cn("min-w-0", className)}
      role="meter"
      aria-label={`Crowd signal ${value}%`}
      aria-valuemin={0}
      aria-valuemax={120}
      aria-valuenow={value}
    >
      <div
        className={cn(
          "flex h-7 items-end gap-1 rounded-xl border border-white/10 bg-white/[0.035] px-1.5 py-1",
          trackClassName,
        )}
      >
        {signalHeights.map((height, index) => {
          const active = index < activePips;

          return (
            <motion.span
              key={`${height}-${index}`}
              aria-hidden="true"
              className={cn(
                "block min-w-0 flex-1 rounded-full transition-colors",
                active
                  ? cn("bg-gradient-to-t shadow-[0_0_10px_currentColor]", vibeGradient[vibe], vibeGlow[vibe])
                  : "bg-white/[0.08]",
              )}
              style={{ height }}
              initial={animate ? { opacity: 0.25, scaleY: 0.35 } : false}
              animate={{
                opacity: active ? 1 : 0.45,
                scaleY: active ? 1 : 0.72,
              }}
              transition={{
                delay: animate ? index * 0.018 : 0,
                type: "spring",
                stiffness: 420,
                damping: 28,
              }}
            />
          );
        })}
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-center justify-end">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-300">
            {value}% signal
          </span>
        </div>
      )}
    </div>
  );
}
