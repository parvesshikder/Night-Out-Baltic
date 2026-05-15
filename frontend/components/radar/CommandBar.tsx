import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Flame, MapPin, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { CrowdVibe, EventItem, TimeFrame, Venue } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { areaOptions, timeFrames, vibeFilters } from "@/lib/signals";
import { cn } from "@/lib/utils";

type CommandBarProps = {
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

export default function CommandBar({
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
}: CommandBarProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestions = useMemo(() => {
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
        event,
      }));

    return [...venueSuggestions, ...eventSuggestions].slice(0, 7);
  }, [events, query, venues]);

  const showSuggestions = suggestionsOpen;
  const hasSuggestions = suggestions.length > 0;
  const trimmedQuery = query.trim();

  return (
    <Card id="search" className="relative z-[900] overflow-visible p-2">
      <div className="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_auto_minmax(280px,auto)] xl:items-center">
        <div className="relative min-w-0">
          <label htmlFor="city-search" className="sr-only">
            Search venue, mood, music, or event
          </label>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <Input
              id="city-search"
              value={query}
              onChange={(event) => {
                onQueryChange(event.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onClick={() => setSuggestionsOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSuggestionsOpen(false);
                }
              }}
              role="combobox"
              aria-controls="city-search-suggestions"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
              className="h-10 rounded-md bg-white/[0.045] pl-9"
              placeholder="Search venue, mood, music, event"
            />
          </span>
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                id="city-search-suggestions"
                role="listbox"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute left-0 right-0 top-12 z-[1200] max-h-[min(28rem,70dvh)] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/98 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-cyan-300/10 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    {trimmedQuery ? "Best matches" : "Popular nearby"}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Venue + event search
                  </span>
                </div>
                {hasSuggestions ? suggestions.map((suggestion) => {
                  const isEvent = suggestion.type === "event";
                  const Icon = isEvent ? CalendarDays : MapPin;

                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      role="option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (suggestion.type === "venue") {
                          onVenueSuggestion(suggestion.venue);
                        } else {
                          onEventSuggestion(suggestion.event);
                        }
                        setSuggestionsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.06] focus:outline-none focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300">
                        <Icon aria-hidden="true" size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {suggestion.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {suggestion.meta}
                        </span>
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        {isEvent ? "Event" : "Venue"}
                      </span>
                    </button>
                  );
                }) : (
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
                      onClick={() => {
                        onQueryChange(hint);
                        setSuggestionsOpen(true);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <fieldset className="min-w-0">
          <legend className="sr-only">Time horizon</legend>
          <div className="flex gap-1 overflow-x-auto rounded-md border border-white/10 bg-black/20 p-1">
            {timeFrames.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTimeframeChange(item.id)}
                className={cn(
                  "h-8 shrink-0 rounded-[6px] px-3 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                  timeframe === item.id
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
                )}
                aria-pressed={timeframe === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <label className="min-w-0">
            <span className="sr-only">Area</span>
            <Select
              aria-label="Area"
              value={area}
              onChange={(event) => onAreaChange(event.target.value)}
              className="h-10 rounded-md bg-white/[0.045] text-xs sm:text-sm"
            >
              {areaOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Tartu" : item}
                </option>
              ))}
            </Select>
          </label>

          <label className="min-w-0">
            <span className="sr-only">Crowd vibe</span>
            <Select
              aria-label="Crowd vibe"
              value={vibe}
              onChange={(event) => onVibeChange(event.target.value as "all" | CrowdVibe)}
              className="h-10 rounded-md bg-white/[0.045] text-xs sm:text-sm"
            >
              {vibeFilters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>

          <Button
            type="button"
            variant={showHeat ? "default" : "secondary"}
            size="icon"
            onClick={onShowHeatChange}
            aria-pressed={showHeat}
            aria-label={showHeat ? "Hide heat layer" : "Show heat layer"}
            title={showHeat ? "Hide heat layer" : "Show heat layer"}
            className="h-10 w-10 rounded-md"
          >
            <Flame aria-hidden="true" size={16} />
          </Button>
          <Button
            type="button"
            variant={hasActiveFilters ? "secondary" : "ghost"}
            size="icon"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            aria-label="Reset filters"
            title="Reset filters"
            className="hidden h-10 w-10 rounded-md sm:inline-flex"
          >
            <RotateCcw aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
