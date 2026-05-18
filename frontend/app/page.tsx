"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppChrome from "@/components/radar/AppChrome";
import type { AppChromeTarget } from "@/components/radar/AppChrome";
import MapCanvas from "@/components/radar/MapCanvas";
import RadarChips from "@/components/radar/RadarChips";
import SearchOverlay from "@/components/radar/SearchOverlay";
import VenueDetailPanel from "@/components/radar/VenueDetailPanel";
import VenueTray from "@/components/radar/VenueTray";
import {
  contribute,
  getEvents as getLiveEvents,
  getHeatmap as getLiveHeatmap,
  getVenues as getLiveVenues,
} from "@/lib/api";
import type {
  ContributionAction,
  CrowdVibe,
  EventItem,
  HeatPoint,
  TimeFrame,
  Venue,
} from "@/lib/api";
import {
  type DemoLedger,
  getDemoEvents,
  getDemoHeatmap,
  getDemoVenues,
  recordDemoContribution,
} from "@/lib/demo-data";
import {
  areaMoodFromPercent,
  cityMoodFromPercent,
  distanceMeters,
} from "@/lib/signals";

type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

const initialVenues = getDemoVenues({ timeframe: "now" });
const initialEvents = getDemoEvents({ timeframe: "now" });
const initialHeatPoints = getDemoHeatmap("now");

export default function Home() {
  const [timeframe, setTimeframe] = useState<TimeFrame>("now");
  const [query, setQuery] = useState("");
  const [vibe, setVibe] = useState<"all" | CrowdVibe>("all");
  const [area, setArea] = useState("all");
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [suggestionVenues, setSuggestionVenues] =
    useState<Venue[]>(initialVenues);
  const [suggestionEvents, setSuggestionEvents] =
    useState<EventItem[]>(initialEvents);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>(initialHeatPoints);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(
    initialVenues[0]?.id,
  );
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [chromeTarget, setChromeTarget] = useState<AppChromeTarget>("radar");
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [showHeat, setShowHeat] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "locating" | "ready" | "blocked"
  >("idle");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const demoLedgerRef = useRef<DemoLedger>({});

  const refresh = useCallback(async () => {
    let nextVenues: Venue[];
    let nextEvents: EventItem[];
    let nextHeat: HeatPoint[];

    try {
      [nextVenues, nextEvents, nextHeat] = await Promise.all([
        getLiveVenues({ timeframe, query, vibe, area }),
        getLiveEvents({ timeframe, query }),
        getLiveHeatmap(timeframe),
      ]);
      if (
        nextVenues.length === 0 &&
        nextEvents.length === 0 &&
        nextHeat.length === 0
      ) {
        throw new Error("empty live dataset");
      }
    } catch {
      nextVenues = getDemoVenues(
        { timeframe, query, vibe, area },
        demoLedgerRef.current,
      );
      nextEvents = getDemoEvents({ timeframe, query });
      nextHeat = getDemoHeatmap(timeframe, demoLedgerRef.current);
    }

    setVenues(nextVenues);
    setEvents(nextEvents);
    setHeatPoints(nextHeat);

    if (!selectedVenueId && nextVenues.length > 0) {
      setSelectedVenueId(nextVenues[0].id);
    }

    if (
      selectedVenueId &&
      !nextVenues.some((venue) => venue.id === selectedVenueId)
    ) {
      setSelectedVenueId(nextVenues[0]?.id);
    }

  }, [area, query, selectedVenueId, timeframe, vibe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    async function loadSuggestionPool() {
      try {
        const [nextVenues, nextEvents] = await Promise.all([
          getLiveVenues({ timeframe }),
          getLiveEvents({ timeframe }),
        ]);
        if (nextVenues.length === 0 && nextEvents.length === 0) {
          throw new Error("empty suggestion dataset");
        }
        setSuggestionVenues(nextVenues);
        setSuggestionEvents(nextEvents);
      } catch {
        setSuggestionVenues(
          getDemoVenues({ timeframe }, demoLedgerRef.current),
        );
        setSuggestionEvents(getDemoEvents({ timeframe }));
      }
    }

    loadSuggestionPool();
  }, [timeframe]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh();
    }, 7000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("blocked");
      return;
    }

    setLocationStatus("locating");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("blocked");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20000,
        timeout: 12000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const requestUserLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("blocked");
      setToast("Location is not available in this browser.");
      return;
    }

    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("ready");
        setToast("Location found.");
      },
      () => {
        setLocationStatus("blocked");
        setToast("Location permission is blocked.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 12000,
      },
    );
  }, []);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId),
    [selectedVenueId, venues],
  );

  const cityPulse = useMemo(() => {
    const hottest = [...venues].sort((a, b) => b.crowdPercent - a.crowdPercent)[0];
    const averageLoad =
      venues.length > 0
        ? venues.reduce((sum, venue) => sum + venue.crowdPercent, 0) / venues.length
        : 0;
    const areaHeat = venues.reduce<Record<string, number>>((acc, venue) => {
      acc[venue.area] = (acc[venue.area] ?? 0) + venue.crowdPercent;
      return acc;
    }, {});
    const hottestArea = Object.entries(areaHeat).sort((a, b) => b[1] - a[1])[0];

    return {
      cityMood: cityMoodFromPercent(averageLoad),
      hottest,
      hottestArea: hottestArea?.[0] ?? "Tartu",
    };
  }, [venues]);

  const areaInsight = useMemo(() => {
    if (!selectedVenue) return null;
    const nearby = venues
      .filter((venue) => distanceMeters(selectedVenue, venue) <= 650)
      .sort((a, b) => b.crowdPercent - a.crowdPercent);
    const average =
      nearby.length > 0
        ? Math.round(
            nearby.reduce((sum, venue) => sum + venue.crowdPercent, 0) /
              nearby.length,
          )
        : 0;

    return {
      mood: areaMoodFromPercent(average),
      hottest: nearby[0],
    };
  }, [selectedVenue, venues]);

  async function handleContribution(
    action: ContributionAction,
    vibeReport?: CrowdVibe,
    venueId?: string,
  ) {
    const targetVenueId = venueId ?? selectedVenue?.id;
    if (!targetVenueId) return;

    setBusyAction(`${targetVenueId}-${action}-${vibeReport ?? "none"}`);

    try {
      const response = await contribute(targetVenueId, timeframe, {
        action,
        vibe: vibeReport,
      });
      setVenues((current) =>
        current.map((venue) =>
          venue.id === response.venue.id ? response.venue : venue,
        ),
      );
      setSelectedVenueId(response.venue.id);
      setHeatPoints(await getLiveHeatmap(timeframe));
      setToast(response.message);
    } catch {
      recordDemoContribution(
        demoLedgerRef.current,
        targetVenueId,
        action,
        vibeReport,
      );

      const nextVenues = getDemoVenues(
        { timeframe, query, vibe, area },
        demoLedgerRef.current,
      );
      const fullDemoVenues = getDemoVenues(
        { timeframe },
        demoLedgerRef.current,
      );
      const updatedVenue = fullDemoVenues.find(
        (venue) => venue.id === targetVenueId,
      );

      setVenues(nextVenues);
      setSuggestionVenues(fullDemoVenues);
      setEvents(getDemoEvents({ timeframe, query }));
      setSuggestionEvents(getDemoEvents({ timeframe }));
      setHeatPoints(getDemoHeatmap(timeframe, demoLedgerRef.current));
      setSelectedVenueId(updatedVenue?.id ?? targetVenueId);
      setToast(
        action === "not_going"
          ? "Skipped. The Tartu signal stayed unchanged."
          : "Tartu demo signal updated.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function selectVenue(venue: Venue) {
    setSelectedVenueId(venue.id);
    setDetailPanelOpen(true);
    setChromeTarget("venues");
    setActiveEvent(null);
  }

  function selectVenueSuggestion(venue: Venue) {
    setQuery(venue.name);
    setSelectedVenueId(venue.id);
    setDetailPanelOpen(true);
    setChromeTarget("venues");
    setActiveEvent(null);
    setArea("all");
    setVibe("all");
  }

  function selectEventSuggestion(event: EventItem) {
    setTimeframe(event.timeframe);
    setQuery(event.title);
    setArea("all");
    setVibe("all");
    setSelectedVenueId(event.venueId);
    setDetailPanelOpen(true);
    setChromeTarget("events");
    setActiveEvent(event);
  }

  function resetFilters() {
    setQuery("");
    setTimeframe("now");
    setVibe("all");
    setArea("all");
  }

  function scrollToPanelSection(target: Exclude<AppChromeTarget, "radar">) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  function handleChromeNavigate(target: AppChromeTarget) {
    setChromeTarget(target);

    if (target === "radar") {
      setDetailPanelOpen(false);
      document.getElementById("radar")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (!selectedVenueId && venues[0]) {
      setSelectedVenueId(venues[0].id);
    }

    setDetailPanelOpen(true);
    scrollToPanelSection(target);
  }

  const hasActiveFilters =
    query.trim() !== "" || timeframe !== "now" || vibe !== "all" || area !== "all";

  return (
    <main
      id="radar"
      className="relative h-dvh w-screen overflow-hidden bg-[#0d0d1a] text-slate-100"
    >
      <AppChrome activeTarget={chromeTarget} onNavigate={handleChromeNavigate} />

      <MapCanvas
        venues={venues}
        heatPoints={heatPoints}
        selectedVenueId={selectedVenueId}
        userLocation={userLocation}
        locationStatus={locationStatus}
        showHeat={showHeat}
        onRequestLocation={requestUserLocation}
        onSelectVenue={selectVenue}
      />

      <SearchOverlay
        query={query}
        onQueryChange={setQuery}
        venues={suggestionVenues.length ? suggestionVenues : venues}
        events={suggestionEvents.length ? suggestionEvents : events}
        onVenueSuggestion={selectVenueSuggestion}
        onEventSuggestion={selectEventSuggestion}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        vibe={vibe}
        onVibeChange={setVibe}
        area={area}
        onAreaChange={setArea}
        showHeat={showHeat}
        onShowHeatChange={() => setShowHeat((value) => !value)}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      <RadarChips
        cityMood={cityPulse.cityMood}
        hottestArea={cityPulse.hottestArea}
        venueCount={venues.length}
      />

      <VenueTray
        venues={venues}
        selectedVenueId={selectedVenueId}
        cityMood={cityPulse.cityMood}
        onSelectVenue={selectVenue}
      />

      <VenueDetailPanel
        isOpen={detailPanelOpen}
        venue={selectedVenue}
        activeEvent={activeEvent}
        venues={venues}
        selectedVenueId={selectedVenueId}
        events={events}
        areaInsight={areaInsight}
        busyAction={busyAction}
        onClose={() => {
          setDetailPanelOpen(false);
          setChromeTarget("radar");
        }}
        onContribution={(action, vibeReport) =>
          handleContribution(action, vibeReport)
        }
        onSelectEvent={selectEventSuggestion}
        onSelectVenue={selectVenue}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-atomic="true"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="fixed bottom-20 left-4 right-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm font-medium text-slate-100 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={16} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
