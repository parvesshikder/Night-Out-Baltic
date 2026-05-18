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
  const items = [
    {
      icon: <Radio size={12} />,
      label: "Now",
      value: cityMood,
      tone: "cyan" as const,
      delay: 0,
    },
    {
      icon: <Flame size={12} />,
      label: "Hot",
      value: hottestArea,
      tone: "amber" as const,
      delay: 0.05,
    },
    {
      icon: <MapPinned size={12} />,
      label: "Live",
      value: venueCount ? `${venueCount}` : "...",
      tone: "neutral" as const,
      delay: 0.1,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="pointer-events-none fixed bottom-[118px] left-3 right-3 z-30 grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-[#090916]/86 shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:left-auto sm:w-[21rem] lg:absolute lg:bottom-auto lg:left-[calc(380px+1rem)] lg:right-auto lg:top-20 lg:w-[22rem]"
    >
      {items.map((item) => (
        <RadarChip key={item.label} {...item} />
      ))}
    </motion.div>
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
        "min-w-0 border-r border-white/[0.07] px-2 py-1.5 last:border-r-0",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md border",
            tone === "cyan" && "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
            tone === "amber" && "border-amber-300/20 bg-amber-400/10 text-amber-200",
            tone === "neutral" && "border-slate-300/15 bg-white/[0.045] text-slate-300",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="block truncate text-[10px] font-semibold leading-4 text-white"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </motion.div>
  );
}
