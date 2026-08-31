/**
 * A short two-tone chime, synthesised with the Web Audio API so there is no
 * audio file to ship, load, or cache.
 *
 * Browsers block audio until the visitor has interacted with the page, so
 * every call is wrapped — a blocked sound must never break the notification.
 */
let context: AudioContext | null = null;

const MUTE_KEY = "voltsupply.notifications.muted";

export function isMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

export function setMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private browsing can refuse storage; the preference just won't persist.
  }
  for (const listener of listeners) listener();
}

/** Lets React read the preference without touching state inside an effect. */
export function subscribeMuted(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Server render has no localStorage, so it always assumes sound is on. */
export function mutedServerSnapshot(): boolean {
  return false;
}

function tone(ctx: AudioContext, frequency: number, startAt: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Quick attack, gentle exponential release — a soft "ding" rather than a beep.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export function playNotificationSound(): void {
  if (isMuted()) return;

  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    tone(context, 880, now, 0.18); // A5
    tone(context, 1318.5, now + 0.1, 0.28); // E6
  } catch {
    // Audio unavailable or still blocked — the toast alone is enough.
  }
}
