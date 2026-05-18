"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export type CustomSelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

type CustomSelectProps<T extends string = string> = {
  value: T;
  options: Array<CustomSelectOption<T>>;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
  buttonClassName?: string;
};

export function CustomSelect<T extends string = string>({
  value,
  options,
  onValueChange,
  label,
  className,
  buttonClassName,
}: CustomSelectProps<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    setHighlightedIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectIndex(index: number) {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        selectIndex(highlightedIndex);
      } else {
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-left text-sm text-white shadow-sm outline-none transition hover:bg-white/[0.08] focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30",
          buttonClassName,
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? label}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-150",
            open && "rotate-180 text-cyan-300",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`${id}-listbox`}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[1100] max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/98 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-cyan-300/10 backdrop-blur-xl"
          >
            {options.map((option, index) => {
              const selectedOption = option.value === value;
              const highlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selectedOption}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition focus:outline-none",
                    highlighted && "bg-white/[0.07]",
                    selectedOption ? "text-white" : "text-slate-300",
                  )}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center text-cyan-300">
                    {selectedOption && <Check aria-hidden="true" size={15} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
