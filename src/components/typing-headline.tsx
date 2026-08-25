"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

export type HeadlineSegment = {
  text: string;
  /** Renders in the brand colour. */
  accent?: boolean;
};

const TYPE_MS = 55;
const DELETE_MS = 26;
const HOLD_FULL_MS = 2200;
const HOLD_EMPTY_MS = 600;
const START_DELAY_MS = 350;

/* -------------------------------------------------------------------------- */
/* Browser state, read without setState-in-effect                             */
/* -------------------------------------------------------------------------- */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function noopSubscribe() {
  return () => {};
}

/* -------------------------------------------------------------------------- */

function renderSegments(segments: HeadlineSegment[], visible: number): ReactNode {
  let remaining = visible;

  return segments.map((segment, index) => {
    const slice = remaining <= 0 ? "" : segment.text.slice(0, remaining);
    remaining -= slice.length;
    if (!slice) return null;
    return (
      <span key={index} className={segment.accent ? "text-brand" : undefined}>
        {slice}
      </span>
    );
  });
}

/**
 * Types the headline out one character at a time, holds, erases, and repeats.
 *
 * The complete text is always in the DOM for assistive technology and
 * crawlers; the animated copy is `aria-hidden`. An invisible full-text copy
 * sits in the same grid cell to reserve the final height, so the page below
 * never shifts as characters appear. Visitors who ask for reduced motion — and
 * anyone without JavaScript — get the finished headline immediately.
 */
export function TypingHeadline({
  segments,
  className,
}: {
  segments: HeadlineSegment[];
  className?: string;
}) {
  const full = segments.map((segment) => segment.text).join("");
  const [count, setCount] = useState(0);

  // Both default to the server-safe value, so the first client render matches
  // the markup that was sent.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

  const animating = hydrated && !reducedMotion;

  useEffect(() => {
    if (!animating) return;

    let timer: ReturnType<typeof setTimeout>;
    let visible = 0;
    let erasing = false;

    // Every setState below runs inside a timer callback rather than in the
    // effect body, so this never cascades a render synchronously.
    function step() {
      visible += erasing ? -1 : 1;
      setCount(visible);

      let delay: number;
      if (!erasing && visible >= full.length) {
        // Fully typed: hold, then start erasing.
        erasing = true;
        delay = HOLD_FULL_MS;
      } else if (erasing && visible <= 0) {
        // Fully erased: pause, then type it again.
        erasing = false;
        delay = HOLD_EMPTY_MS;
      } else {
        delay = erasing ? DELETE_MS : TYPE_MS;
      }

      timer = setTimeout(step, delay);
    }

    timer = setTimeout(step, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [animating, full.length]);

  const visible = animating ? count : full.length;

  return (
    <h1 className={className}>
      {/* The real heading, for screen readers and crawlers. */}
      <span className="sr-only">{full}</span>

      <span aria-hidden className="grid">
        {/* Reserves the finished height so nothing below moves. */}
        <span className="invisible col-start-1 row-start-1">
          {renderSegments(segments, full.length)}
        </span>

        <span className="col-start-1 row-start-1 whitespace-pre-wrap">
          {renderSegments(segments, visible)}
          {animating ? (
            <span className="ml-1 inline-block h-[0.8em] w-[0.05em] min-w-[3px] translate-y-[0.06em] bg-brand animate-caret" />
          ) : null}
        </span>
      </span>
    </h1>
  );
}
