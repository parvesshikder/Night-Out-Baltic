"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ComponentProps, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Signal,
  Wand2,
  X,
} from "lucide-react";
import type { ContributionAction, CrowdVibe, EventItem, Venue } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalBars } from "@/components/ui/signal-bars";
import SignalBoard from "@/components/radar/SignalBoard";
import { cn } from "@/lib/utils";
import { crowdSignal, formatUpdated, vibeReports } from "@/lib/signals";

type AreaInsight = {
  mood: string;
  hottest?: Venue;
};

type VenueDetailPanelProps = {
  isOpen: boolean;
  venue?: Venue;
  activeEvent: EventItem | null;
  venues: Venue[];
  selectedVenueId?: string;
  events: EventItem[];
  areaInsight: AreaInsight | null;
  busyAction: string | null;
  onClose: () => void;
  onContribution: (action: ContributionAction, vibe?: CrowdVibe) => void;
  onSelectEvent: (event: EventItem) => void;
  onSelectVenue: (venue: Venue) => void;
};

const reportLabels: Record<CrowdVibe, string> = {
  dead: "Dead",
  chill: "Chill",
  perfect: "Live",
  busy: "Busy",
  packed: "Packed",
};

const reportEmoji: Record<CrowdVibe, string> = {
  dead: "💀",
  chill: "😌",
  perfect: "⚡",
  busy: "🔥",
  packed: "🌋",
};

const DESKTOP_PANEL_MIN = 360;
const DESKTOP_PANEL_DEFAULT = 400;
const DESKTOP_PANEL_EXPANDED = 620;
const DESKTOP_PANEL_MAX = 760;

function clampPanelWidth(width: number) {
  if (typeof window === "undefined") {
    return Math.min(DESKTOP_PANEL_MAX, Math.max(DESKTOP_PANEL_MIN, width));
  }

  const viewportMax = Math.max(DESKTOP_PANEL_MIN, window.innerWidth - 32);
  return Math.min(DESKTOP_PANEL_MAX, viewportMax, Math.max(DESKTOP_PANEL_MIN, width));
}

export default function VenueDetailPanel({
  isOpen,
  venue,
  activeEvent,
  venues,
  selectedVenueId,
  events,
  areaInsight,
  busyAction,
  onClose,
  onContribution,
  onSelectEvent,
  onSelectVenue,
}: VenueDetailPanelProps) {
  const visible = isOpen;
  const [desktopPanelWidth, setDesktopPanelWidth] = useState(DESKTOP_PANEL_DEFAULT);
  const [resizingDesktopPanel, setResizingDesktopPanel] = useState(false);
  const desktopPanelRef = useRef<HTMLElement | null>(null);
  const mobilePanelRef = useRef<HTMLElement | null>(null);
  const desktopExpanded = desktopPanelWidth > DESKTOP_PANEL_DEFAULT + 80;
  const stopDesktopResizeRef = useRef<(() => void) | null>(null);

  function toggleDesktopWidth() {
    setDesktopPanelWidth((width) =>
      width > DESKTOP_PANEL_DEFAULT + 80
        ? DESKTOP_PANEL_DEFAULT
        : clampPanelWidth(DESKTOP_PANEL_EXPANDED),
    );
  }

  function startDesktopResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    stopDesktopResizeRef.current?.();

    setResizingDesktopPanel(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    function onPointerMove(moveEvent: PointerEvent) {
      setDesktopPanelWidth(clampPanelWidth(window.innerWidth - moveEvent.clientX));
    }

    function stopResize() {
      setResizingDesktopPanel(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      stopDesktopResizeRef.current = null;
    }

    stopDesktopResizeRef.current = stopResize;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

  useEffect(() => {
    if (!visible) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, visible]);

  useEffect(() => {
    if (!visible) return;

    desktopPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    mobilePanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeEvent, selectedVenueId, visible]);

  useEffect(() => {
    function clampOnResize() {
      setDesktopPanelWidth((width) => clampPanelWidth(width));
    }

    window.addEventListener("resize", clampOnResize);
    return () => window.removeEventListener("resize", clampOnResize);
  }, []);

  useEffect(() => {
    return () => stopDesktopResizeRef.current?.();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <>

          <motion.aside
            ref={desktopPanelRef}
            key="panel-desktop"
            role="dialog"
            aria-modal="false"
            aria-label={venue ? `${venue.name} details` : "Venue details"}
            initial={{ x: desktopPanelWidth + 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: desktopPanelWidth + 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: desktopPanelWidth }}
            className={cn(
              "fixed bottom-0 right-0 top-14 z-50 hidden overflow-y-auto border-l border-white/[0.07] bg-[#0d0d1a]/96 text-slate-100 backdrop-blur-2xl lg:block",
              !resizingDesktopPanel && "transition-[width] duration-300 ease-out",
            )}
          >
            <DesktopPanelControls
              expanded={desktopExpanded}
              onToggle={toggleDesktopWidth}
              onClose={onClose}
            />
            <PanelSlideHandle
              expanded={desktopExpanded}
              panelWidth={desktopPanelWidth}
              resizing={resizingDesktopPanel}
              onResizeStart={startDesktopResize}
            />
            {venue ? (
              <DossierContent
                venue={venue}
                activeEvent={activeEvent}
                events={events}
                areaInsight={areaInsight}
                busyAction={busyAction}
                onContribution={onContribution}
                onSelectEvent={onSelectEvent}
                onClose={onClose}
              />
            ) : (
              <EmptyPanelState />
            )}

            <div className="hidden border-t border-white/[0.07] p-3 lg:block">
              <SignalBoard
                venues={venues}
                selectedVenueId={selectedVenueId}
                onSelectVenue={onSelectVenue}
              />
            </div>
          </motion.aside>

          <motion.aside
            ref={mobilePanelRef}
            key="panel-mobile"
            role="dialog"
            aria-modal="false"
            aria-label={venue ? `${venue.name} details` : "Venue details"}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="pointer-events-none fixed inset-0 z-50 grid place-items-center px-5 lg:hidden"
          >
            <div className="pointer-events-auto relative max-h-[42dvh] w-full max-w-[20rem] overflow-y-auto overscroll-contain rounded-xl border border-white/[0.10] bg-[#0d0d1a]/97 text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
              {venue ? (
                <MobilePanelContent
                  venue={venue}
                  activeEvent={activeEvent}
                  busyAction={busyAction}
                  onClose={onClose}
                  onContribution={onContribution}
                />
              ) : (
                <>
                  <PanelCloseButton
                    onClose={onClose}
                    className="absolute right-3 top-3 z-20 flex"
                  />
                  <EmptyPanelState />
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DossierContent({
  venue,
  activeEvent,
  events,
  areaInsight,
  busyAction,
  onContribution,
  onSelectEvent,
  onClose,
}: {
  venue: Venue;
  activeEvent: EventItem | null;
  events: EventItem[];
  areaInsight: AreaInsight | null;
  busyAction: string | null;
  onContribution: (action: ContributionAction, vibe?: CrowdVibe) => void;
  onSelectEvent: (event: EventItem) => void;
  onClose: () => void;
}) {
  const signal = crowdSignal(venue.crowdPercent);
  const visibleEvents = venue.events.length > 0 ? venue.events : events.slice(0, 3);
  const busy = busyAction?.startsWith(`${venue.id}-`) ?? false;

  return (
    <div>
      {activeEvent && <EventBanner event={activeEvent} />}

      <header className="relative overflow-hidden px-4 pb-4 pt-3 lg:pt-4">
        <div
          aria-hidden="true"
          className={cn("absolute inset-0 opacity-[0.06]", vibeBannerClass(venue.vibe))}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant={badgeVariant(signal.level)} glow>
              {signal.level}
            </Badge>
            <h2 className="font-display mt-3 truncate text-xl font-bold tracking-tight text-white">
              {venue.name}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-400">
              {venue.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close venue details"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 lg:hidden"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 pb-4">
        <section aria-label="Current signal" className="grid grid-cols-3 gap-2">
          <Metric icon={<Signal size={16} />} label="Room" value={venue.vibeLabel} />
          <Metric icon={<Clock3 size={16} />} label="Entry" value={signal.wait} />
          <Metric icon={<Wand2 size={16} />} label="Feel" value={signal.tone} />
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-300">Signal confidence</p>
            <p className="text-xs text-slate-500">
              Updated {formatUpdated(venue.lastUpdated)}
            </p>
          </div>
          <SignalBars percent={venue.crowdPercent} vibe={venue.vibe} showLabel size="lg" />
        </section>

        <section id="contribute" className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Contribute anonymously</h3>
            <Badge variant="neutral">No profile</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => onContribution("going")}
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 hover:brightness-110"
            >
              <Navigation aria-hidden="true" size={16} />
              I&apos;m Going
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => onContribution("check_in")}
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:brightness-110"
            >
              <BadgeCheck aria-hidden="true" size={16} />
              Check In
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="col-span-2 hover:bg-rose-400/10 hover:text-rose-100"
              disabled={busy}
              onClick={() => {
                onContribution("not_going");
                onClose();
              }}
            >
              Skip
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {vibeReports.map((item) => (
              <motion.button
                key={item.vibe}
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.96 }}
                onClick={() => onContribution("report", item.vibe)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-2 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-50"
              >
                <span className="block text-sm text-slate-500" aria-hidden="true">
                  {reportEmoji[item.vibe]}
                </span>
                <span className="block truncate">{reportLabels[item.vibe]}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="flex gap-3 text-sm leading-6 text-slate-400">
            <LocateFixed
              aria-hidden="true"
              className="mt-1 shrink-0 text-slate-400"
              size={16}
            />
            <p>
              <span className="font-medium text-white">
                {areaInsight?.mood ?? "Reading area"}
              </span>
              . Nearby energy is{" "}
              {areaInsight?.hottest
                ? `currently led by ${areaInsight.hottest.name}`
                : "calm right now"}
              .
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white">Venue context</h3>
          <div className="flex gap-3 text-sm leading-6 text-slate-400">
            <MapPin
              aria-hidden="true"
              className="mt-1 shrink-0 text-slate-500"
              size={16}
            />
            <span>
              {venue.address} · {venue.openHours}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {venue.tags.map((tag, index) => (
              <TagPill key={`${tag}-${index}`} tone="neutral">
                {tag}
              </TagPill>
            ))}
            {venue.music.map((tag, index) => (
              <TagPill key={`${tag}-${index}`} tone="music">
                {tag}
              </TagPill>
            ))}
            <TagPill tone="price">{venue.price}</TagPill>
            <TagPill tone="vibe">{venue.vibeLabel}</TagPill>
          </div>
        </section>

        <section id="events">
          <h3 className="mb-3 text-sm font-semibold text-white">Nearby plans</h3>
          <div className="grid gap-2">
            {visibleEvents.map((event) => (
              <motion.button
                key={event.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectEvent(event)}
                className={cn(
                  "relative flex min-h-12 gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 active:bg-white/[0.10]",
                  activeEvent?.id === event.id && "border-violet-300/30 bg-violet-400/10",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    eventStripClass(event.timeframe),
                  )}
                />
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-slate-500"
                  size={16}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">
                    {event.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {event.startsAt} · {event.venueName}
                  </span>
                </span>
                <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-2 text-[11px] font-semibold leading-none text-slate-300">
                  {event.price}
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MobilePanelContent({
  venue,
  activeEvent,
  busyAction,
  onClose,
  onContribution,
}: {
  venue: Venue;
  activeEvent: EventItem | null;
  busyAction: string | null;
  onClose: () => void;
  onContribution: (action: ContributionAction, vibe?: CrowdVibe) => void;
}) {
  const signal = crowdSignal(venue.crowdPercent);
  const busy = busyAction?.startsWith(`${venue.id}-`) ?? false;

  return (
    <div className="p-3">
      {activeEvent && <EventBanner event={activeEvent} compact />}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge variant={badgeVariant(signal.level)}>{signal.level}</Badge>
          <h2 className="mt-1 truncate text-sm font-bold text-white">
            {venue.name}
          </h2>
          <p className="truncate text-[11px] text-slate-500">
            {venue.area} · {venue.kind}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close venue details"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          <X aria-hidden="true" size={13} />
        </button>
      </div>

      <div className="mt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Crowd signal</span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-300">
            {Math.round(venue.crowdPercent)}%
          </span>
        </div>
        <SignalBars percent={venue.crowdPercent} vibe={venue.vibe} size="sm" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <MiniStat label="Entry" value={signal.wait} />
        <MiniStat label="Music" value={venue.music[0] ?? "Mixed"} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.95 }}
          onClick={() => onContribution("going")}
          className="h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-[11px] font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
        >
          I&apos;m Going
        </motion.button>
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.95 }}
          onClick={() => onContribution("check_in")}
          className="h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-[11px] font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
        >
          Check In
        </motion.button>
      </div>

      <p className="mt-2 truncate text-[10px] text-slate-600">
        {venue.price} · {venue.openHours}
      </p>
    </div>
  );
}

function EventBanner({
  event,
  compact = false,
}: {
  event: EventItem;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-violet-300/20 bg-violet-400/10 p-3",
        compact ? "mb-3" : "mx-4 mt-4",
      )}
    >
      <div className="flex items-start gap-2">
        <CalendarDays
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-violet-300"
          size={14}
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-violet-200">
            {event.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {event.startsAt} · {event.price}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPanelState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <MapPin className="text-slate-500" size={24} />
      </div>
      <div>
        <p className="text-base font-semibold text-white">Pick a venue</p>
        <p className="mt-1 text-sm text-slate-500">
          Tap any pin on the map or a card below to see the live vibe.
        </p>
      </div>
    </div>
  );
}

function DesktopPanelControls({
  expanded,
  onToggle,
  onClose,
}: {
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ExpandIcon = expanded ? ChevronsRight : ChevronsLeft;

  return (
    <div className="fixed right-4 top-[4.25rem] z-[60] hidden items-center gap-2 lg:flex">
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? "Collapse venue details" : "Expand venue details"}
        title={expanded ? "Collapse details" : "Expand details"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-slate-400 shadow-lg shadow-black/30 backdrop-blur transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        <ExpandIcon aria-hidden="true" size={15} />
      </button>
      <PanelCloseButton onClose={onClose} className="flex" />
    </div>
  );
}

function PanelSlideHandle({
  expanded,
  panelWidth,
  resizing,
  onResizeStart,
}: {
  expanded: boolean;
  panelWidth: number;
  resizing: boolean;
  onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const ExpandIcon = expanded ? ChevronsRight : ChevronsLeft;

  return (
    <button
      type="button"
      onPointerDown={onResizeStart}
      aria-label="Drag to resize venue details"
      title="Drag to resize details"
      style={{ right: panelWidth }}
      className={cn(
        "fixed top-1/2 z-[60] hidden h-20 w-8 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-[#0d0d1a]/92 text-slate-400 shadow-lg shadow-black/35 backdrop-blur transition-[right,background-color,color] duration-300 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 lg:flex",
        resizing && "bg-white/10 text-white",
      )}
    >
      <ExpandIcon aria-hidden="true" size={16} />
      <span
        aria-hidden="true"
        className="absolute left-2 top-1/2 h-9 w-px -translate-y-1/2 rounded-full bg-white/20"
      />
    </button>
  );
}

function PanelCloseButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close venue details"
      className={cn(
        "h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-slate-400 shadow-lg shadow-black/30 backdrop-blur transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        className,
      )}
    >
      <X aria-hidden="true" size={15} />
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5">
      <p className="truncate text-[11px] font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600">
        {label}
      </p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-[68px] min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.07]">
      <div className="text-slate-400">{icon}</div>
      <p className="mt-2 truncate text-sm font-bold leading-tight text-white">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
    </div>
  );
}

function TagPill({
  tone,
  children,
}: {
  tone: "neutral" | "music" | "price" | "vibe";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-xs font-medium leading-none align-middle",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-slate-400",
        tone === "music" && "border-sky-300/20 bg-sky-400/10 text-sky-200",
        tone === "price" &&
          "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
        tone === "vibe" && "border-amber-300/20 bg-amber-400/10 text-amber-100",
      )}
    >
      {children}
    </span>
  );
}

function badgeVariant(level: string): ComponentProps<typeof Badge>["variant"] {
  if (level === "Overflowing") return "rose";
  if (level === "Packed") return "amber";
  if (level === "Lively") return "emerald";
  if (level === "Warming up") return "cyan";
  return "neutral";
}

function vibeBannerClass(vibe: CrowdVibe) {
  if (vibe === "packed") return "bg-[linear-gradient(135deg,rgba(251,113,133,1),transparent_56%)]";
  if (vibe === "busy") return "bg-[linear-gradient(135deg,rgba(251,191,36,1),transparent_56%)]";
  if (vibe === "perfect") return "bg-[linear-gradient(135deg,rgba(52,211,153,1),transparent_56%)]";
  if (vibe === "chill") return "bg-[linear-gradient(135deg,rgba(56,189,248,1),transparent_56%)]";
  return "bg-[linear-gradient(135deg,rgba(100,116,139,1),transparent_56%)]";
}

function eventStripClass(timeframe: EventItem["timeframe"]) {
  if (timeframe === "now") return "bg-cyan-300";
  if (timeframe === "tonight") return "bg-violet-300";
  if (timeframe === "weekend") return "bg-amber-300";
  return "bg-rose-300";
}
