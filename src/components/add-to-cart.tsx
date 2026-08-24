"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { useCart } from "@/lib/cart-store";
import type { ChargerView } from "@/lib/types";

export function AddToCart({ charger }: { charger: ChargerView }) {
  const { items, hydrated, addItem, setQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((it) => it.chargerId === charger.id)?.quantity ?? 0;
  const atStockLimit = inCart >= charger.stock;

  if (!charger.isPurchasable) {
    return (
      <button type="button" disabled className={`${buttonClass("secondary", "md")} w-full`}>
        Out of stock
      </button>
    );
  }

  // Before hydration the cart contents are unknown, so render the neutral
  // "add" state rather than a stepper that might flip on hydration.
  if (hydrated && inCart > 0) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-brand bg-brand-soft p-1">
        <button
          type="button"
          aria-label={`Remove one ${charger.name}`}
          onClick={() => setQuantity(charger.id, inCart - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-brand transition-colors hover:bg-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-brand">
          {inCart} in cart
        </span>
        <button
          type="button"
          disabled={atStockLimit}
          aria-label={`Add one more ${charger.name}`}
          onClick={() => setQuantity(charger.id, inCart + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-brand transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-transparent"
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
      className={`${buttonClass("primary", "md")} w-full`}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </>
      )}
    </button>
  );
}
