"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { round2 } from "@/lib/money";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "voltsupply.cart.v1";

/*
 * The cart is a browser-owned store (localStorage) rather than React state, so
 * it is exposed through `useSyncExternalStore`. That keeps the server render
 * and the hydration render in agreement without an effect, and lets two open
 * tabs stay in sync through the `storage` event.
 */

const listeners = new Set<() => void>();

/** Stable reference for the server/hydration snapshot. */
const EMPTY: CartItem[] = [];

let cache: CartItem[] = EMPTY;
let loaded = false;

function parseStored(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CartItem).chargerId === "string" &&
        typeof (item as CartItem).name === "string" &&
        typeof (item as CartItem).unitPrice === "number" &&
        typeof (item as CartItem).quantity === "number" &&
        (item as CartItem).quantity > 0,
    );
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * Must return a referentially stable value between calls, otherwise
 * `useSyncExternalStore` re-renders forever.
 */
function getSnapshot(): CartItem[] {
  if (!loaded) {
    cache = parseStored(window.localStorage.getItem(STORAGE_KEY));
    loaded = true;
  }
  return cache;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function emit() {
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  loaded = false;
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function commit(next: CartItem[]) {
  cache = next.length > 0 ? next : EMPTY;
  loaded = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  emit();
}

function mutate(updater: (current: CartItem[]) => CartItem[]) {
  commit(updater(getSnapshot()));
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // False on the server and during hydration, true from the first client
  // render onward — without touching state inside an effect.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      if (quantity <= 0) return;
      mutate((current) => {
        const existing = current.find((it) => it.chargerId === item.chargerId);
        if (!existing) return [...current, { ...item, quantity }];
        return current.map((it) =>
          it.chargerId === item.chargerId
            ? { ...it, unitPrice: item.unitPrice, quantity: it.quantity + quantity }
            : it,
        );
      });
    },
    [],
  );

  const setQuantity = useCallback((chargerId: string, quantity: number) => {
    mutate((current) =>
      quantity <= 0
        ? current.filter((it) => it.chargerId !== chargerId)
        : current.map((it) =>
            it.chargerId === chargerId ? { ...it, quantity } : it,
          ),
    );
  }, []);

  const removeItem = useCallback((chargerId: string) => {
    mutate((current) => current.filter((it) => it.chargerId !== chargerId));
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);

  const totals = useMemo(
    () => ({
      /** Distinct products in the cart — what the header badge shows. */
      lineCount: items.length,
      /** Total units across every line. */
      itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
      subtotal: round2(
        items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
      ),
    }),
    [items],
  );

  return {
    items,
    hydrated,
    ...totals,
    addItem,
    setQuantity,
    removeItem,
    clear,
  };
}
