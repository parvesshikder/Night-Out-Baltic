"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Beer,
  Coffee,
  Disc3,
  Martini,
  Music2,
  LocateFixed,
  RotateCcw,
  Store,
  TreePalm,
  Utensils,
  UserRound,
  Wine,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  LayerGroup,
  Map,
  Marker,
} from "leaflet";
import type {
  ContributionAction,
  CrowdVibe,
  HeatPoint,
  Venue,
} from "@/lib/api";
import { crowdSignal } from "@/lib/signals";
import { cn } from "@/lib/utils";

type MapViewProps = {
  venues: Venue[];
  heatPoints: HeatPoint[];
  selectedVenueId?: string;
  popupVenueId?: string;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  locationStatus: "idle" | "locating" | "ready" | "blocked";
  showHeat: boolean;
  onRequestLocation: () => void;
  onSelectVenue: (venue: Venue) => void;
  onCloseVenuePopup: () => void;
  busyAction: string | null;
  onContribution: (
    venue: Venue,
    action: ContributionAction,
    vibe?: CrowdVibe,
    options?: { keepPopup?: boolean },
  ) => void;
};

const TARTU_CENTER: [number, number] = [58.3776, 26.729];
type VenueKind =
  | "bar"
  | "pub"
  | "restaurant"
  | "club"
  | "music"
  | "wine"
  | "cafe"
  | "terrace"
  | "place";

const markerIcons: Record<VenueKind, string> = {
  bar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l-5 7-5-7Z"/><path d="M12 11v7"/><path d="M8 20h8"/></svg>',
  pub: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h11v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><path d="M8 8V5"/><path d="M12 8V5"/></svg>',
  restaurant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v18"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M16 3v18"/><path d="M16 3c3 1 4 4 4 7v2h-4"/></svg>',
  club: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3"/><path d="M12 19v3"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  wine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5a4 4 0 0 1-8 0V3Z"/><path d="M12 12v8"/><path d="M8 21h8"/></svg>',
  cafe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><path d="M6 4h8"/></svg>',
  terrace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 0 1 18 0H3Z"/><path d="M12 10v11"/><path d="M8 21h8"/><path d="M7 10c1-4 3-6 5-6s4 2 5 6"/></svg>',
  place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5 7-11a7 7 0 1 0-14 0c0 6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
};

const kindIcons: Record<VenueKind, LucideIcon> = {
  bar: Martini,
  pub: Beer,
  restaurant: Utensils,
  club: Disc3,
  music: Music2,
  wine: Wine,
  cafe: Coffee,
  terrace: TreePalm,
  place: Store,
};

async function loadLeaflet() {
  const module = await import("leaflet");
  return "default" in module ? module.default : module;
}

function heatColor(intensity: number) {
  if (intensity > 0.82) return "#fecdd3";
  if (intensity > 0.62) return "#fde68a";
  if (intensity > 0.42) return "#bbf7d0";
  return "#bae6fd";
}

function markerClass(venue: Venue, selected: boolean) {
  const kind = venueKind(venue).kind;
  const classes = [
    "venue-marker",
    `venue-marker--${venue.vibe}`,
    `venue-marker--type-${kind}`,
  ];
  if (selected) {
    classes.push("venue-marker--selected");
  }
  return classes.join(" ");
}

function markerText(venue: Venue) {
  switch (venue.vibe) {
    case "dead":
      return "Calm";
    case "chill":
      return "Chill";
    case "perfect":
      return "Live";
    case "busy":
      return "Buzz";
    case "packed":
      return "Heat";
    default:
      return "Live";
  }
}

function escapeHTML(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function venueKind(venue: Venue): { kind: VenueKind; label: string } {
  const kind = venue.kind.toLowerCase();

  if (kind.includes("restaurant")) return { kind: "restaurant", label: "Restaurant" };
  if (kind.includes("pub") || kind.includes("beer")) return { kind: "pub", label: "Pub" };
  if (kind.includes("nightclub") || kind.includes("club")) return { kind: "club", label: "Club" };
  if (kind.includes("music") || kind.includes("culture")) return { kind: "music", label: "Music" };
  if (kind.includes("wine")) return { kind: "wine", label: "Wine bar" };
  if (kind.includes("cafe")) return { kind: "cafe", label: "Cafe bar" };
  if (kind.includes("garden") || kind.includes("terrace") || kind.includes("area")) {
    return { kind: "terrace", label: "Terrace" };
  }
  if (kind.includes("bar")) return { kind: "bar", label: "Bar" };

  return { kind: "place", label: "Venue" };
}

function markerHTML(venue: Venue, selected: boolean) {
  const meta = venueKind(venue);
  return `
    <button class="${markerClass(venue, selected)}" aria-label="${escapeHTML(venue.name)}, ${escapeHTML(meta.label)}">
      <span class="venue-marker__halo"></span>
      <span class="venue-marker__pin">
        <span class="venue-marker__glyph">${markerIcons[meta.kind]}</span>
      </span>
      <span class="venue-marker__label">${escapeHTML(markerText(venue))}</span>
    </button>
  `;
}

function userLocationHTML() {
  return `
    <span class="user-location-marker" aria-label="Your location">
      <span class="user-location-marker__ring"></span>
      <span class="user-location-marker__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="7.5" r="3.2"></circle>
          <path d="M6.5 20.5a5.5 5.5 0 0 1 11 0"></path>
        </svg>
      </span>
      <span class="user-location-marker__label">You</span>
    </span>
  `;
}

function distanceBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const earth = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function MapView({
  venues,
  heatPoints,
  selectedVenueId,
  popupVenueId,
  userLocation,
  locationStatus,
  showHeat,
  onRequestLocation,
  onSelectVenue,
  onCloseVenuePopup,
  busyAction,
  onContribution,
}: MapViewProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const heatRef = useRef<LayerGroup | null>(null);
  const locationLayerRef = useRef<LayerGroup | null>(null);
  const pendingLocateRef = useRef(false);
  const onSelectRef = useRef(onSelectVenue);
  const popupVenue = venues.find((venue) => venue.id === popupVenueId);

  useEffect(() => {
    onSelectRef.current = onSelectVenue;
  }, [onSelectVenue]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapEl.current || mapRef.current) {
        return;
      }

      const L = await loadLeaflet();

      if (cancelled || !mapEl.current) {
        return;
      }

      const map = L.map(mapEl.current, {
        center: TARTU_CENTER,
        zoom: 14,
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function paint() {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const L = await loadLeaflet();

      if (cancelled) {
        return;
      }

      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];

      for (const venue of venues) {
        const selected = venue.id === selectedVenueId;
        const icon = L.divIcon({
          html: markerHTML(venue, selected),
          className: "venue-marker-shell",
          iconSize: selected ? [88, 92] : [70, 76],
          iconAnchor: selected ? [44, 46] : [35, 38],
        });
        const marker = L.marker([venue.lat, venue.lng], {
          icon,
          title: venue.name,
          zIndexOffset: selected ? 1000 : 0,
        })
          .addTo(map)
          .on("click", () => onSelectRef.current(venue));
        marker.bindTooltip(`${venue.name} · ${venue.vibeLabel}`, {
          direction: "top",
          offset: [0, -22],
          opacity: 0.92,
        });
        markersRef.current.push(marker);
      }

      if (!heatRef.current) {
        heatRef.current = L.layerGroup();
      } else {
        heatRef.current.clearLayers();
      }

      for (const point of heatPoints) {
        const color = heatColor(point.intensity);

        L.circle([point.lat, point.lng], {
          radius: 210 + point.intensity * 190,
          stroke: false,
          fill: true,
          fillColor: color,
          fillOpacity: Math.max(0.018, point.intensity * 0.045),
          interactive: false,
        }).addTo(heatRef.current);

        L.circle([point.lat, point.lng], {
          radius: 92 + point.intensity * 95,
          stroke: false,
          fill: true,
          fillColor: color,
          fillOpacity: Math.max(0.035, point.intensity * 0.12),
          interactive: false,
        }).addTo(heatRef.current);
      }

      if (showHeat && !map.hasLayer(heatRef.current)) {
        heatRef.current.addTo(map);
      }
      if (!showHeat && map.hasLayer(heatRef.current)) {
        heatRef.current.remove();
      }
    }

    paint();

    return () => {
      cancelled = true;
    };
  }, [venues, heatPoints, selectedVenueId, showHeat]);

  useEffect(() => {
    const selected = venues.find((venue) => venue.id === selectedVenueId);
    if (selected && mapRef.current) {
      mapRef.current.flyTo([selected.lat, selected.lng], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [selectedVenueId, venues]);

  useEffect(() => {
    let cancelled = false;

    async function paintLocation() {
      const map = mapRef.current;
      if (!map) return;

      const L = await loadLeaflet();
      if (cancelled) return;

      if (!locationLayerRef.current) {
        locationLayerRef.current = L.layerGroup().addTo(map);
      } else {
        locationLayerRef.current.clearLayers();
      }

      if (!userLocation) return;

      L.circle([userLocation.lat, userLocation.lng], {
        radius: Math.min(Math.max(userLocation.accuracy ?? 28, 24), 90),
        stroke: false,
        fill: true,
        fillColor: "#22d3ee",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(locationLayerRef.current);

      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          html: userLocationHTML(),
          className: "user-location-shell",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
        zIndexOffset: 1200,
      })
        .addTo(locationLayerRef.current)
        .bindTooltip("You are here", {
          direction: "top",
          offset: [0, -14],
          opacity: 0.92,
        });

      if (popupVenue) {
        L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [popupVenue.lat, popupVenue.lng],
          ],
          {
            color: "#67e8f9",
            weight: 2,
            opacity: 0.62,
            dashArray: "4 8",
            lineCap: "round",
            interactive: false,
          },
        ).addTo(locationLayerRef.current);
      }
    }

    paintLocation();

    return () => {
      cancelled = true;
    };
  }, [popupVenue, userLocation]);

  useEffect(() => {
    if (pendingLocateRef.current && userLocation && mapRef.current) {
      pendingLocateRef.current = false;
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [userLocation]);

  function findMe() {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 0.65,
      });
      return;
    }

    pendingLocateRef.current = true;
    onRequestLocation();
  }

  function resetMapView() {
    mapRef.current?.flyTo(TARTU_CENTER, 14, {
      animate: true,
      duration: 0.55,
    });
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapEl} className="h-full w-full" />
      <div className="absolute bottom-[92px] right-[10px] z-[540] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
        <MapControlButton
          label={locationStatus === "locating" ? "Finding you" : "Find me"}
          onClick={findMe}
          active={locationStatus === "ready"}
          disabled={locationStatus === "locating"}
        >
          <UserRound aria-hidden="true" size={16} />
        </MapControlButton>
        <MapControlButton label="Reset map view" onClick={resetMapView}>
          <RotateCcw aria-hidden="true" size={16} />
        </MapControlButton>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] hidden max-w-64 rounded-lg border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:block">
        <strong className="block text-sm font-semibold text-slate-950">
          Tartu live vibe
        </strong>
        <span className="mt-0.5 block text-xs text-slate-500">
          {locationStatusCopy(locationStatus)}
        </span>
      </div>
      <AnimatePresence mode="wait">
        {popupVenue && (
          <MapVenueCard
            key={popupVenue.id}
            venue={popupVenue}
            userLocation={userLocation}
            locationStatus={locationStatus}
            busyAction={busyAction}
            onClose={onCloseVenuePopup}
            onContribution={onContribution}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MapControlButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center border-0 border-b border-slate-200 bg-white text-slate-900 transition last:border-b-0 hover:bg-slate-50 focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-cyan-300/80 disabled:cursor-wait disabled:opacity-70",
        active
          ? "bg-cyan-50 text-cyan-700"
          : "text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function MapVenueCard({
  venue,
  userLocation,
  locationStatus,
  busyAction,
  onClose,
  onContribution,
}: {
  venue: Venue;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  locationStatus: "idle" | "locating" | "ready" | "blocked";
  busyAction: string | null;
  onClose: () => void;
  onContribution: (
    venue: Venue,
    action: ContributionAction,
    vibe?: CrowdVibe,
    options?: { keepPopup?: boolean },
  ) => void;
}) {
  const [feedback, setFeedback] = useState<"going" | "checkin" | null>(null);
  const signal = crowdSignal(venue.crowdPercent);
  const meta = venueKind(venue);
  const Icon = kindIcons[meta.kind];
  const isBusy = busyAction?.startsWith(`${venue.id}-`) ?? false;
  const distanceLabel = userLocation
    ? formatDistance(distanceBetween(userLocation, venue))
    : locationStatus === "blocked"
      ? "Location off"
      : "Finding you";

  function showFeedback(nextFeedback: "going" | "checkin") {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  return (
    <motion.aside
      aria-live="polite"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-3 top-20 z-[540] w-[min(21rem,calc(100%-1.5rem))] rounded-xl border border-slate-200 bg-white/95 p-3 text-slate-950 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:top-3"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            iconTone(meta.kind),
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {venue.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                {venue.price}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${venue.name} popup`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
              >
                <X aria-hidden="true" size={15} />
              </button>
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {meta.label} · {venue.area}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700">
            <LocateFixed aria-hidden="true" size={12} />
            {distanceLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniSignal label="Mood" value={signal.level} />
        <MiniSignal label="Entry" value={signal.wait} />
        <MiniSignal label="Music" value={venue.music[0] ?? "Mixed"} />
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <p className="text-xs font-semibold text-slate-800">Quick signal</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <PopupAction
            label="Going"
            disabled={isBusy}
            tone="going"
            active={feedback === "going"}
            onClick={() => {
              showFeedback("going");
              onContribution(venue, "going");
            }}
          />
          <PopupAction
            icon={<BadgeCheck aria-hidden="true" size={13} />}
            label="Check in"
            disabled={isBusy}
            tone="checkin"
            active={feedback === "checkin"}
            onClick={() => {
              showFeedback("checkin");
              onContribution(venue, "check_in");
            }}
          />
          <PopupAction
            label="Skip"
            disabled={isBusy}
            tone="skip"
            onClick={() => {
              onContribution(venue, "not_going", undefined, { keepPopup: false });
              onClose();
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          {feedback && <ActionFeedback key={feedback} kind={feedback} />}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function PopupAction({
  icon,
  label,
  disabled,
  tone,
  active = false,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  disabled: boolean;
  tone: "going" | "checkin" | "skip";
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 disabled:opacity-50",
        tone === "going" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
        tone === "checkin" &&
          "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100",
        tone === "skip" &&
          "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
        active && "ring-2 ring-offset-1 ring-offset-slate-50",
        active && tone === "going" && "ring-emerald-300",
        active && tone === "checkin" && "ring-cyan-300",
      )}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function ActionFeedback({ kind }: { kind: "going" | "checkin" }) {
  const isGoing = kind === "going";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "relative mt-2 overflow-hidden rounded-lg border px-3 py-2",
        isGoing
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-cyan-200 bg-cyan-50 text-cyan-900",
      )}
    >
      <motion.span
        aria-hidden="true"
        initial={{ x: "-100%" }}
        animate={{ x: "120%" }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        className={cn(
          "absolute inset-y-0 w-16 skew-x-[-18deg] opacity-50",
          isGoing ? "bg-emerald-200" : "bg-cyan-200",
        )}
      />
      <div className="relative flex items-center gap-2">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-lg",
            isGoing ? "bg-emerald-500 shadow-emerald-500/20" : "bg-cyan-500 shadow-cyan-500/20",
          )}
        >
          {isGoing ? (
            <LocateFixed aria-hidden="true" size={14} />
          ) : (
            <BadgeCheck aria-hidden="true" size={14} />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold">
            {isGoing ? "Nice, route saved" : "Check-in confirmed"}
          </span>
          <span className="block truncate text-[11px] opacity-75">
            {isGoing ? "This venue signal is warming up." : "You helped make the live vibe sharper."}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

function locationStatusCopy(status: MapViewProps["locationStatus"]) {
  if (status === "ready") return "Your location is on · vibe-level signals";
  if (status === "locating") return "Finding your location · vibe-level signals";
  if (status === "blocked") return "Location off · vibe-level signals";
  return "OpenStreetMap base · vibe-level signals";
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <p className="truncate text-xs font-semibold text-slate-950">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function iconTone(kind: VenueKind) {
  switch (kind) {
    case "pub":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "restaurant":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "club":
    case "music":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "wine":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "cafe":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "terrace":
      return "border-lime-200 bg-lime-50 text-lime-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}
