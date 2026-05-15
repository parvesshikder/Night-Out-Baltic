import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import type { Venue } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { crowdSignal } from "@/lib/signals";

type SignalBoardProps = {
  venues: Venue[];
  selectedVenueId?: string;
  onSelectVenue: (venue: Venue) => void;
};

export default function SignalBoard({
  venues,
  selectedVenueId,
  onSelectVenue,
}: SignalBoardProps) {
  function exportView() {
    const rows = [
      ["Venue", "Area", "Type", "Signal", "Entry", "Tags"],
      ...venues.slice(0, 12).map((venue) => {
        const signal = crowdSignal(venue.crowdPercent);
        return [
          venue.name,
          venue.area,
          venue.kind,
          signal.level,
          signal.wait,
          venue.tags.slice(0, 3).join(" / "),
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tartu-venue-signals.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Card id="venues" className="scroll-mt-20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <Badge variant="neutral">Signal board</Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
            Venue intelligence
          </h2>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={exportView}>
          Export view
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.slice(0, 12).map((venue) => {
                const signal = crowdSignal(venue.crowdPercent);
                return (
                  <TableRow
                    key={venue.id}
                    tabIndex={0}
                    role="button"
                    className={cn(
                      "cursor-pointer focus:outline-none focus-visible:bg-white/[0.08]",
                      selectedVenueId === venue.id && "bg-white/[0.06]",
                    )}
                    onClick={() => onSelectVenue(venue)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectVenue(venue);
                      }
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{venue.name}</p>
                        <p className="text-xs text-slate-500">{venue.kind}</p>
                      </div>
                    </TableCell>
                    <TableCell>{venue.area}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(signal.level)}>{signal.level}</Badge>
                    </TableCell>
                    <TableCell>{signal.wait}</TableCell>
                    <TableCell>
                      <span className="line-clamp-1 text-xs text-slate-500">
                        {venue.tags.slice(0, 3).join(" · ")}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-2 p-3 md:hidden">
          {venues.slice(0, 8).map((venue, index) => {
            const signal = crowdSignal(venue.crowdPercent);
            return (
              <motion.button
                key={venue.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.025 }}
                onClick={() => onSelectVenue(venue)}
                className={cn(
                  "rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left",
                  selectedVenueId === venue.id && "border-cyan-300/50 bg-cyan-300/10",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{venue.name}</span>
                  <Badge variant={badgeVariant(signal.level)}>{signal.level}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {venue.area} · {signal.tone}
                </p>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function badgeVariant(level: string): ComponentProps<typeof Badge>["variant"] {
  if (level === "Overflowing") return "rose";
  if (level === "Packed") return "amber";
  if (level === "Lively") return "emerald";
  if (level === "Warming up") return "cyan";
  return "neutral";
}
