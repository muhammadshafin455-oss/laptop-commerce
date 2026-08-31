"use client";

import { Bell, PackageCheck, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import type { NotificationView } from "@/lib/notifications";
import {
  isMuted,
  mutedServerSnapshot,
  setMuted,
  subscribeMuted,
} from "@/lib/notification-sound";

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({
  items,
  unread,
  markRead,
  tone = "light",
  linkTo = "customer",
}: {
  items: NotificationView[];
  unread: number;
  /** Server action that marks this viewer's notifications as read. */
  markRead: () => Promise<void>;
  /** `dark` matches the admin sidebar. */
  tone?: "light" | "dark";
  /** Where a notification links: the customer's order page, or the admin list. */
  linkTo?: "customer" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const muted = useSyncExternalStore(
    subscribeMuted,
    isMuted,
    mutedServerSnapshot,
  );

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

  function toggle() {
    const next = !open;
    setOpen(next);
    // Opening the panel is what marks them read.
    if (next && unread > 0) startTransition(() => void markRead());
  }

  const trigger =
    tone === "dark"
      ? "text-slate-300 hover:bg-night-soft hover:text-white"
      : "text-muted hover:bg-canvas hover:text-ink";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className={`relative inline-flex items-center justify-center rounded-lg p-2 transition-colors ${trigger}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Turn notification sound on" : "Mute notification sound"}
              title={muted ? "Sound is off" : "Sound is on"}
              className="rounded-md p-1.5 text-subtle transition-colors hover:bg-canvas hover:text-ink"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <PackageCheck className="mx-auto h-6 w-6 text-subtle" />
              <p className="mt-2 text-sm text-muted">Nothing yet.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((item) => {
                const content = (
                  <>
                    <span className="flex items-start gap-2">
                      {!item.read ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted">
                          {item.body}
                        </span>
                        <span className="mt-1 block text-xs text-subtle">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={item.id} className="border-b border-line last:border-0">
                    {item.orderId ? (
                      <Link
                        href={
                          linkTo === "admin"
                            ? "/admin/orders"
                            : `/orders/${item.orderId}`
                        }
                        onClick={() => setOpen(false)}
                        className={`block px-4 py-3 transition-colors hover:bg-canvas ${item.read ? "" : "bg-brand-soft/40"}`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
