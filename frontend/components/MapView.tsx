"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RotateCcw, UserRound } from "lucide-react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import type { HeatPoint, Venue } from "@/lib/api";
import { cn } from "@/lib/utils";

type MapViewProps = {
  venues: Venue[];
  heatPoints: HeatPoint[];
  selectedVenueId?: string;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  locationStatus: "idle" | "locating" | "ready" | "blocked";
  showHeat: boolean;
  onRequestLocation: () => void;
  onSelectVenue: (venue: Venue) => void;
};

const TARTU_CENTER: [number, number] = [58.3776, 26.729];
type VenueMarkerKind =
  | "bar"
  | "pub"
  | "food"
  | "club"
  | "music"
  | "wine"
  | "cafe"
  | "terrace"
  | "place";

const markerIcons: Record<VenueMarkerKind, string> = {
  bar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l-5 7-5-7Z"/><path d="M12 11v7"/><path d="M8 20h8"/></svg>',
  pub: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h11v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><path d="M8 8V5"/><path d="M12 8V5"/></svg>',
  food: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v18"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M16 3v18"/><path d="M16 3c3 1 4 4 4 7v2h-4"/></svg>',
  club: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  wine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5a4 4 0 0 1-8 0V3Z"/><path d="M12 12v8"/><path d="M8 21h8"/></svg>',
  cafe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><path d="M6 4h8"/></svg>',
  terrace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 0 1 18 0H3Z"/><path d="M12 10v11"/><path d="M8 21h8"/><path d="M7 10c1-4 3-6 5-6s4 2 5 6"/></svg>',
  place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5 7-11a7 7 0 1 0-14 0c0 6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
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

function escapeHTML(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function venueMarkerKind(venue: Venue): { kind: VenueMarkerKind; label: string } {
  const haystack = [
    venue.name,
    venue.kind,
    venue.area,
    ...venue.tags,
    ...venue.music,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("nightclub") || haystack.includes("club")) {
    return { kind: "club", label: "Club" };
  }
  if (haystack.includes("music") || haystack.includes("culture")) {
    return { kind: "music", label: "Music venue" };
  }
  if (haystack.includes("wine")) {
    return { kind: "wine", label: "Wine bar" };
  }
  if (haystack.includes("cafe") || haystack.includes("coffee")) {
    return { kind: "cafe", label: "Cafe bar" };
  }
  if (haystack.includes("pub") || haystack.includes("beer")) {
    return { kind: "pub", label: "Pub" };
  }
  if (
    haystack.includes("restaurant") ||
    haystack.includes("food") ||
    haystack.includes("dining")
  ) {
    return { kind: "food", label: "Food" };
  }
  if (
    haystack.includes("cocktail") ||
    haystack.includes("shot") ||
    haystack.includes("bar")
  ) {
    return { kind: "bar", label: "Bar" };
  }
  if (
    haystack.includes("terrace") ||
    haystack.includes("yard") ||
    haystack.includes("garden") ||
    haystack.includes("social area")
  ) {
    return { kind: "terrace", label: "Social area" };
  }

  return { kind: "place", label: "Venue" };
}

function dominantVenueCluster(venues: Venue[]) {
  if (venues.length <= 1) {
    return venues;
  }

  const groups = venues.reduce<Map<string, Venue[]>>((acc, venue) => {
    const key = venue.area || "Tartu";
    acc.set(key, [...(acc.get(key) ?? []), venue]);
    return acc;
  }, new Map());

  return [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? venues;
}

function markerHTML(venue: Venue, selected: boolean) {
  const meta = venueMarkerKind(venue);
  const vibeClass = `vmap--${venue.vibe}`;
  const kindClass = `vmap--kind-${meta.kind}`;
  const selectedClass = selected ? " vmap--selected" : "";
  const name = escapeHTML(venue.name);
  const label = escapeHTML(meta.label);

  return `
    <button
      class="vmap ${vibeClass} ${kindClass}${selectedClass}"
      aria-label="${name} · ${label} · ${escapeHTML(venue.vibeLabel)}"
    >
      <span class="vmap__pulse" aria-hidden="true"></span>
      <span class="vmap__shadow" aria-hidden="true"></span>
      <span class="vmap__pin" aria-hidden="true">
        <span class="vmap__shine"></span>
        <span class="vmap__glyph">${markerIcons[meta.kind]}</span>
      </span>
      <span class="vmap__name">${name}</span>
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

export default function MapView({
  venues,
  heatPoints,
  selectedVenueId,
  userLocation,
  locationStatus,
  showHeat,
  onRequestLocation,
  onSelectVenue,
}: MapViewProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const heatRef = useRef<LayerGroup | null>(null);
  const locationLayerRef = useRef<LayerGroup | null>(null);
  const pendingLocateRef = useRef(false);
  const onSelectRef = useRef(onSelectVenue);
  const selectedVenueIdRef = useRef(selectedVenueId);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);

  const [mapReady, setMapReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

      const labelPane = map.createPane("mapLabels");
      labelPane.style.zIndex = "350";
      labelPane.style.pointerEvents = "none";

      // Dark base layer — roads visible, no labels
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
          subdomains: "abcd",
          maxZoom: 19,
          opacity: 1,
        }
      ).addTo(map);

      // Label overlay — street names, subtle, not overwhelming
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          opacity: 0.55,
          pane: "mapLabels",
        }
      ).addTo(map);

      mapRef.current = map;
      requestAnimationFrame(() => {
        map.invalidateSize();
        if (!cancelled) {
          setMapReady(true);
        }
      });
    }

    initMap();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapEl.current) {
      return;
    }

    let frame = 0;
    const invalidateMapSize = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    };

    const resizeObserver = new ResizeObserver(invalidateMapSize);
    resizeObserver.observe(mapEl.current);
    window.addEventListener("resize", invalidateMapSize);
    invalidateMapSize();

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", invalidateMapSize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function paint() {
      const map = mapRef.current;
      if (!mapReady || !map) {
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
        const meta = venueMarkerKind(venue);
        const icon = L.divIcon({
          html: markerHTML(venue, selected),
          className: "vmap-shell",
          iconSize: selected ? [82, 96] : [70, 84],
          iconAnchor: selected ? [41, 70] : [35, 62],
        });
        const marker = L.marker([venue.lat, venue.lng], {
          icon,
          title: venue.name,
          zIndexOffset: selected ? 1000 : 0,
        })
          .addTo(map)
          .on("click", () => onSelectRef.current(venue));
        marker.bindTooltip(`${venue.name} · ${meta.label} · ${venue.vibeLabel}`, {
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
          fillOpacity: Math.max(0.015, point.intensity * 0.04), // large circle
          interactive: false,
        }).addTo(heatRef.current);

        L.circle([point.lat, point.lng], {
          radius: 92 + point.intensity * 95,
          stroke: false,
          fill: true,
          fillColor: color,
          fillOpacity: Math.max(0.03, point.intensity * 0.10), // inner circle
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
  }, [venues, heatPoints, selectedVenueId, showHeat, mapReady]);

  useEffect(() => {
    let cancelled = false;

    async function frameMobileVenueCluster() {
      const map = mapRef.current;
      if (!mapReady || !isMobile || !map || venues.length === 0) {
        return;
      }

      const L = await loadLeaflet();
      if (cancelled) {
        return;
      }

      const cluster = dominantVenueCluster(venues);

      if (cluster.length === 1) {
        map.setView([cluster[0].lat - 0.0012, cluster[0].lng], 15, {
          animate: true,
        });
        return;
      }

      const bounds = L.latLngBounds(
        cluster.map((venue) => [venue.lat, venue.lng] as [number, number]),
      );

      map.fitBounds(bounds, {
        animate: true,
        duration: 0.45,
        maxZoom: 15,
        paddingTopLeft: [44, 120],
        paddingBottomRight: [44, 190],
      });
    }

    frameMobileVenueCluster();

    return () => {
      cancelled = true;
    };
  }, [venues, isMobile, mapReady]);

  useEffect(() => {
    const selectedChanged = selectedVenueIdRef.current !== selectedVenueId;
    selectedVenueIdRef.current = selectedVenueId;
    const selected = venues.find((venue) => venue.id === selectedVenueId);
    if (mapReady && selected && mapRef.current) {
      if (isMobile && !selectedChanged) {
        return;
      }

      // Offset latitude on mobile so the marker is visible above the bottom panel
      const latOffset = isMobile ? 0.003 : 0;
      mapRef.current.flyTo([selected.lat - latOffset, selected.lng], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [selectedVenueId, venues, isMobile, mapReady]);

  useEffect(() => {
    let cancelled = false;

    async function paintLocation() {
      const map = mapRef.current;
      if (!mapReady || !map) return;

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

      if (selectedVenue) {
        L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [selectedVenue.lat, selectedVenue.lng],
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
  }, [selectedVenue, userLocation, mapReady]);

  useEffect(() => {
    if (mapReady && pendingLocateRef.current && userLocation && mapRef.current) {
      pendingLocateRef.current = false;
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [userLocation, mapReady]);

  function findMe() {
    if (userLocation && mapRef.current) {
      const latOffset = isMobile ? 0.003 : 0;
      mapRef.current.flyTo([userLocation.lat - latOffset, userLocation.lng], 16, {
        animate: true,
        duration: 0.65,
      });
      return;
    }

    pendingLocateRef.current = true;
    onRequestLocation();
  }

  function resetMapView() {
    if (isMobile && venues.length > 0) {
      const cluster = dominantVenueCluster(venues);

      if (cluster.length === 1) {
        mapRef.current?.flyTo([cluster[0].lat - 0.0012, cluster[0].lng], 15, {
          animate: true,
          duration: 0.55,
        });
        return;
      }

      mapRef.current?.fitBounds(
        cluster.map((venue) => [venue.lat, venue.lng] as [number, number]),
        {
          animate: true,
          duration: 0.55,
          maxZoom: 15,
          paddingTopLeft: [44, 120],
          paddingBottomRight: [44, 190],
        },
      );
      return;
    }

    const latOffset = isMobile ? 0.003 : 0;
    mapRef.current?.flyTo([TARTU_CENTER[0] - latOffset, TARTU_CENTER[1]], 14, {
      animate: true,
      duration: 0.55,
    });
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapEl} className="h-full w-full" />
      <div className="absolute bottom-[160px] lg:bottom-[92px] right-[10px] z-[540] overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
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
      <MapLegend />
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
        "flex h-11 w-11 items-center justify-center border-0 border-b border-white/10 bg-transparent text-slate-300 transition last:border-b-0 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-cyan-300/80 disabled:cursor-wait disabled:opacity-70",
        active
          ? "bg-cyan-400/15 text-cyan-100"
          : "text-slate-300",
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

function MapLegend() {
  const items = [
    { label: "Chill", color: "bg-sky-400", ring: "ring-sky-300/30" },
    { label: "Good", color: "bg-emerald-400", ring: "ring-emerald-300/30" },
    { label: "Busy", color: "bg-amber-400", ring: "ring-amber-300/30" },
    { label: "Packed", color: "bg-rose-400", ring: "ring-rose-300/30" },
    { label: "Quiet", color: "bg-slate-500", ring: "ring-slate-300/25" },
  ];

  return (
    <div
      aria-label="Map colour key"
      className="pointer-events-none absolute left-1 top-1/2 z-[410] flex w-[5.5rem] -translate-y-1/2 flex-col gap-1 rounded-lg border border-white/10 bg-slate-950/78 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:left-2"
    >
      <span className="border-b border-white/10 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Key
      </span>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-[10px] font-semibold text-slate-200"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2.5 w-2.5 rounded-full ring-2",
              item.color,
              item.ring,
            )}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
