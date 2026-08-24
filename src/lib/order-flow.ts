import type { FulfillmentType, OrderStatus } from "@/lib/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending review",
  CONFIRMED: "Confirmed",
  PREPARING: "Packing",
  READY: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** Wording for the transition itself, used on the admin control. */
export const TRANSITION_LABELS: Record<OrderStatus, string> = {
  PENDING: "Back to pending review",
  CONFIRMED: "Confirm order",
  PREPARING: "Start packing",
  READY: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed — customer has the order",
  REJECTED: "Reject order",
  CANCELLED: "Cancel order",
};

/** Statuses that end an order. Nothing moves out of them. */
export const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

/** Statuses that release the order's reserved stock back to the catalogue. */
export const RESTOCKING_STATUSES: OrderStatus[] = ["REJECTED", "CANCELLED"];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * The fulfilment pipeline, one stage at a time.
 *
 *   PENDING    the shop calls the customer   -> CONFIRMED | REJECTED
 *   CONFIRMED  order accepted, start packing -> PREPARING | CANCELLED
 *   PREPARING  packed, hand off              -> READY (pickup)
 *                                            | OUT_FOR_DELIVERY (delivery)
 *                                            | CANCELLED
 *   READY / OUT_FOR_DELIVERY                 -> COMPLETED | CANCELLED
 *
 * `READY` and `OUT_FOR_DELIVERY` are mutually exclusive: only the one matching
 * how the customer chose to receive the order is ever offered.
 *
 * Terminal statuses return no transitions, which is what makes restocking
 * one-directional — see `updateOrderStatus`.
 */
export function nextStatuses(
  status: OrderStatus,
  orderType: FulfillmentType,
): OrderStatus[] {
  switch (status) {
    case "PENDING":
      return ["CONFIRMED", "REJECTED"];
    case "CONFIRMED":
      return ["PREPARING", "CANCELLED"];
    case "PREPARING":
      return [
        orderType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY",
        "CANCELLED",
      ];
    case "READY":
    case "OUT_FOR_DELIVERY":
      return ["COMPLETED", "CANCELLED"];
    default:
      return [];
  }
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  orderType: FulfillmentType,
): boolean {
  return nextStatuses(from, orderType).includes(to);
}

/** What the shop should do next, shown above the status control. */
export function stageHint(status: OrderStatus, orderType: FulfillmentType): string {
  switch (status) {
    case "PENDING":
      return "Call the customer to confirm this order, then confirm or reject it.";
    case "CONFIRMED":
      return "Order accepted. Start packing when you are ready.";
    case "PREPARING":
      return orderType === "DELIVERY"
        ? "Once packed, mark it out for delivery."
        : "Once packed, mark it ready for the customer to collect.";
    case "READY":
      return "Waiting for the customer to collect. Mark completed once they have it.";
    case "OUT_FOR_DELIVERY":
      return "On its way. Mark completed once the customer has it.";
    case "COMPLETED":
      return "This order is complete.";
    case "REJECTED":
      return "This order was rejected. Stock has been returned to the catalogue.";
    case "CANCELLED":
      return "This order was cancelled. Stock has been returned to the catalogue.";
  }
}
