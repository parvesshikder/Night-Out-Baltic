"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Flame,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CrowdVibe, EventItem, TimeFrame, Venue } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { areaOptions, timeFrames, vibeFilters } from "@/lib/signals";
import { cn } from "@/lib/utils";

type SearchOverlayProps = {
  query: string;
  onQueryChange: (value: string) => void;
  venues: Venue[];
  events: EventItem[];
  onVenueSuggestion: (venue: Venue) => void;
  onEventSuggestion: (event: EventItem) => void;
  timeframe: TimeFrame;
  onTimeframeChange: (value: TimeFrame) => void;
  vibe: "all" | CrowdVibe;
  onVibeChange: (value: "all" | CrowdVibe) => void;
  area: string;
  onAreaChange: (value: string) => void;
  showHeat: boolean;
  onShowHeatChange: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

type VenueSuggestion = {
  id: string;
  type: "venue";
  title: string;
  meta: string;
  vibe: CrowdVibe;
  venue: Venue;
};

type EventSuggestion = {
  id: string;
  type: "event";
  title: string;
  meta: string;
  badge: string;
  event: EventItem;
};

type SearchSuggestion = VenueSuggestion | EventSuggestion;

export default function SearchOverlay({
  query,
  onQueryChange,
  venues,
  events,
  onVenueSuggestion,
  onEventSuggestion,
  timeframe,
  onTimeframeChange,
  vibe,
  onVibeChange,
  area,
  onAreaChange,
  showHeat,
  onShowHeatChange,
  hasActiveFilters,
  onResetFilters,
}: SearchOverlayProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const needle = query.trim().toLowerCase();
    const venueSuggestions = venues
      .filter((venue) => {
        if (!needle) return true;
        const haystack = [
          venue.name,
          venue.kind,
          venue.area,
          venue.price,
          ...venue.tags,
          ...venue.music,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 4)
      .map((venue) => ({
        id: `venue-${venue.id}`,
        type: "venue" as const,
        title: venue.name,
        meta: `${venue.kind} · ${venue.area}`,
        vibe: venue.vibe,
        venue,
      }));

    const eventSuggestions = events
      .filter((event) => {
        if (!needle) return true;
        const haystack = [
          event.title,
          event.venueName,
          event.description,
          event.price,
          ...event.tags,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 3)
      .map((event) => ({
        id: `event-${event.id}`,
        type: "event" as const,
        title: event.title,
        meta: `${event.startsAt} · ${event.venueName}`,
        badge:
          timeFrames.find((item) => item.id === event.timeframe)?.label ??
          event.timeframe,
        event,
      }));

    return [...venueSuggestions, ...eventSuggestions].slice(0, 7);
  }, [events, query, venues]);

  const venueSuggestions = suggestions.filter(
    (suggestion): suggestion is VenueSuggestion => suggestion.type === "venue",
  );
  const eventSuggestions = suggestions.filter(
    (suggestion): suggestion is EventSuggestion => suggestion.type === "event",
  );
  const areaSelectOptions = areaOptions.map((item) => ({
    value: item,
    label: item === "all" ? "All Tartu" : item,
  }));
  const vibeSelectOptions = vibeFilters.map((item) => ({
    value: item.id,
    label: item.label,
  }));
  const selectedTimeframe =
    timeFrames.find((item) => item.id === timeframe) ?? timeFrames[0];
  const showSuggestions = suggestionsOpen;
  const hasSuggestions = suggestions.length > 0;
  const trimmedQuery = query.trim();

  function closeMobileFilters() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setFiltersOpen(false);
    }
  }

  function chooseSuggestion(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    if (suggestion.type === "venue") {
      onVenueSuggestion(suggestion.venue);
    } else {
      onEventSuggestion(suggestion.event);
    }
    setSuggestionsOpen(false);
  }

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-14 z-40 px-4 py-2">
      <div className="pointer-events-auto max-w-full lg:w-[380px] relative">
        <div className="relative">
          {/* Mobile single row layout */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="city-search-mobile" className="sr-only">
                Search venues, vibes, events
              </label>
              <Search
                aria-hidden="true"
                className={cn(
                  "absolute left-3 top-1/2 z-10 -translate-y-1/2 transition-colors",
                  searchFocused ? "text-cyan-300" : "text-slate-500",
                )}
                size={14}
              />
              <Input
                id="city-search-mobile"
                value={query}
                onChange={(event) => {
                  onQueryChange(event.target.value);
                  setSuggestionsOpen(true);
                  setActiveSuggestionIndex(0);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setSuggestionsOpen(true);
                }}
                onClick={() => setSuggestionsOpen(true)}
                onBlur={() => {
                  setSearchFocused(false);
                  window.setTimeout(() => setSuggestionsOpen(false), 120);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && suggestions.length > 0) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestionIndex(
                      (current) => (current + 1) % suggestions.length,
                    );
                    return;
                  }
                  if (event.key === "ArrowUp" && suggestions.length > 0) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestionIndex(
                      (current) =>
                        (current - 1 + suggestions.length) % suggestions.length,
                    );
                    return;
                  }
                  if (
                    event.key === "Enter" &&
                    showSuggestions &&
                    suggestions.length > 0
                  ) {
                    event.preventDefault();
                    chooseSuggestion(activeSuggestionIndex);
                    return;
                  }
                  if (event.key === "Escape") {
                    setSuggestionsOpen(false);
                  }
                }}
                role="combobox"
                aria-controls="city-search-suggestions"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-activedescendant={
                  showSuggestions && suggestions[activeSuggestionIndex]
                    ? suggestions[activeSuggestionIndex].id
                    : undefined
                }
                className="h-11 w-full rounded-2xl border-white/10 bg-[#0d0d1a]/92 pl-9 pr-3 text-sm text-white placeholder-slate-500 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl outline-none focus:border-cyan-400/40 focus:ring-0"
                placeholder="Search venues..."
              />
            </div>
            
            {/* Timeframe pill — compact dropdown trigger */}
            <button
              type="button"
              onClick={() => { setTimePickerOpen((v) => !v); setFiltersOpen(false); }}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0d0d1a]/92 px-3 text-xs font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl hover:bg-white/10 transition whitespace-nowrap"
            >
              {shortTimeLabel(timeframe)}
              <ChevronDown size={12} className={cn(timePickerOpen && "rotate-180", "transition-transform")} />
            </button>

            {/* Filters icon */}
            <button
              type="button"
              onClick={() => { setFiltersOpen((v) => !v); setTimePickerOpen(false); }}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0d0d1a]/92 text-slate-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <SlidersHorizontal size={15} />
              {hasActiveFilters && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.55)]" />
              )}
            </button>
          </div>

          {/* Desktop full layout */}
          <div className="hidden lg:block lg:space-y-2 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[#0d0d1a]/92 lg:p-2 lg:shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:backdrop-blur-xl">
            <div className="relative min-w-0 flex-1 lg:flex-none">
              <label htmlFor="city-search" className="sr-only">
                Search venues, vibes, events
              </label>
              <Search
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 transition-colors",
                  searchFocused ? "text-cyan-300" : "text-slate-500",
                )}
                size={16}
              />
              <Input
                id="city-search"
                value={query}
                onChange={(event) => {
                  onQueryChange(event.target.value);
                  setSuggestionsOpen(true);
                  setActiveSuggestionIndex(0);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setSuggestionsOpen(true);
                }}
                onClick={() => setSuggestionsOpen(true)}
                onBlur={() => {
                  setSearchFocused(false);
                  window.setTimeout(() => setSuggestionsOpen(false), 120);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && suggestions.length > 0) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestionIndex(
                      (current) => (current + 1) % suggestions.length,
                    );
                    return;
                  }
                  if (event.key === "ArrowUp" && suggestions.length > 0) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestionIndex(
                      (current) =>
                        (current - 1 + suggestions.length) % suggestions.length,
                    );
                    return;
                  }
                  if (
                    event.key === "Enter" &&
                    showSuggestions &&
                    suggestions.length > 0
                  ) {
                    event.preventDefault();
                    chooseSuggestion(activeSuggestionIndex);
                    return;
                  }
                  if (event.key === "Escape") {
                    setSuggestionsOpen(false);
                  }
                }}
                role="combobox"
                aria-controls="city-search-suggestions"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-activedescendant={
                  showSuggestions && suggestions[activeSuggestionIndex]
                    ? suggestions[activeSuggestionIndex].id
                    : undefined
                }
                className="h-11 rounded-xl border-white/10 bg-transparent pl-9 placeholder:text-slate-500 focus:ring-cyan-400/30"
                placeholder="Search venues, vibes, events..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <fieldset className="min-w-0 flex-1">
                <legend className="sr-only">Time horizon</legend>
                <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  {timeFrames.map((item) => (
                    <TimeButton
                      key={item.id}
                      id={item.id}
                      active={timeframe === item.id}
                      label={item.label}
                      onClick={() => onTimeframeChange(item.id)}
                    />
                  ))}
                </div>
              </fieldset>
              <Button
                type="button"
                variant={showHeat ? "default" : "secondary"}
                size="icon"
                onClick={onShowHeatChange}
                aria-pressed={showHeat}
                aria-label={showHeat ? "Hide heat layer" : "Show heat layer"}
                title={showHeat ? "Hide heat layer" : "Show heat layer"}
                className="h-9 min-h-9 w-9 min-w-9 rounded-xl"
              >
                <Flame aria-hidden="true" size={15} />
              </Button>
              <Button
                type="button"
                variant={hasActiveFilters ? "secondary" : "ghost"}
                size="icon"
                onClick={onResetFilters}
                disabled={!hasActiveFilters}
                aria-label="Reset filters"
                title="Reset filters"
                className="h-9 min-h-9 w-9 min-w-9 rounded-xl"
              >
                <RotateCcw aria-hidden="true" size={15} />
              </Button>
              <Button
                type="button"
                variant={filtersOpen || hasActiveFilters ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-expanded={filtersOpen}
                aria-controls="radar-filters"
                aria-label="Toggle area and vibe filters"
                title="Filters"
                className="h-9 min-h-9 w-9 min-w-9 rounded-xl"
              >
                <SlidersHorizontal aria-hidden="true" size={15} />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {timePickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-12 top-[52px] z-[1000] flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#0d0d1a]/98 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl min-w-[140px] lg:hidden"
              >
                {timeFrames.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onTimeframeChange(item.id); setTimePickerOpen(false); }}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                      timeframe === item.id
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {timeframe === item.id && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                id="radar-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="mt-2 overflow-visible rounded-2xl border border-white/10 bg-[#0d0d1a]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:rounded-xl lg:p-1.5"
              >
                <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                  <CustomSelect
                    label="Area"
                    value={area}
                    options={areaSelectOptions}
                    onValueChange={(value) => {
                      onAreaChange(value);
                      closeMobileFilters();
                    }}
                    buttonClassName="text-xs lg:h-9 lg:rounded-lg"
                  />
                  <CustomSelect
                    label="Crowd vibe"
                    value={vibe}
                    options={vibeSelectOptions}
                    onValueChange={(value) => {
                      onVibeChange(value as "all" | CrowdVibe);
                      closeMobileFilters();
                    }}
                    buttonClassName="text-xs lg:h-9 lg:rounded-lg"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SuggestionDropdown
            activeSuggestionIndex={activeSuggestionIndex}
            eventSuggestions={eventSuggestions}
            hasSuggestions={hasSuggestions}
            onActive={setActiveSuggestionIndex}
            onChoose={chooseSuggestion}
            show={showSuggestions}
            trimmedQuery={trimmedQuery}
            venueSuggestions={venueSuggestions}
            suggestions={suggestions}
            onHint={(hint) => {
              onQueryChange(hint);
              setSuggestionsOpen(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TimeButton({
  active,
  id,
  label,
  onClick,
}: {
  active: boolean;
  id: TimeFrame;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "h-9 min-h-9 w-full rounded-lg text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
      )}
      aria-pressed={active}
    >
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortTimeLabel(id)}</span>
    </motion.button>
  );
}

function shortTimeLabel(id: TimeFrame) {
  if (id === "tonight") return "Night";
  if (id === "weekend") return "Wknd";
  if (id === "late") return "Late";
  return "Now";
}

function SuggestionDropdown({
  activeSuggestionIndex,
  eventSuggestions,
  hasSuggestions,
  onActive,
  onChoose,
  onHint,
  show,
  suggestions,
  trimmedQuery,
  venueSuggestions,
}: {
  activeSuggestionIndex: number;
  eventSuggestions: EventSuggestion[];
  hasSuggestions: boolean;
  onActive: (index: number) => void;
  onChoose: (index: number) => void;
  onHint: (hint: string) => void;
  show: boolean;
  suggestions: SearchSuggestion[];
  trimmedQuery: string;
  venueSuggestions: VenueSuggestion[];
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="city-search-suggestions"
          role="listbox"
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="absolute left-0 right-0 top-[52px] lg:top-12 z-[1200] max-h-[min(22rem,60dvh)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d1a]/98 p-1.5 shadow-2xl shadow-black/60 ring-1 ring-cyan-300/10 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {trimmedQuery ? "Best matches" : "Popular nearby"}
            </span>
            <span className="text-[11px] text-slate-600">Venue + event</span>
          </div>
          {hasSuggestions ? (
            <>
              {venueSuggestions.length > 0 && <SuggestionSection label="Venues" />}
              {venueSuggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={suggestions.indexOf(suggestion)}
                  activeIndex={activeSuggestionIndex}
                  onActive={onActive}
                  onSelect={onChoose}
                />
              ))}
              {eventSuggestions.length > 0 && <SuggestionSection label="Events" />}
              {eventSuggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={suggestions.indexOf(suggestion)}
                  activeIndex={activeSuggestionIndex}
                  onActive={onActive}
                  onSelect={onChoose}
                />
              ))}
            </>
          ) : (
            <div className="px-3 py-5 text-sm text-slate-400">
              <p className="font-medium text-slate-200">
                {trimmedQuery ? "No close matches yet" : "Loading suggestions"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Try venue names, areas like Old Town, music styles, or event moods.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-2 py-2">
            {["Old Town", "pub", "live", "cocktails"].map((hint) => (
              <button
                key={hint}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onHint(hint)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              >
                {hint}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuggestionSection({ label }: { label: string }) {
  return (
    <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {label}
    </div>
  );
}

function SuggestionItem({
  suggestion,
  index,
  activeIndex,
  onActive,
  onSelect,
}: {
  suggestion: SearchSuggestion;
  index: number;
  activeIndex: number;
  onActive: (index: number) => void;
  onSelect: (index: number) => void;
}) {
  const isEvent = suggestion.type === "event";
  const Icon = isEvent ? CalendarDays : MapPin;

  return (
    <button
      id={suggestion.id}
      type="button"
      role="option"
      aria-selected={activeIndex === index}
      onMouseEnter={() => onActive(index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(index)}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition focus:outline-none focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        activeIndex === index ? "bg-white/[0.07]" : "hover:bg-white/[0.06]",
      )}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300">
        <Icon aria-hidden="true" size={15} />
        {suggestion.type === "venue" && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-950",
              suggestion.vibe === "dead" && "bg-slate-500",
              suggestion.vibe === "chill" && "bg-sky-400",
              suggestion.vibe === "perfect" && "bg-emerald-400",
              suggestion.vibe === "busy" && "bg-amber-400",
              suggestion.vibe === "packed" && "bg-rose-400",
            )}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">
          {suggestion.title}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {suggestion.meta}
        </span>
      </span>
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {isEvent ? suggestion.badge : "Venue"}
      </span>
    </button>
  );
}
