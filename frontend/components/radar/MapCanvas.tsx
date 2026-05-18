import MapView from "@/components/MapView";
import type { HeatPoint, Venue } from "@/lib/api";

type MapCanvasProps = {
  venues: Venue[];
  heatPoints: HeatPoint[];
  selectedVenueId?: string;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  locationStatus: "idle" | "locating" | "ready" | "blocked";
  showHeat: boolean;
  onRequestLocation: () => void;
  onSelectVenue: (venue: Venue) => void;
};

export default function MapCanvas(props: MapCanvasProps) {
  return (
    <div className="absolute inset-0 z-0">
      <MapView {...props} />
    </div>
  );
}
