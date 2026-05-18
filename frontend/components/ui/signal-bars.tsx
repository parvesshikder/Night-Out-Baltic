"use client";

import { motion } from "framer-motion";
import type { CrowdVibe } from "@/lib/api";
import { cn } from "@/lib/utils";

type SignalBarsProps = {
  percent: number;         // 0–100
  vibe: CrowdVibe;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const TOTAL_BARS = 5;

// How many bars to fill for each vibe
function barsFromPercent(percent: number): number {
  if (percent >= 80) return 5;
  if (percent >= 60) return 4;
  if (percent >= 40) return 3;
  if (percent >= 20) return 2;
  if (percent >= 5)  return 1;
  return 0;
}

// Colour per vibe
function vibeColor(vibe: CrowdVibe): string {
  if (vibe === "packed")  return "#fb7185"; // rose-400
  if (vibe === "busy")    return "#fbbf24"; // amber-400
  if (vibe === "perfect") return "#34d399"; // emerald-400
  if (vibe === "chill")   return "#38bdf8"; // sky-400
  return "#64748b";                          // slate-500 dead
}

// Bar heights (% of container) — tallest on right
const BAR_HEIGHTS = ["28%", "42%", "58%", "74%", "100%"];

// Size configs
const SIZE = {
  sm: { container: "h-4 gap-[2px]",  barWidth: "w-1" },
  md: { container: "h-6 gap-[3px]", barWidth: "w-1.5"  },
  lg: { container: "h-8 gap-1",       barWidth: "w-2" },
};

export function SignalBars({
  percent,
  vibe,
  showLabel = false,
  size = "md",
  className,
}: SignalBarsProps) {
  const filledBars = barsFromPercent(percent);
  const color = vibeColor(vibe);
  const { container, barWidth } = SIZE[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* The bars */}
      <div className={cn("flex items-end", container)}>
        {Array.from({ length: TOTAL_BARS }, (_, i) => {
          const filled = i < filledBars;
          return (
            <motion.div
              key={i}
              className={cn("rounded-sm", barWidth)}
              style={{ height: BAR_HEIGHTS[i] }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: filled ? 1 : 0.15,
                scaleY: 1,
                backgroundColor: filled ? color : "rgba(255,255,255,0.12)",
              }}
              transition={{
                delay: i * 0.06,
                duration: 0.35,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            />
          );
        })}
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>
          {percent}%
        </span>
      )}
    </div>
  );
}
