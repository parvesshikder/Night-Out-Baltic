"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  Beer,
  Coffee,
  Disc3,
  Martini,
  Music2,
  Store,
  Utensils,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type { Venue } from "@/lib/api";
import { SignalBars } from "@/components/ui/signal-bars";
import { LiveDot } from "@/components/ui/live-dot";
import { cn } from "@/lib/utils";
import { crowdSignal } from "@/lib/signals";

type VenueTrayProps = {
  venues: Venue[];
  selectedVenueId?: string;
  cityMood: string;
  panelOpen?: boolean;
  onSelectVenue: (venue: Venue) => void;
};

export default function VenueTray({
  venues,
  selectedVenueId,
  cityMood,
  panelOpen = false,
  onSelectVenue,
}: VenueTrayProps) {
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedVenueId]);

  return (
    <section
      aria-label="Live venues"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-40",
        "lg:left-4",
        panelOpen ? "lg:right-[416px]" : "lg:right-4",
      )}
    >
      <div className="venue-tray-panel pointer-events-auto bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/80 to-transparent pt-6 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[#0d0d1a]/72 lg:bg-none lg:pt-2 lg:shadow-[0_18px_54px_rgba(0,0,0,0.45)] lg:backdrop-blur-2xl">
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto px-3 pt-1 lg:px-3"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {venues.map((venue, index) => (
            <VenueTrayCard
              key={venue.id}
              venue={venue}
              index={index}
              selected={venue.id === selectedVenueId}
              cardRef={venue.id === selectedVenueId ? selectedCardRef : undefined}
              onSelect={() => onSelectVenue(venue)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VenueTrayCard({
  venue,
  index,
  selected,
  cardRef,
  onSelect,
}: {
  venue: Venue;
  index: number;
  selected: boolean;
  cardRef?: RefObject<HTMLButtonElement | null>;
  onSelect: () => void;
}) {
  const signal = crowdSignal(venue.crowdPercent);
  const Icon = venueIcon(venue);

  return (
    <motion.button
      layout
      ref={cardRef}
      type="button"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.96 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 420, damping: 34 }}
      onClick={onSelect}
      className={cn(
        "relative flex h-[112px] w-[190px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d1a]/94 p-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        selected &&
          "border-cyan-300/40 shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_8px_32px_rgba(0,0,0,0.6)]",
      )}
      aria-pressed={selected}
    >
      <AnimatePresence>
        {selected && (
          <>
            <motion.span
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.28, 0.5, 0.28],
                boxShadow: [
                  "inset 0 0 0 1px rgba(34,211,238,0.25)",
                  "inset 0 0 0 1px rgba(34,211,238,0.55)",
                  "inset 0 0 0 1px rgba(34,211,238,0.25)",
                ],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 rounded-xl"
            />
            <motion.span
              aria-hidden="true"
              layoutId="venue-tray-selected-line"
              className="pointer-events-none absolute left-3 right-3 top-0 h-px bg-cyan-300/70"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
          </>
        )}
      </AnimatePresence>
      <div className="flex min-w-0 items-start gap-2">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
            vibeIconClass(venue.vibe),
          )}
        >
          <Icon aria-hidden="true" size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {venue.name}
          </span>
          <span className="mt-0.5 inline-flex h-5 max-w-full items-center rounded-full border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-slate-400">
            {selected && <LiveDot colour="cyan" size="sm" className="mr-1" />}
            <span className="truncate">{signal.level}</span>
          </span>
        </span>
      </div>

      <SignalBars
        percent={venue.crowdPercent}
        vibe={venue.vibe}
        size="sm"
        className="mt-2"
      />

      <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 text-[11px]">
        <span className="min-w-0 truncate text-slate-500">{venue.area}</span>
        <span className="shrink-0 font-mono font-semibold tabular-nums text-slate-400">
          {signal.wait}
        </span>
      </div>
    </motion.button>
  );
}

function venueIcon(venue: Venue): LucideIcon {
  const kind = venue.kind.toLowerCase();
  if (kind.includes("pub") || kind.includes("beer")) return Beer;
  if (kind.includes("restaurant")) return Utensils;
  if (kind.includes("club")) return Disc3;
  if (kind.includes("music") || kind.includes("culture")) return Music2;
  if (kind.includes("wine")) return Wine;
  if (kind.includes("cafe")) return Coffee;
  if (kind.includes("bar")) return Martini;
  return Store;
}

function vibeIconClass(vibe: Venue["vibe"]) {
  if (vibe === "packed") return "border-rose-300/20 bg-rose-400/10 text-rose-200";
  if (vibe === "busy") return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (vibe === "perfect") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (vibe === "chill") return "border-cyan-300/20 bg-cyan-400/10 text-cyan-200";
  return "border-slate-400/20 bg-slate-400/10 text-slate-300";
}
