import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Flame, MapPinned, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type RadarChipsProps = {
  cityMood: string;
  hottestArea: string;
  venueCount: number;
};

export default function RadarChips({
  cityMood,
  hottestArea,
  venueCount,
}: RadarChipsProps) {
  return (
    <div className="pointer-events-none absolute bottom-32 left-3 z-[400] flex flex-col gap-1.5 lg:bottom-auto lg:left-[calc(380px+1rem)] lg:top-20 lg:flex-row">
      <RadarChip
        icon={<Radio size={13} />}
        label="City"
        value={cityMood}
        tone="cyan"
        delay={0}
      />
      <RadarChip
        icon={<Flame size={13} />}
        label="Warmest"
        value={hottestArea}
        tone="amber"
        delay={0.06}
      />
      <RadarChip
        icon={<MapPinned size={13} />}
        label="Venues"
        value={venueCount ? `${venueCount}` : "Sync"}
        tone="neutral"
        delay={0.12}
      />
    </div>
  );
}

function RadarChip({
  icon,
  label,
  value,
  tone,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "amber" | "neutral";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-[#090916]/88 px-2.5 text-[11px] font-semibold text-white shadow-lg shadow-black/25 backdrop-blur-xl lg:px-3 lg:text-xs",
        tone === "cyan" && "border-l-2 border-l-cyan-400/60",
        tone === "amber" && "border-l-2 border-l-amber-400/60",
        tone === "neutral" && "border-l-2 border-l-slate-500/60",
      )}
    >
      <span
        className={cn(
          "shrink-0",
          tone === "cyan" && "text-cyan-300",
          tone === "amber" && "text-amber-300",
          tone === "neutral" && "text-slate-400",
        )}
      >
        {icon}
      </span>
      <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 lg:inline">
        {label}
      </span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="max-w-32 truncate font-mono tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
