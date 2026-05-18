"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RotateCcw, UserRound } from "lucide-react";
import type { LayerGroup, Map, Marker } from "leaflet";
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

function markerHTML(venue: Venue, selected: boolean) {
  const pct = Math.round(venue.crowdPercent);
  const vibeClass = `vmap--${venue.vibe}`;
  const selectedClass = selected ? " vmap--selected" : "";
  const name = escapeHTML(venue.name);

  return `
    <button
      class="vmap ${vibeClass}${selectedClass}"
      aria-label="${name} · ${escapeHTML(venue.vibeLabel)} · ${pct}% crowd"
    >
      <span class="vmap__pulse" aria-hidden="true"></span>
      <span class="vmap__aura" aria-hidden="true"></span>
      <span class="vmap__core" aria-hidden="true">
        <span class="vmap__pct">${pct}%</span>
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
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const heatRef = useRef<LayerGroup | null>(null);
  const locationLayerRef = useRef<LayerGroup | null>(null);
  const pendingLocateRef = useRef(false);
  const onSelectRef = useRef(onSelectVenue);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);

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
      requestAnimationFrame(() => map.invalidateSize());
    }

    initMap();

    return () => {
      cancelled = true;
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
          className: "vmap-shell",
          iconSize: selected ? [76, 88] : [60, 72],
          iconAnchor: selected ? [38, 56] : [30, 48],
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
  }, [venues, heatPoints, selectedVenueId, showHeat]);

  useEffect(() => {
    const selected = venues.find((venue) => venue.id === selectedVenueId);
    if (selected && mapRef.current) {
      // Offset latitude on mobile so the marker is visible above the bottom panel
      const latOffset = isMobile ? 0.003 : 0;
      mapRef.current.flyTo([selected.lat - latOffset, selected.lng], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [selectedVenueId, venues, isMobile]);

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
  }, [selectedVenue, userLocation]);

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
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] hidden max-w-64 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl shadow-black/25 backdrop-blur-xl sm:block">
        <strong className="block text-sm font-semibold text-white">
          Tartu live vibe
        </strong>
        <span className="mt-0.5 block text-xs text-slate-400">
          {locationStatusCopy(locationStatus)}
        </span>
      </div>
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

function locationStatusCopy(status: MapViewProps["locationStatus"]) {
  if (status === "ready") return "Your location is on · vibe-level signals";
  if (status === "locating") return "Finding your location · vibe-level signals";
  if (status === "blocked") return "Location off · vibe-level signals";
  return "Dark map base · vibe-level signals";
}
