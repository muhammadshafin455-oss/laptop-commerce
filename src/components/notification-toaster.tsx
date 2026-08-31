"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import type { NotificationView } from "@/lib/notifications";
import { playNotificationSound } from "@/lib/notification-sound";

const POLL_MS = 15_000;

/**
 * Watches for new notifications and pops them as toasts with a chime.
 *
 * Polling rather than a live connection: a server-sent-events stream would hold
 * a serverless function open for the whole visit, which is exactly what Vercel
 * charges for. A 15s poll of one indexed query is far cheaper.
 */
export function NotificationToaster({
  audience,
}: {
  audience: "admin" | "customer";
}) {
  const router = useRouter();
  // Refs, not state — nothing here should trigger a re-render.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      // Don't query on behalf of a tab nobody is looking at.
      if (document.visibilityState !== "visible") return;

      try {
        const url =
          audience === "admin"
            ? "/api/notifications?audience=admin"
            : "/api/notifications";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok || cancelled) return;

        const data: { items: NotificationView[] } = await res.json();
        const unread = data.items.filter((item) => !item.read);

        // First pass only records what is already there; a visitor who has been
        // away should not be hit with a burst of stale toasts on arrival.
        if (seen.current === null) {
          seen.current = new Set(data.items.map((item) => item.id));
          return;
        }

        const fresh = unread.filter((item) => !seen.current!.has(item.id));
        for (const item of data.items) seen.current.add(item.id);

        if (fresh.length === 0) return;

        playNotificationSound();
        for (const item of fresh) {
          toast(item.title, {
            description: item.body,
            duration: 8000,
            action: item.orderId
              ? {
                  label: "View",
                  onClick: () =>
                    router.push(
                      audience === "admin"
                        ? "/admin/orders"
                        : `/orders/${item.orderId}`,
                    ),
                }
              : undefined,
          });
        }

        // Refresh so the bell's unread badge matches the toasts.
        router.refresh();
      } catch {
        // Offline or a hiccup — the next tick tries again.
      }
    }

    function schedule() {
      timer = setTimeout(async () => {
        await poll();
        if (!cancelled) schedule();
      }, POLL_MS);
    }

    void poll();
    schedule();

    // Catch up as soon as the tab is looked at again.
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [audience, router]);

  return (
    <Toaster
      position="top-right"
      closeButton
      richColors
      toastOptions={{ style: { borderRadius: "0.75rem" } }}
    />
  );
}
