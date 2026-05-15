import { Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Radar", href: "#radar" },
  { label: "Venues", href: "#venues" },
  { label: "Events", href: "#events" },
  { label: "Contribute", href: "#contribute" },
];

export default function AppChrome() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1800px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 md:flex-nowrap md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
            <Sparkles aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-white">
              Night Out Baltic
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">Tartu nightlife radar</p>
          </div>
        </div>

        <nav
          aria-label="Primary navigation"
          className="order-last -mx-1 flex w-full items-center gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto"
        >
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <a href={item.href}>{item.label}</a>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" className="hidden sm:inline-flex">
            <Radio aria-hidden="true" size={12} />
            Live
          </Badge>
        </div>
      </div>
    </header>
  );
}
