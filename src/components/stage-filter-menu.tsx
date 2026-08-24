"use client";

import { Check, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type StageOption = {
  value: string;
  label: string;
  count: number;
  href: string;
};

export function StageFilterMenu({
  options,
  current,
}: {
  options: StageOption[];
  current: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = options.find((option) => option.value === current) ?? options[0];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Filter orders by stage"
        className="inline-flex items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
      >
        <Menu className="h-[18px] w-[18px]" />
        {active.label}
        <span className="rounded-full bg-canvas px-1.5 py-0.5 text-xs font-bold text-subtle">
          {active.count}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === current;
            return (
              <Link
                key={option.value}
                href={option.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                  selected
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-ink hover:bg-canvas"
                }`}
              >
                <span className="flex items-center gap-2">
                  {selected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                  {option.label}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    selected ? "bg-brand text-white" : "bg-canvas text-subtle"
                  }`}
                >
                  {option.count}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
