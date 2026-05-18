"use client";

import {
  CalendarDays,
  HandHeart,
  MapPinned,
  Radio,
  Signal,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";

export type AppChromeTarget = "radar" | "venues" | "events" | "contribute";

const navItems = [
  { label: "Radar", target: "radar", icon: Signal },
  { label: "Venues", target: "venues", icon: MapPinned },
  { label: "Events", target: "events", icon: CalendarDays },
  { label: "Contribute", target: "contribute", icon: HandHeart },
] satisfies Array<{
  label: string;
  target: AppChromeTarget;
  icon: LucideIcon;
}>;

type AppChromeProps = {
  activeTarget?: AppChromeTarget;
  onNavigate?: (target: AppChromeTarget) => void;
};

export default function AppChrome({
  activeTarget = "radar",
  onNavigate,
}: AppChromeProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-11 border-b border-white/[0.06] bg-[#0d0d1a]/90 backdrop-blur-xl lg:h-14">
      <div className="mx-auto flex h-full max-w-[var(--content-max)] items-center justify-between gap-2 px-3 lg:px-6">
        <a
          href="#radar"
          onClick={(event) => {
            if (!onNavigate) return;
            event.preventDefault();
            onNavigate("radar");
          }}
          className="flex min-w-0 items-center gap-2"
        >
          <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-cyan-300/30 bg-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <img
              src="/icon-192.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold text-white lg:text-base tracking-tight">
              Night Out Baltic
            </p>
            <p className="hidden truncate text-[11px] font-medium text-slate-500 lg:block">
              Tartu nightlife radar
            </p>
          </div>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex lg:flex-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Button
                key={item.target}
                asChild
                variant="ghost"
                size="sm"
                className={
                  activeTarget === item.target
                    ? "shrink-0 rounded-lg bg-white/10 text-white"
                    : "shrink-0"
                }
              >
                <a
                  href={`#${item.target}`}
                  aria-label={item.label}
                  title={item.label}
                  onClick={(event) => {
                    if (!onNavigate) return;
                    event.preventDefault();
                    onNavigate(item.target);
                  }}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span className="hidden md:inline">{item.label}</span>
                </a>
              </Button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="emerald" glow className="gap-1.5">
            <LiveDot colour="emerald" size="sm" />
            <Radio aria-hidden="true" size={12} className="hidden sm:block" />
            Live
          </Badge>
        </div>
      </div>
    </header>
  );
}
