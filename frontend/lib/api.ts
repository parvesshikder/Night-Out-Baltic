export type TimeFrame = "now" | "tonight" | "late" | "weekend";
export type CrowdVibe = "dead" | "chill" | "perfect" | "busy" | "packed";

export type EventItem = {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  startsAt: string;
  timeframe: TimeFrame;
  price: string;
  tags: string[];
  description: string;
};

export type Venue = {
  id: string;
  name: string;
  kind: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  tags: string[];
  music: string[];
  price: string;
  openHours: string;
  description: string;
  crowd: number;
  crowdPercent: number;
  heat: number;
  vibe: CrowdVibe;
  vibeLabel: string;
  waitMinutes: number;
  trending: string;
  lastUpdated: string;
  events: EventItem[];
};

export type HeatPoint = {
  venueId: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  crowd: number;
  crowdPercent: number;
};

export type ContributionAction =
  | "going"
  | "check_in"
  | "not_going"
  | "report";

export type ContributionResponse = {
  message: string;
  venue: Venue;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function params(values: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getVenues(options: {
  timeframe: TimeFrame;
  query?: string;
  vibe?: string;
  area?: string;
}) {
  return request<Venue[]>(
    `/api/venues${params({
      timeframe: options.timeframe,
      query: options.query,
      vibe: options.vibe,
      area: options.area,
    })}`,
  );
}

export function getEvents(options: { timeframe: TimeFrame; query?: string }) {
  return request<EventItem[]>(
    `/api/events${params({
      timeframe: options.timeframe,
      query: options.query,
    })}`,
  );
}

export function getHeatmap(timeframe: TimeFrame) {
  return request<HeatPoint[]>(`/api/heatmap${params({ timeframe })}`);
}

export function contribute(
  venueId: string,
  timeframe: TimeFrame,
  payload: { action: ContributionAction; vibe?: CrowdVibe },
) {
  return request<ContributionResponse>(
    `/api/venues/${venueId}/contribute${params({ timeframe })}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

