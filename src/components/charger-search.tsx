"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { inputSmClass } from "@/components/ui";

const DEBOUNCE_MS = 250;

/**
 * Filters the catalogue as the shopper types. The surrounding `<form>` is a
 * real GET form, so pressing Enter — or having no JavaScript at all — still
 * produces the same linkable `?q=` URL.
 */
export function ChargerSearch({
  action,
  query,
  placeholder = "Search chargers…",
}: {
  /** The path results are shown on; also the form target without JS. */
  action: string;
  query: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  function navigate(next: string) {
    const trimmed = next.trim();
    const url = trimmed ? `${action}?q=${encodeURIComponent(trimmed)}` : action;
    // `replace` keeps every keystroke out of the back-button history, and
    // `scroll: false` stops the page jumping to the top on each result set.
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
  }

  function clear() {
    clearTimeout(timer.current);
    setValue("");
    navigate("");
    inputRef.current?.focus();
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        // JS is running, so search immediately instead of waiting out the
        // debounce or doing a full page load.
        event.preventDefault();
        clearTimeout(timer.current);
        navigate(value);
      }}
      className="w-full max-w-sm"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />

        <input
          ref={inputRef}
          name="q"
          // `type="search"` would add a second, unstyled browser clear button.
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search chargers"
          autoComplete="off"
          className={`${inputSmClass} pl-9 pr-9`}
        />

        {pending ? (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-subtle" />
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle transition-colors hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Keyboard- and screen-reader-reachable, and the fallback without JS. */}
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
