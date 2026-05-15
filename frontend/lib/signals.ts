import type { CrowdVibe, TimeFrame, Venue } from "@/lib/api";

export type Signal = {
  level: string;
  tone: string;
  wait: string;
  pillClass: string;
  dotClass: string;
  barClass: string;
};

export const timeFrames: Array<{ id: TimeFrame; label: string; hint: string }> = [
  { id: "now", label: "Now", hint: "live room feel" },
  { id: "tonight", label: "Tonight", hint: "pre-club window" },
  { id: "late", label: "Late", hint: "after-hours energy" },
  { id: "weekend", label: "Weekend", hint: "peak social mode" },
];

export const vibeFilters: Array<{ id: "all" | CrowdVibe; label: string }> = [
  { id: "all", label: "All" },
  { id: "perfect", label: "Good" },
  { id: "busy", label: "Busy" },
  { id: "packed", label: "Packed" },
  { id: "chill", label: "Chill" },
  { id: "dead", label: "Quiet" },
];

export const vibeReports: Array<{ vibe: CrowdVibe; label: string }> = [
  { vibe: "packed", label: "Packed" },
  { vibe: "busy", label: "Busy" },
  { vibe: "perfect", label: "Perfect" },
  { vibe: "chill", label: "Chill" },
  { vibe: "dead", label: "Dead" },
];

export const areaOptions = [
  "all",
  "Old Town",
  "City Centre",
  "Aparaaditehas",
  "Town Hall Square",
  "Toome Hill",
  "Karlova",
];

export function crowdSignal(percent: number): Signal {
  if (percent > 100) {
    return {
      level: "Overflowing",
      tone: "doors may feel tight",
      wait: "Queue likely",
      pillClass: "bg-rose-50 text-rose-800 ring-rose-200",
      dotClass: "bg-rose-500 shadow-rose-500/30",
      barClass: "w-full bg-rose-500",
    };
  }
  if (percent > 82) {
    return {
      level: "Packed",
      tone: "high-energy crowd",
      wait: "Queue possible",
      pillClass: "bg-amber-50 text-amber-900 ring-amber-200",
      dotClass: "bg-amber-500 shadow-amber-500/30",
      barClass: "w-11/12 bg-amber-500",
    };
  }
  if (percent > 55) {
    return {
      level: "Lively",
      tone: "good social momentum",
      wait: "Easy entry",
      pillClass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      dotClass: "bg-emerald-500 shadow-emerald-500/30",
      barClass: "w-2/3 bg-emerald-500",
    };
  }
  if (percent > 22) {
    return {
      level: "Warming up",
      tone: "comfortable room",
      wait: "Walk in",
      pillClass: "bg-sky-50 text-sky-800 ring-sky-200",
      dotClass: "bg-sky-500 shadow-sky-500/30",
      barClass: "w-5/12 bg-sky-500",
    };
  }
  return {
    level: "Quiet",
    tone: "low-key atmosphere",
    wait: "Walk in",
    pillClass: "bg-slate-100 text-slate-700 ring-slate-200",
    dotClass: "bg-slate-400 shadow-slate-400/30",
    barClass: "w-1/5 bg-slate-400",
  };
}

export function vibePillClass(vibe: CrowdVibe) {
  switch (vibe) {
    case "dead":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "chill":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "perfect":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "busy":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "packed":
      return "bg-rose-50 text-rose-800 ring-rose-200";
  }
}

export function cityMoodFromPercent(percent: number) {
  if (percent > 78) return "City is buzzing";
  if (percent > 54) return "Lively night";
  if (percent > 30) return "Warming up";
  return "Calm start";
}

export function areaMoodFromPercent(percent: number) {
  if (percent > 82) return "Very hot nearby";
  if (percent > 58) return "Strong nearby energy";
  if (percent > 34) return "Easy nearby options";
  return "Quiet pocket";
}

export function distanceMeters(a: Venue, b: Venue) {
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

export function formatUpdated(value?: string) {
  if (!value) return "live";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "live";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
