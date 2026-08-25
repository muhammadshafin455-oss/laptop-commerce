"use client";

import {
  Check,
  CheckCheck,
  CircleCheck,
  Info,
  Package,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useActionState, useState } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { buttonClass, inputClass, inputErrorClass } from "@/components/ui";
import {
  RESTOCKING_STATUSES,
  TRANSITION_LABELS,
  isTerminal,
  nextStatuses,
  stageHint,
} from "@/lib/order-flow";
import type { ActionResult, OrderStatus, OrderView } from "@/lib/types";

const ICONS: Record<OrderStatus, typeof Check> = {
  PENDING: Info,
  CONFIRMED: Check,
  PREPARING: Package,
  READY: Store,
  OUT_FOR_DELIVERY: Truck,
  COMPLETED: CheckCheck,
  REJECTED: X,
  CANCELLED: X,
};

export function OrderStatusForm({ order }: { order: OrderView }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateOrderStatus,
    null,
  );
  // Which negative action the user is confirming a reason for, if any.
  const [askingReasonFor, setAskingReasonFor] = useState<OrderStatus | null>(null);

  const hint = stageHint(order.status, order.orderType);

  if (isTerminal(order.status)) {
    return (
      <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
        <CircleCheck className="h-4 w-4 shrink-0 text-subtle" />
        {hint}
      </p>
    );
  }

  // Only the moves valid from this stage, and only the pickup/delivery step
  // matching how the customer is receiving the order.
  const options = nextStatuses(order.status, order.orderType);
  const forward = options.filter((value) => !RESTOCKING_STATUSES.includes(value));
  const negative = options.filter((value) => RESTOCKING_STATUSES.includes(value));

  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        {hint}
      </p>

      {/* A submit button's name/value is part of the payload, so each button
          carries the status it moves the order to — no dropdown needed. */}
      <form action={formAction} className="mt-4">
        <input type="hidden" name="id" value={order.id} />

        {askingReasonFor ? (
          <div className="rounded-xl border border-danger/30 bg-danger-soft p-4">
            <label className="block">
              <span className="text-sm font-semibold text-danger">
                Why is this order being{" "}
                {askingReasonFor === "REJECTED" ? "rejected" : "cancelled"}?
              </span>
              <textarea
                name="rejectionNote"
                defaultValue={order.rejectionNote ?? ""}
                autoFocus
                placeholder="Shown to the customer on their order page."
                className={`${state?.fieldErrors?.rejectionNote ? inputErrorClass : inputClass} min-h-20 resize-y`}
              />
            </label>

            {state?.fieldErrors?.rejectionNote ? (
              <p className="mt-1 text-xs font-medium text-danger">
                {state.fieldErrors.rejectionNote}
              </p>
            ) : null}

            <p className="mt-2 text-xs text-muted">
              The reserved stock goes back to the catalogue.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                name="status"
                value={askingReasonFor}
                disabled={pending}
                className={buttonClass("danger", "md")}
              >
                <X className="h-4 w-4" />
                {pending
                  ? "Saving…"
                  : askingReasonFor === "REJECTED"
                    ? "Reject this order"
                    : "Cancel this order"}
              </button>
              <button
                type="button"
                onClick={() => setAskingReasonFor(null)}
                className={buttonClass("ghost", "md")}
              >
                Never mind
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {forward.map((value) => {
              const Icon = ICONS[value];
              return (
                <button
                  key={value}
                  type="submit"
                  name="status"
                  value={value}
                  disabled={pending}
                  className={buttonClass("primary", "md")}
                >
                  <Icon className="h-4 w-4" />
                  {pending ? "Saving…" : TRANSITION_LABELS[value]}
                </button>
              );
            })}

            {/* Pushed to the right so a destructive action is never adjacent
                to the one the shop clicks every day. */}
            {negative.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAskingReasonFor(value)}
                className={`${buttonClass("ghost", "md")} ml-auto hover:!bg-danger-soft hover:!text-danger`}
              >
                <X className="h-4 w-4" />
                {TRANSITION_LABELS[value]}
              </button>
            ))}
          </div>
        )}

        {state?.message && !state.ok ? (
          <p className="mt-3 text-sm font-medium text-danger">{state.message}</p>
        ) : null}
      </form>
    </div>
  );
}
