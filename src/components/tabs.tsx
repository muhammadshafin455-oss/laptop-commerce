"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export type TabDefinition = {
  id: string;
  label: string;
  /** Optional badge, e.g. how many rows the panel holds. */
  count?: number;
  icon?: ReactNode;
  content: ReactNode;
};

export function Tabs({
  tabs,
  initial,
}: {
  tabs: TabDefinition[];
  initial?: string;
}) {
  const baseId = useId();
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: React.KeyboardEvent) {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();

    const index = tabs.findIndex((tab) => tab.id === active);
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${
                selected
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    selected ? "bg-white/20 text-white" : "bg-canvas text-subtle"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          // Panels stay mounted so a half-filled "add" form survives a tab
          // switch instead of being thrown away.
          hidden={tab.id !== active}
          className="mt-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
