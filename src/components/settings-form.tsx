"use client";

import { useActionState } from "react";
import { updateStoreSettings } from "@/app/admin/actions";
import {
  Button,
  Field,
  Notice,
  inputClass,
  inputErrorClass,
} from "@/components/ui";
import type { ActionResult, PickupDetails } from "@/lib/types";

export function StoreSettingsForm({
  deliveryFee,
  pickup,
}: {
  deliveryFee: number;
  pickup: PickupDetails;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateStoreSettings,
    null,
  );
  const cls = (error?: string) => (error ? inputErrorClass : inputClass);

  return (
    <form action={formAction} className="space-y-8">
      <section>
        <h2 className="font-bold tracking-[-0.01em]">Delivery</h2>
        <p className="mt-1 text-sm text-muted">
          Applied at checkout when a customer picks delivery.
        </p>

        <div className="mt-4 max-w-xs">
          <Field label="Delivery fee (PKR)" error={state?.fieldErrors?.deliveryFee}>
            <input
              name="deliveryFee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={deliveryFee}
              className={cls(state?.fieldErrors?.deliveryFee)}
              required
            />
          </Field>
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h2 className="font-bold tracking-[-0.01em]">Pickup location</h2>
        <p className="mt-1 text-sm text-muted">
          Shown to customers who choose self pickup, at checkout and on their
          order page. Without an address they have nowhere to collect from.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Shop name" optional>
            <input
              name="shopName"
              defaultValue={pickup.shopName ?? ""}
              placeholder="VoltSupply"
              className={cls()}
            />
          </Field>

          <Field label="Shop phone" optional>
            <input
              name="shopPhone"
              type="tel"
              defaultValue={pickup.shopPhone ?? ""}
              placeholder="+92 300 1234567"
              className={cls()}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Shop address"
              hint="Street, area, city — enough for a customer to find you."
              error={state?.fieldErrors?.shopAddress}
            >
              <textarea
                name="shopAddress"
                defaultValue={pickup.shopAddress ?? ""}
                placeholder="Shop 12, Hafeez Centre, Main Boulevard, Gulberg III, Lahore"
                className={`${cls(state?.fieldErrors?.shopAddress)} min-h-20 resize-y`}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Collection hours" optional>
              <input
                name="pickupHours"
                defaultValue={pickup.pickupHours ?? ""}
                placeholder="Mon–Sat, 11am – 9pm"
                className={cls()}
              />
            </Field>
          </div>
        </div>
      </section>

      <Notice result={state} />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
