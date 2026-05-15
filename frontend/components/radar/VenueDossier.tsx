import { AnimatePresence, motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Signal,
  Wand2,
} from "lucide-react";
import type { ContributionAction, CrowdVibe, EventItem, Venue } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { crowdSignal, formatUpdated, vibeReports } from "@/lib/signals";

type AreaInsight = {
  mood: string;
  hottest?: Venue;
};

type VenueDossierProps = {
  venue?: Venue;
  events: EventItem[];
  areaInsight: AreaInsight | null;
  busyAction: string | null;
  onContribution: (action: ContributionAction, vibe?: CrowdVibe) => void;
  onSelectEvent: (event: EventItem) => void;
};

export default function VenueDossier({
  venue,
  events,
  areaInsight,
  busyAction,
  onContribution,
  onSelectEvent,
}: VenueDossierProps) {
  return (
    <Card id="details" className="scroll-mt-20 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-auto">
      <AnimatePresence mode="wait">
        {!venue ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid min-h-96 place-items-center p-8 text-center"
          >
            <div>
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400">
                <MapPin aria-hidden="true" size={20} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">Select a venue</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                The dossier explains room energy, nearby area mood, and useful next actions.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <DossierContent
              venue={venue}
              events={events}
              areaInsight={areaInsight}
              busyAction={busyAction}
              onContribution={onContribution}
              onSelectEvent={onSelectEvent}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function DossierContent({
  venue,
  events,
  areaInsight,
  busyAction,
  onContribution,
  onSelectEvent,
}: Required<Pick<VenueDossierProps, "venue" | "events" | "busyAction" | "onContribution" | "onSelectEvent">> & {
  areaInsight: AreaInsight | null;
}) {
  const signal = crowdSignal(venue.crowdPercent);
  const visibleEvents = venue.events.length > 0 ? venue.events : events.slice(0, 3);

  return (
    <>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant={badgeVariant(signal.level)}>{signal.level}</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              {venue.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{venue.description}</p>
          </div>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_0_6px] shadow-cyan-300/10" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <section aria-label="Current signal" className="grid grid-cols-3 gap-2">
          <Metric icon={<Signal size={16} />} label="Room" value={venue.vibeLabel} />
          <Metric icon={<Clock3 size={16} />} label="Entry" value={signal.wait} />
          <Metric icon={<Wand2 size={16} />} label="Feel" value={signal.tone} />
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-300">Signal confidence</p>
            <p className="text-xs text-slate-500">Updated {formatUpdated(venue.lastUpdated)}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full rounded-full", signal.barClass)} />
          </div>
        </section>

        <section id="contribute" className="scroll-mt-20 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Contribute anonymously</h3>
            <Badge variant="neutral">No profile</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={busyAction !== null}
              onClick={() => onContribution("going")}
            >
              <Navigation aria-hidden="true" size={16} />
              Going
            </Button>
            <Button
              type="button"
              disabled={busyAction !== null}
              onClick={() => onContribution("check_in")}
            >
              <BadgeCheck aria-hidden="true" size={16} />
              Check in
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="col-span-2"
              disabled={busyAction !== null}
              onClick={() => onContribution("not_going")}
            >
              Not going
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {vibeReports.map((item) => (
              <button
                key={item.vibe}
                type="button"
                disabled={busyAction !== null}
                onClick={() => onContribution("report", item.vibe)}
                className="min-h-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex gap-3 text-sm leading-6 text-slate-400">
            <LocateFixed aria-hidden="true" className="mt-1 shrink-0 text-slate-500" size={16} />
            <p>
              <span className="font-medium text-white">
                {areaInsight?.mood ?? "Reading area"}
              </span>
              . Nearby energy is{" "}
              {areaInsight?.hottest
                ? `currently led by ${areaInsight.hottest.name}`
                : "calm right now"}
              .
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white">Venue context</h3>
          <div className="flex gap-2 text-sm leading-6 text-slate-400">
            <MapPin aria-hidden="true" className="mt-1 shrink-0 text-slate-500" size={16} />
            <span>
              {venue.address} · {venue.openHours}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...venue.tags, ...venue.music, venue.price].map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section id="events" className="scroll-mt-20">
          <h3 className="mb-3 text-sm font-semibold text-white">Nearby plans</h3>
          <div className="grid gap-2">
            {visibleEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
                className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              >
                <CalendarDays aria-hidden="true" className="mt-0.5 shrink-0 text-slate-500" size={16} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-100">
                    {event.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {event.startsAt} · {event.venueName} · {event.price}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </CardContent>
    </>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-slate-500">{icon}</div>
      <p className="mt-2 truncate text-sm font-medium text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function badgeVariant(level: string): ComponentProps<typeof Badge>["variant"] {
  if (level === "Overflowing") return "rose";
  if (level === "Packed") return "amber";
  if (level === "Lively") return "emerald";
  if (level === "Warming up") return "cyan";
  return "neutral";
}
