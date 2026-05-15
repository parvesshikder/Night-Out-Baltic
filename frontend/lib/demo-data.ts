import type {
  ContributionAction,
  CrowdVibe,
  EventItem,
  HeatPoint,
  TimeFrame,
  Venue,
} from "@/lib/api";

type DemoVenueSeed = Omit<
  Venue,
  | "crowd"
  | "crowdPercent"
  | "heat"
  | "vibe"
  | "vibeLabel"
  | "waitMinutes"
  | "trending"
  | "lastUpdated"
  | "events"
> & {
  baseCrowd: Record<TimeFrame, number>;
};

export type DemoLedger = Record<
  string,
  {
    going: number;
    checkIns: number;
    vibe?: CrowdVibe;
  }
>;

const demoEvents: EventItem[] = [
  {
    id: "demo-evt-gen-live",
    venueId: "gen-klubi",
    venueName: "Genialistide Klubi",
    title: "Indie Night: Local Bands",
    startsAt: "20:30",
    timeframe: "tonight",
    price: "Ticketed",
    tags: ["live", "indie", "local"],
    description: "Local live sets followed by a relaxed DJ warmdown.",
  },
  {
    id: "demo-evt-naiiv-yard",
    venueId: "naiiv",
    venueName: "Naiiv",
    title: "Courtyard DJ Session",
    startsAt: "21:00",
    timeframe: "tonight",
    price: "Free",
    tags: ["dj", "courtyard", "craft beer"],
    description: "Outdoor-friendly social energy when the courtyard fills up.",
  },
  {
    id: "demo-evt-moku-quiz",
    venueId: "moku",
    venueName: "Moku",
    title: "Chaotic Table Quiz",
    startsAt: "20:00",
    timeframe: "tonight",
    price: "Free",
    tags: ["quiz", "student", "casual"],
    description: "Low-stakes quiz night that often turns into a social mixer.",
  },
  {
    id: "demo-evt-rp9-cocktail",
    venueId: "rp9",
    venueName: "RP9",
    title: "Cocktail Hour",
    startsAt: "19:00",
    timeframe: "tonight",
    price: "Premium",
    tags: ["cocktails", "date", "lounge"],
    description: "Early evening cocktail flow before the louder venues take over.",
  },
  {
    id: "demo-evt-illusion-student",
    venueId: "club-illusion",
    venueName: "Club Illusion",
    title: "Student Friday Pulse",
    startsAt: "23:30",
    timeframe: "late",
    price: "Cover",
    tags: ["club", "student", "dance"],
    description: "Main-room club night for student and Erasmus groups.",
  },
  {
    id: "demo-evt-maasikas-pop",
    venueId: "club-maasikas",
    venueName: "Club Maasikas",
    title: "Pop Floor All Night",
    startsAt: "23:00",
    timeframe: "late",
    price: "Cover",
    tags: ["club", "pop", "throwbacks"],
    description: "Mainstream pop, dance, and throwback floor.",
  },
  {
    id: "demo-evt-underground-alt",
    venueId: "underground",
    venueName: "Underground",
    title: "Alt Basement Hour",
    startsAt: "22:00",
    timeframe: "late",
    price: "Cover",
    tags: ["alt", "rock", "basement"],
    description: "Alternative basement set for heavier late-night plans.",
  },
  {
    id: "demo-evt-aparaat-market",
    venueId: "aparaat",
    venueName: "Aparaaditehas Yard",
    title: "Factory Yard Social",
    startsAt: "18:00",
    timeframe: "weekend",
    price: "Free",
    tags: ["yard", "food", "market"],
    description: "Food, drinks, and pop-up stands around the factory courtyard.",
  },
  {
    id: "demo-evt-puss-live",
    venueId: "pussirohukelder",
    venueName: "Pussirohukelder",
    title: "Cellar Live Covers",
    startsAt: "21:30",
    timeframe: "weekend",
    price: "Ticketed",
    tags: ["live", "pub", "covers"],
    description: "Big-room pub covers and large-table weekend groups.",
  },
  {
    id: "demo-evt-barlova-vinyl",
    venueId: "barlova",
    venueName: "Barlova",
    title: "Karlova Vinyl Evening",
    startsAt: "19:30",
    timeframe: "weekend",
    price: "Free",
    tags: ["vinyl", "chill", "neighbourhood"],
    description: "Cozy records and neighbourhood bar mood.",
  },
];

const demoVenues: DemoVenueSeed[] = [
  {
    id: "moku",
    name: "Moku",
    kind: "bar",
    area: "Old Town",
    address: "Ruutli 18",
    lat: 58.38101,
    lng: 26.72184,
    capacity: 85,
    tags: ["student classic", "cheap beer", "casual", "tartu"],
    music: ["indie", "mixed"],
    price: "Budget",
    openHours: "18:00-03:00",
    description:
      "A relaxed student-heavy bar around Ruutli, good when the night needs easy conversation before it gets louder.",
    baseCrowd: { now: 28, tonight: 62, late: 76, weekend: 82 },
  },
  {
    id: "naiiv",
    name: "Naiiv",
    kind: "craft bar",
    area: "Old Town",
    address: "Vallikraavi 6",
    lat: 58.3792,
    lng: 26.7205,
    capacity: 120,
    tags: ["craft beer", "courtyard", "groups", "tartu"],
    music: ["house", "funk", "open format"],
    price: "Mid",
    openHours: "17:00-02:00",
    description:
      "Craft beer energy with a roomy social feel, often good for groups that want atmosphere without a full club commitment.",
    baseCrowd: { now: 38, tonight: 80, late: 88, weekend: 96 },
  },
  {
    id: "kivi",
    name: "Kivi Baar",
    kind: "bar",
    area: "Old Town",
    address: "Ruutli 13",
    lat: 58.38067,
    lng: 26.72293,
    capacity: 75,
    tags: ["late-night", "compact", "local", "tartu"],
    music: ["rock", "alt", "party"],
    price: "Budget",
    openHours: "19:00-04:00",
    description:
      "Small, central, and very dependent on timing: perfect when alive, awkward when empty.",
    baseCrowd: { now: 18, tonight: 55, late: 70, weekend: 74 },
  },
  {
    id: "gen-klubi",
    name: "Genialistide Klubi",
    kind: "culture club",
    area: "Aparaaditehas",
    address: "Magasini 5",
    lat: 58.37476,
    lng: 26.71642,
    capacity: 260,
    tags: ["concerts", "culture", "dance floor", "tartu"],
    music: ["live", "electronic", "indie"],
    price: "Mid",
    openHours: "18:00-late",
    description:
      "A cultural nightlife anchor: concerts, parties, and creative crowd energy near Aparaaditehas.",
    baseCrowd: { now: 42, tonight: 145, late: 190, weekend: 218 },
  },
  {
    id: "aparaat",
    name: "Aparaaditehas Yard",
    kind: "social area",
    area: "Aparaaditehas",
    address: "Kastani 42",
    lat: 58.37339,
    lng: 26.71654,
    capacity: 320,
    tags: ["food", "terrace", "meetups", "tartu"],
    music: ["ambient", "pop-up"],
    price: "Mid",
    openHours: "12:00-00:00",
    description:
      "A cluster-like social zone for food, drinks, and pop-up events. The area pulse matters more than one exact door.",
    baseCrowd: { now: 96, tonight: 170, late: 88, weekend: 230 },
  },
  {
    id: "pussirohukelder",
    name: "Pussirohukelder",
    kind: "pub",
    area: "Toome Hill",
    address: "Lossi 28",
    lat: 58.37979,
    lng: 26.71805,
    capacity: 300,
    tags: ["historic", "big tables", "pub food", "tartu"],
    music: ["pub", "live nights"],
    price: "Mid",
    openHours: "12:00-01:00",
    description:
      "Historic cellar pub with room for large groups and a different vibe from the Ruutli bar strip.",
    baseCrowd: { now: 80, tonight: 160, late: 120, weekend: 210 },
  },
  {
    id: "shakespeare",
    name: "Shakespeare",
    kind: "pub",
    area: "Old Town",
    address: "Vanemuise 6",
    lat: 58.37702,
    lng: 26.72493,
    capacity: 140,
    tags: ["pub", "food", "quiz nights", "tartu"],
    music: ["pub", "throwbacks"],
    price: "Mid",
    openHours: "12:00-02:00",
    description:
      "Reliable pub option near the city center, useful as a safe fallback when louder places look too packed.",
    baseCrowd: { now: 48, tonight: 82, late: 78, weekend: 110 },
  },
  {
    id: "rp9",
    name: "RP9",
    kind: "cocktail bar",
    area: "Town Hall Square",
    address: "Raekoja plats 9",
    lat: 58.38017,
    lng: 26.72237,
    capacity: 95,
    tags: ["cocktails", "date night", "central", "tartu"],
    music: ["lounge", "deep house"],
    price: "Premium",
    openHours: "17:00-02:00",
    description:
      "Central cocktail stop with a polished vibe, better for smaller groups and late-evening plans.",
    baseCrowd: { now: 24, tonight: 68, late: 78, weekend: 88 },
  },
  {
    id: "pahad-poisid",
    name: "Pahad Poisid",
    kind: "pub",
    area: "Old Town",
    address: "Kuutri 2",
    lat: 58.38106,
    lng: 26.72298,
    capacity: 160,
    tags: ["sports", "pub", "food", "tartu"],
    music: ["pub", "sports"],
    price: "Mid",
    openHours: "11:00-02:00",
    description:
      "Casual pub energy near the square, often used as a starting point before choosing the final night direction.",
    baseCrowd: { now: 62, tonight: 110, late: 90, weekend: 132 },
  },
  {
    id: "illegaard",
    name: "Illegaard",
    kind: "pub",
    area: "Old Town",
    address: "Ulikooli 5",
    lat: 58.38012,
    lng: 26.72318,
    capacity: 110,
    tags: ["student", "basement", "pub", "tartu"],
    music: ["rock", "retro"],
    price: "Budget",
    openHours: "17:00-03:00",
    description:
      "Basement pub feel, popular for students who want something easy, central, and not too formal.",
    baseCrowd: { now: 32, tonight: 76, late: 86, weekend: 96 },
  },
  {
    id: "trepp",
    name: "Trepp",
    kind: "bar",
    area: "Old Town",
    address: "Ruutli 16",
    lat: 58.38081,
    lng: 26.72206,
    capacity: 70,
    tags: ["shots", "small groups", "late", "tartu"],
    music: ["party", "pop"],
    price: "Budget",
    openHours: "20:00-04:00",
    description:
      "A compact stop that can flip from empty to packed quickly, making live crowd checks especially useful.",
    baseCrowd: { now: 12, tonight: 48, late: 68, weekend: 72 },
  },
  {
    id: "shooters",
    name: "Shooters Tartu",
    kind: "shot bar",
    area: "Old Town",
    address: "Ruutli area",
    lat: 58.38092,
    lng: 26.72136,
    capacity: 90,
    tags: ["shots", "party starter", "quick stop", "tartu"],
    music: ["pop", "club"],
    price: "Budget",
    openHours: "20:00-04:00",
    description:
      "Fast, loud, and timing-sensitive. Usually a short stop before people move to a club or bigger bar.",
    baseCrowd: { now: 10, tonight: 62, late: 88, weekend: 94 },
  },
  {
    id: "club-illusion",
    name: "Club Illusion",
    kind: "nightclub",
    area: "City Centre",
    address: "Raatuse 97",
    lat: 58.38342,
    lng: 26.73351,
    capacity: 500,
    tags: ["club", "dance", "large crowd", "tartu"],
    music: ["edm", "pop", "hip-hop"],
    price: "Mid",
    openHours: "23:00-05:00",
    description:
      "Large club option where the only question that matters is whether the night has started yet.",
    baseCrowd: { now: 0, tonight: 140, late: 360, weekend: 430 },
  },
  {
    id: "club-maasikas",
    name: "Club Maasikas",
    kind: "nightclub",
    area: "Old Town",
    address: "Kuuni area",
    lat: 58.37861,
    lng: 26.72476,
    capacity: 360,
    tags: ["club", "dance", "mainstream", "tartu"],
    music: ["pop", "dance", "throwbacks"],
    price: "Mid",
    openHours: "23:00-05:00",
    description: "Mainstream club-night energy, strongest later than most bars.",
    baseCrowd: { now: 0, tonight: 90, late: 255, weekend: 310 },
  },
  {
    id: "underground",
    name: "Underground",
    kind: "music bar",
    area: "Old Town",
    address: "Kuutri area",
    lat: 58.38144,
    lng: 26.72347,
    capacity: 95,
    tags: ["alternative", "basement", "late-night", "tartu"],
    music: ["metal", "rock", "alt"],
    price: "Budget",
    openHours: "19:00-03:00",
    description:
      "Alternative basement mood with a loyal crowd; not for every group, perfect for the right one.",
    baseCrowd: { now: 14, tonight: 50, late: 74, weekend: 84 },
  },
  {
    id: "barlova",
    name: "Barlova",
    kind: "neighbourhood bar",
    area: "Karlova",
    address: "Tahe area",
    lat: 58.36923,
    lng: 26.72412,
    capacity: 85,
    tags: ["karlova", "local", "cozy", "tartu"],
    music: ["vinyl", "indie", "soul"],
    price: "Mid",
    openHours: "17:00-01:00",
    description:
      "Cozy neighbourhood energy in Karlova, good for people who want to avoid the center.",
    baseCrowd: { now: 26, tonight: 58, late: 52, weekend: 72 },
  },
  {
    id: "vildes",
    name: "Vilde ja Vine",
    kind: "restaurant bar",
    area: "Old Town",
    address: "Vallikraavi 4",
    lat: 58.37955,
    lng: 26.72097,
    capacity: 150,
    tags: ["wine", "food", "terrace", "tartu"],
    music: ["lounge", "soft pop"],
    price: "Premium",
    openHours: "12:00-00:00",
    description:
      "Food-and-wine style venue that works well for early evening groups and calmer plans.",
    baseCrowd: { now: 56, tonight: 98, late: 42, weekend: 112 },
  },
  {
    id: "hansa-hoov",
    name: "Hansa Hoov",
    kind: "beer garden",
    area: "City Centre",
    address: "Aleksandri 46",
    lat: 58.37195,
    lng: 26.73547,
    capacity: 240,
    tags: ["beer garden", "summer", "big groups", "tartu"],
    music: ["live", "folk", "pub"],
    price: "Mid",
    openHours: "12:00-00:00",
    description:
      "Bigger beer-garden feel, especially useful in warm weather and group-heavy weekends.",
    baseCrowd: { now: 46, tonight: 122, late: 74, weekend: 180 },
  },
];

export function getDemoVenues(
  options: {
    timeframe: TimeFrame;
    query?: string;
    vibe?: string;
    area?: string;
  },
  ledger: DemoLedger = {},
) {
  const query = options.query?.trim().toLowerCase() ?? "";
  const vibe = options.vibe?.trim().toLowerCase() ?? "all";
  const area = options.area?.trim().toLowerCase() ?? "all";

  return demoVenues
    .map((seed) =>
      applyLedger(stateForVenue(seed, options.timeframe), ledger[seed.id]),
    )
    .filter((venue) => {
      if (query && !matchesVenue(venue, query)) return false;
      if (vibe !== "all" && venue.vibe !== vibe) return false;
      if (area !== "all" && venue.area.toLowerCase() !== area) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.crowdPercent === b.crowdPercent) return a.name.localeCompare(b.name);
      return b.crowdPercent - a.crowdPercent;
    });
}

export function getDemoEvents(options: { timeframe: TimeFrame; query?: string }) {
  const query = options.query?.trim().toLowerCase() ?? "";

  return demoEvents
    .filter((event) => {
      if (options.timeframe !== "now" && event.timeframe !== options.timeframe) {
        return false;
      }
      if (query && !matchesEvent(event, query)) return false;
      return true;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getDemoHeatmap(timeframe: TimeFrame, ledger: DemoLedger = {}) {
  return getDemoVenues({ timeframe }, ledger).map(toHeatPoint);
}

export function recordDemoContribution(
  ledger: DemoLedger,
  venueId: string,
  action: ContributionAction,
  vibe?: CrowdVibe,
) {
  if (action === "not_going" && !vibe) return;

  const entry = ledger[venueId] ?? { going: 0, checkIns: 0 };
  if (action === "going") {
    entry.going += 1;
  }
  if (action === "check_in") {
    entry.checkIns += 1;
  }
  if (vibe) {
    entry.vibe = vibe;
  }
  ledger[venueId] = entry;
}

function stateForVenue(seed: DemoVenueSeed, timeframe: TimeFrame): Venue {
  const { baseCrowd, ...venue } = seed;
  const base = baseCrowd[timeframe] ?? baseCrowd.now;
  const crowd = clamp(base + stablePulse(seed.id, timeframe), 0, seed.capacity + 15);
  const crowdPercent = crowdPercentFor(crowd, seed.capacity);
  const signal = signalFromPercent(crowdPercent);

  return {
    ...venue,
    crowd,
    crowdPercent,
    heat: heatFromPercent(crowdPercent),
    vibe: signal.vibe,
    vibeLabel: signal.label,
    waitMinutes: waitFromPercent(crowdPercent),
    trending: trendFromPercent(crowdPercent),
    lastUpdated: "",
    events: eventsForVenue(seed.id, timeframe),
  };
}

function applyLedger(venue: Venue, ledger?: DemoLedger[string]): Venue {
  if (!ledger) return venue;

  const crowd = clamp(
    venue.crowd + ledger.going + ledger.checkIns * 2,
    0,
    venue.capacity + 15,
  );
  const crowdPercent = crowdPercentFor(crowd, venue.capacity);
  const signal = ledger.vibe
    ? signalFromVibe(ledger.vibe)
    : signalFromPercent(crowdPercent);

  return {
    ...venue,
    crowd,
    crowdPercent,
    heat: heatFromPercent(crowdPercent),
    vibe: signal.vibe,
    vibeLabel: signal.label,
    waitMinutes: waitFromPercent(crowdPercent),
    trending: ledger.checkIns > 0 ? "Fresh check-ins" : "Interest rising",
    lastUpdated: "",
  };
}

function eventsForVenue(venueId: string, timeframe: TimeFrame) {
  return demoEvents.filter((event) => {
    if (event.venueId !== venueId) return false;
    if (timeframe !== "now" && event.timeframe !== timeframe) return false;
    return true;
  });
}

function matchesVenue(venue: Venue, query: string) {
  const eventText = venue.events
    .map((event) => `${event.title} ${event.description} ${event.tags.join(" ")}`)
    .join(" ");
  const haystack = [
    venue.name,
    venue.kind,
    venue.area,
    venue.address,
    venue.price,
    venue.description,
    ...venue.tags,
    ...venue.music,
    eventText,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesEvent(event: EventItem, query: string) {
  return [
    event.title,
    event.venueName,
    event.description,
    event.price,
    ...event.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function toHeatPoint(venue: Venue): HeatPoint {
  return {
    venueId: venue.id,
    name: venue.name,
    lat: venue.lat,
    lng: venue.lng,
    intensity: venue.heat,
    crowd: venue.crowd,
    crowdPercent: venue.crowdPercent,
  };
}

function signalFromPercent(percent: number): { vibe: CrowdVibe; label: string } {
  if (percent <= 12) return { vibe: "dead", label: "Quiet / dead" };
  if (percent <= 38) return { vibe: "chill", label: "Chill" };
  if (percent <= 72) return { vibe: "perfect", label: "Good energy" };
  if (percent <= 100) return { vibe: "busy", label: "Busy" };
  return { vibe: "packed", label: "Packed" };
}

function signalFromVibe(vibe: CrowdVibe): { vibe: CrowdVibe; label: string } {
  switch (vibe) {
    case "dead":
      return { vibe, label: "Quiet / dead" };
    case "chill":
      return { vibe, label: "Chill" };
    case "perfect":
      return { vibe, label: "Good energy" };
    case "busy":
      return { vibe, label: "Busy" };
    case "packed":
      return { vibe, label: "Packed" };
  }
}

function waitFromPercent(percent: number) {
  if (percent > 100) return 18;
  if (percent > 82) return 10;
  if (percent > 55) return 4;
  return 0;
}

function trendFromPercent(percent: number) {
  if (percent > 96) return "Peak energy";
  if (percent > 72) return "Rising";
  if (percent > 38) return "Steady";
  return "Calm";
}

function heatFromPercent(percent: number) {
  if (percent <= 0) return 0;
  return clamp(percent / 100, 0.08, 1);
}

function crowdPercentFor(crowd: number, capacity: number) {
  if (capacity <= 0) return 0;
  return clamp(Math.round((crowd / capacity) * 100), 0, 140);
}

function stablePulse(id: string, timeframe: TimeFrame) {
  const seed = Array.from(`${id}:${timeframe}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return Math.round(Math.sin(seed) * 3 + Math.cos(seed * 0.37) * 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
