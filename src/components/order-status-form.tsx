"use client";

import { CheckCircle2, Info } from "lucide-react";
import { useActionState, useState } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { Button, Notice, inputClass, inputErrorClass } from "@/components/ui";
import {
  RESTOCKING_STATUSES,
  STATUS_LABELS,
  TRANSITION_LABELS,
  isTerminal,
  nextStatuses,
  stageHint,
} from "@/lib/order-flow";
import type { ActionResult, OrderStatus, OrderView } from "@/lib/types";

export function OrderStatusForm({ order }: { order: OrderView }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateOrderStatus,
    null,
  );
  const [status, setStatus] = useState<OrderStatus>(order.status);

  // Only the moves that are valid from this order's current stage, and only
  // the pickup/delivery step that matches how the customer is receiving it.
  const options = nextStatuses(order.status, order.orderType);
  const hint = stageHint(order.status, order.orderType);
  const needsNote = RESTOCKING_STATUSES.includes(status);

  if (isTerminal(order.status)) {
    return (
      <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-subtle" />
        {hint}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-5 border-t border-line pt-5">
      <input type="hidden" name="id" value={order.id} />

      <p className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        {hint}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1">
          <span className="text-sm font-medium">Next step</span>
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            className={inputClass}
          >
            <option value={order.status}>
              Stay {STATUS_LABELS[order.status].toLowerCase()}
            </option>
            {options.map((value) => (
              <option key={value} value={value}>
                {TRANSITION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" disabled={pending || status === order.status}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>

      {needsNote ? (
        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Reason
            {status === "CANCELLED" ? (
              <span className="ml-2 text-xs font-normal text-subtle">Optional</span>
            ) : null}
          </span>
          <textarea
            name="rejectionNote"
            defaultValue={order.rejectionNote ?? ""}
            placeholder="Shown to the customer on their order page."
            className={`${state?.fieldErrors?.rejectionNote ? inputErrorClass : inputClass} min-h-20 resize-y`}
          />
          {state?.fieldErrors?.rejectionNote ? (
            <span className="mt-1 block text-xs font-medium text-danger">
              {state.fieldErrors.rejectionNote}
            </span>
          ) : null}
          <span className="mt-1 block text-xs text-muted">
            The reserved stock goes back to the catalogue.
          </span>
        </label>
      ) : null}

      <Notice result={state} />
    </form>
  );
}
