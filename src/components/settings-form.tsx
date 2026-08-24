"use client";

import { useActionState } from "react";
import { updateDeliveryFee } from "@/app/admin/actions";
import {
  Button,
  Field,
  Notice,
  inputClass,
  inputErrorClass,
} from "@/components/ui";
import type { ActionResult } from "@/lib/types";

export function DeliveryFeeForm({ deliveryFee }: { deliveryFee: number }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateDeliveryFee,
    null,
  );

  return (
    <form action={formAction}>
      <Field
        label="Delivery fee (USD)"
        hint="Charged on delivery orders only. Set to 0 for free delivery."
        error={state?.fieldErrors?.deliveryFee}
      >
        <input
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={deliveryFee}
          className={state?.fieldErrors?.deliveryFee ? inputErrorClass : inputClass}
          required
        />
      </Field>

      <Notice result={state} />

      <Button type="submit" disabled={pending} className="mt-5">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
