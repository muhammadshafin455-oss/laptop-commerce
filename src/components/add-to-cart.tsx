"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import type { ChargerView } from "@/lib/types";

export function AddToCart({ charger }: { charger: ChargerView }) {
  const { items, hydrated, addItem, setQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((it) => it.chargerId === charger.id)?.quantity ?? 0;
  const atStockLimit = inCart >= charger.stock;

  // Sized down on phones, where the catalogue is two cards to a row.
  const buttonBase =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm";

  if (!charger.isPurchasable) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonBase} cursor-not-allowed border border-line-strong bg-surface text-muted`}
      >
        Out of stock
      </button>
    );
  }

  // Before hydration the cart contents are unknown, so render the neutral
  // "add" state rather than a stepper that might flip on hydration.
  if (hydrated && inCart > 0) {
    return (
      <div className="flex items-center justify-between gap-1 rounded-lg border border-brand bg-brand-soft p-1">
        <button
          type="button"
          aria-label={`Remove one ${charger.name}`}
          onClick={() => setQuantity(charger.id, inCart - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand transition-colors hover:bg-white sm:h-9 sm:w-9"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-brand sm:text-sm">
          {inCart}
          <span className="hidden sm:inline"> in cart</span>
        </span>
        <button
          type="button"
          disabled={atStockLimit}
          aria-label={`Add one more ${charger.name}`}
          onClick={() => setQuantity(charger.id, inCart + 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-transparent sm:h-9 sm:w-9"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(
          { chargerId: charger.id, name: charger.name, unitPrice: charger.finalPrice },
          1,
        );
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
      }}
      className={`${buttonBase} bg-brand text-white shadow-sm hover:bg-brand-dark`}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4 shrink-0" /> Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 shrink-0" />
          <span className="truncate">Add to cart</span>
        </>
      )}
    </button>
  );
}
