"use client";

import {
  AlertCircle,
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { placeOrder } from "@/app/actions/orders";
import {
  Button,
  ButtonLink,
  Card,
  Field,
  inputClass,
  inputErrorClass,
} from "@/components/ui";
import { useCart } from "@/lib/cart-store";
import { formatMoney, round2 } from "@/lib/money";
import { PickupLocation } from "@/components/pickup-details";
import type {
  ChargerView,
  FulfillmentType,
  PickupDetails,
  SessionUserView,
} from "@/lib/types";

type Props = {
  catalogue: ChargerView[];
  deliveryFee: number;
  pickup: PickupDetails;
  user: SessionUserView | null;
};

export function CartView({ catalogue, deliveryFee, pickup, user }: Props) {
  const { items, hydrated, setQuantity, removeItem, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [orderType, setOrderType] = useState<FulfillmentType>("DELIVERY");
  // Signed-in customers start with their account details filled in.
  const [customer, setCustomer] = useState({
    customerName: user?.name ?? "",
    customerEmail: user?.email ?? "",
    customerPhone: user?.phone ?? "",
    deliveryAddress: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const catalogueById = useMemo(
    () => new Map(catalogue.map((charger) => [charger.id, charger])),
    [catalogue],
  );

  /**
   * The cart lives in localStorage and can be older than the catalogue, so each
   * line is reconciled against live data before it is priced or submitted.
   */
  const lines = useMemo(
    () =>
      items.map((item) => {
        const live = catalogueById.get(item.chargerId);
        const unitPrice = live?.finalPrice ?? item.unitPrice;
        return {
          ...item,
          live,
          unitPrice,
          lineTotal: round2(unitPrice * item.quantity),
          unavailable: !live || !live.isPurchasable,
          priceChanged: !!live && live.finalPrice !== item.unitPrice,
          overStock: !!live && item.quantity > live.stock,
        };
      }),
    [items, catalogueById],
  );

  const blocked = lines.some((line) => line.unavailable || line.overStock);
  const subtotal = round2(
    lines.reduce((sum, line) => (line.unavailable ? sum : sum + line.lineTotal), 0),
  );
  const appliedDeliveryFee = orderType === "DELIVERY" ? deliveryFee : 0;
  const total = round2(subtotal + appliedDeliveryFee);

  function chooseFulfillment(next: FulfillmentType) {
    setOrderType(next);
    // A stale "address required" style error should not outlive the change.
    setFormError(null);
  }

  function update(key: keyof typeof customer, value: string) {
    setCustomer((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit() {
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await placeOrder({
        ...customer,
        orderType,
        items: lines
          .filter((line) => !line.unavailable)
          .map((line) => ({ chargerId: line.chargerId, quantity: line.quantity })),
      });

      if (!result.ok) {
        setFormError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        // The server may have rejected the order because stock moved; pull the
        // fresh catalogue so the cart reflects reality.
        router.refresh();
        return;
      }

      clear();
      router.push(`/orders/${result.orderId}`);
    });
  }

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mt-10 flex flex-col items-center px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 max-w-sm text-muted">
          Browse the catalogue and add a charger to get started.
        </p>
        <ButtonLink href="/chargers" size="lg" className="mt-7">
          Browse chargers
          <ArrowRight className="h-[18px] w-[18px]" />
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-start">
      {/* Line items */}
      <div className="space-y-4">
        {lines.map((line) => {
          const flagged = line.unavailable || line.overStock;
          return (
            <Card
              key={line.chargerId}
              className={`p-5 ${flagged ? "border-danger/40" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-[-0.01em]">{line.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatMoney(line.unitPrice)} each
                  </p>
                </div>
                <p className="text-lg font-bold tracking-[-0.02em]">
                  {formatMoney(line.lineTotal)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-line-strong">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.name}`}
                    onClick={() => setQuantity(line.chargerId, line.quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-l-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    aria-label={`Quantity of ${line.name}`}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next)) {
                        setQuantity(line.chargerId, Math.floor(next));
                      }
                    }}
                    className="h-9 w-12 border-x border-line-strong bg-transparent text-center text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.name}`}
                    onClick={() => setQuantity(line.chargerId, line.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-r-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(line.chargerId)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>

                {line.live && !flagged ? (
                  <span className="ml-auto text-xs text-subtle">
                    {line.live.stock} in stock
                  </span>
                ) : null}
              </div>

              {line.unavailable ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No longer available — remove it to continue.
                </p>
              ) : line.overStock ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Only {line.live?.stock} left in stock — lower the quantity.
                </p>
              ) : line.priceChanged ? (
                <p className="mt-3 text-sm text-muted">
                  Price updated to {formatMoney(line.unitPrice)} since you added this.
                </p>
              ) : null}
            </Card>
          );
        })}

        <Link
          href="/chargers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Checkout */}
      <Card className="p-6 lg:sticky lg:top-24">
        {user ? (
          <p className="mb-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Signed in as {user.name}
          </p>
        ) : (
          <p className="mb-5 rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-muted">
            <Link href="/login?next=%2Fcart" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>{" "}
            to fill this in automatically and keep your order history.
          </p>
        )}

        <h2 className="text-sm font-semibold">Fulfilment</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              {
                value: "DELIVERY",
                label: "Delivery",
                note: deliveryFee > 0 ? formatMoney(deliveryFee) : "Free",
                icon: Truck,
              },
              { value: "SELF_PICKUP", label: "Pickup", note: "Free", icon: Store },
            ] as const
          ).map((option) => {
            const selected = orderType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseFulfillment(option.value)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? "border-brand bg-brand-soft ring-2 ring-brand-ring"
                    : "border-line-strong hover:border-brand"
                }`}
              >
                <option.icon
                  className={`h-[18px] w-[18px] ${selected ? "text-brand" : "text-muted"}`}
                />
                <span className="mt-2 block text-sm font-semibold">{option.label}</span>
                <span
                  className={`mt-0.5 block text-xs ${selected ? "text-brand" : "text-muted"}`}
                >
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Full name" error={fieldErrors.customerName}>
            <input
              className={fieldErrors.customerName ? inputErrorClass : inputClass}
              value={customer.customerName}
              onChange={(event) => update("customerName", event.target.value)}
              autoComplete="name"
            />
          </Field>

          <Field label="Phone" error={fieldErrors.customerPhone}>
            <input
              className={fieldErrors.customerPhone ? inputErrorClass : inputClass}
              type="tel"
              value={customer.customerPhone}
              onChange={(event) => update("customerPhone", event.target.value)}
              autoComplete="tel"
            />
          </Field>

          <Field label="Email" optional error={fieldErrors.customerEmail}>
            <input
              className={fieldErrors.customerEmail ? inputErrorClass : inputClass}
              type="email"
              value={customer.customerEmail}
              onChange={(event) => update("customerEmail", event.target.value)}
              autoComplete="email"
            />
          </Field>

          {orderType === "DELIVERY" ? (
            <Field label="Delivery address" error={fieldErrors.deliveryAddress}>
              <textarea
                className={`${fieldErrors.deliveryAddress ? inputErrorClass : inputClass} min-h-24 resize-y`}
                value={customer.deliveryAddress}
                onChange={(event) => update("deliveryAddress", event.target.value)}
                autoComplete="street-address"
              />
            </Field>
          ) : (
            <PickupLocation pickup={pickup} />
          )}
        </div>

        <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">
              {orderType === "DELIVERY" ? "Delivery" : "Pickup"}
            </dt>
            <dd className="font-medium">
              {appliedDeliveryFee > 0 ? formatMoney(appliedDeliveryFee) : "Free"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="text-xl font-bold tracking-[-0.02em]">
              {formatMoney(total)}
            </dd>
          </div>
        </dl>

        {formError ? (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          onClick={submit}
          disabled={pending || blocked}
          className="mt-5 w-full"
        >
          {pending ? "Placing order…" : `Place order · ${formatMoney(total)}`}
        </Button>

        <p className="mt-3 text-center text-xs text-muted">
          The shop confirms every order before it is prepared.
        </p>
      </Card>
    </div>
  );
}
