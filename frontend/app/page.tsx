"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppChrome from "@/components/radar/AppChrome";
import CityCanvas from "@/components/radar/CityCanvas";
import CommandBar from "@/components/radar/CommandBar";
import SignalBoard from "@/components/radar/SignalBoard";
import VenueDossier from "@/components/radar/VenueDossier";
import { contribute, getEvents, getHeatmap, getVenues } from "@/lib/api";
import type {
  ContributionAction,
  CrowdVibe,
  EventItem,
  HeatPoint,
  TimeFrame,
  Venue,
} from "@/lib/api";
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

export default function Home() {
  const [timeframe, setTimeframe] = useState<TimeFrame>("now");
  const [query, setQuery] = useState("");
  const [vibe, setVibe] = useState<"all" | CrowdVibe>("all");
  const [area, setArea] = useState("all");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [suggestionVenues, setSuggestionVenues] = useState<Venue[]>([]);
  const [suggestionEvents, setSuggestionEvents] = useState<EventItem[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [popupVenueId, setPopupVenueId] = useState<string | undefined>();
  const [showHeat, setShowHeat] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "locating" | "ready" | "blocked"
  >("idle");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextVenues, nextEvents, nextHeat] = await Promise.all([
      getVenues({ timeframe, query, vibe, area }),
      getEvents({ timeframe, query }),
      getHeatmap(timeframe),
    ]);

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

    if (
      popupVenueId &&
      !nextVenues.some((venue) => venue.id === popupVenueId)
    ) {
      setPopupVenueId(undefined);
    }
  }, [area, popupVenueId, query, selectedVenueId, timeframe, vibe]);

  useEffect(() => {
    refresh().catch(() => setToast("Could not sync live signals."));
  }, [refresh]);

  useEffect(() => {
    async function loadSuggestionPool() {
      const [nextVenues, nextEvents] = await Promise.all([
        getVenues({ timeframe }),
        getEvents({ timeframe }),
      ]);
      setSuggestionVenues(nextVenues);
      setSuggestionEvents(nextEvents);
    }

    loadSuggestionPool().catch(() => setToast("Search suggestions could not sync."));
  }, [timeframe]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh().catch(() => setToast("Live signal refresh failed."));
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
    options: { keepPopup?: boolean } = {},
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
      setPopupVenueId(options.keepPopup === false ? undefined : response.venue.id);
      setHeatPoints(await getHeatmap(timeframe));
      setToast(response.message);
    } catch {
      setToast("Contribution could not be saved.");
    } finally {
      setBusyAction(null);
    }
  }

  function selectVenue(venue: Venue) {
    setSelectedVenueId(venue.id);
    setPopupVenueId(venue.id);
  }

  function selectVenueSuggestion(venue: Venue) {
    setQuery(venue.name);
    setSelectedVenueId(venue.id);
    setPopupVenueId(venue.id);
    setArea("all");
    setVibe("all");
  }

  function selectEventSuggestion(event: EventItem) {
    setTimeframe(event.timeframe);
    setQuery(event.title);
    setArea("all");
    setVibe("all");
    setSelectedVenueId(event.venueId);
    setPopupVenueId(event.venueId);
  }

  function resetFilters() {
    setQuery("");
    setTimeframe("now");
    setVibe("all");
    setArea("all");
  }

  const hasActiveFilters =
    query.trim() !== "" || timeframe !== "now" || vibe !== "all" || area !== "all";

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <AppChrome />

      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section id="radar" className="grid min-w-0 scroll-mt-20 gap-4">
          <CommandBar
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

          <CityCanvas
            cityMood={cityPulse.cityMood}
            hottestArea={cityPulse.hottestArea}
            venues={venues}
            heatPoints={heatPoints}
            selectedVenueId={selectedVenueId}
            popupVenueId={popupVenueId}
            userLocation={userLocation}
            locationStatus={locationStatus}
            showHeat={showHeat}
            onRequestLocation={requestUserLocation}
            onSelectVenue={selectVenue}
            onCloseVenuePopup={() => setPopupVenueId(undefined)}
            busyAction={busyAction}
            onContribution={(venue, action, vibeReport, options) =>
              handleContribution(action, vibeReport, venue.id, options)
            }
          />

          <SignalBoard
            venues={venues}
            selectedVenueId={selectedVenueId}
            onSelectVenue={selectVenue}
          />
        </section>

        <VenueDossier
          venue={selectedVenue}
          events={events}
          areaInsight={areaInsight}
          busyAction={busyAction}
          onContribution={handleContribution}
          onSelectEvent={selectEventSuggestion}
        />
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-[1000] max-w-[calc(100vw-2rem)] rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 shadow-2xl shadow-black/40"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
