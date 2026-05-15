import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Flame, MapPinned, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import MapView from "@/components/MapView";
import type {
  ContributionAction,
  CrowdVibe,
  HeatPoint,
  Venue,
} from "@/lib/api";

type CityCanvasProps = {
  cityMood: string;
  hottestArea: string;
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

export default function CityCanvas({
  cityMood,
  hottestArea,
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
}: CityCanvasProps) {
  return (
    <Card className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative h-[64dvh] min-h-[420px] lg:h-[calc(100dvh-13rem)] lg:min-h-[560px]"
      >
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[520] flex flex-wrap gap-2">
          <RadarChip icon={<Radio size={13} />} label="City radar" value={cityMood} tone="cyan" />
          <RadarChip icon={<Flame size={13} />} label="Warmest" value={hottestArea} tone="amber" />
          <RadarChip
            icon={<MapPinned size={13} />}
            label="Venues"
            value={venues.length ? "Live" : "Syncing"}
            tone="neutral"
          />
        </div>
        <MapView
          venues={venues}
          heatPoints={heatPoints}
          selectedVenueId={selectedVenueId}
          popupVenueId={popupVenueId}
          userLocation={userLocation}
          locationStatus={locationStatus}
          showHeat={showHeat}
          onRequestLocation={onRequestLocation}
          onSelectVenue={onSelectVenue}
          onCloseVenuePopup={onCloseVenuePopup}
          busyAction={busyAction}
          onContribution={onContribution}
        />
      </motion.div>
    </Card>
  );
}

function RadarChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "amber" | "neutral";
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.12] bg-slate-950/[0.82] px-3 py-2 shadow-xl shadow-black/20 backdrop-blur-xl">
      <span
        className={
          tone === "cyan"
            ? "text-cyan-300"
            : tone === "amber"
              ? "text-amber-300"
              : "text-slate-400"
        }
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        <span className="block truncate text-xs font-semibold text-white sm:text-sm">
          {value}
        </span>
      </span>
    </div>
  );
}
