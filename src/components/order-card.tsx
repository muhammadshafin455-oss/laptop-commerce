import { History, Mail, MapPin, Phone, Store, Truck } from "lucide-react";
import { OrderStatusForm } from "@/components/order-status-form";
import { Card, StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import type { OrderView } from "@/lib/types";

export function OrderCard({
  order,
  customerOrderCount,
  showActions = true,
}: {
  order: OrderView;
  /** Total orders from this phone number, for the repeat-customer badge. */
  customerOrderCount?: number;
  /** Completed orders are shown read-only. */
  showActions?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={order.status} />
            <span className="font-mono text-xs text-subtle">
              #{order.id.slice(-8)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
              {order.orderType === "DELIVERY" ? (
                <>
                  <Truck className="h-3.5 w-3.5" /> Delivery
                </>
              ) : (
                <>
                  <Store className="h-3.5 w-3.5" /> Pickup
                </>
              )}
            </span>
            {order.userId ? (
              <span className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                Account
              </span>
            ) : (
              <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
                Guest
              </span>
            )}
            {customerOrderCount && customerOrderCount > 1 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
                <History className="h-3.5 w-3.5" />
                Repeat customer · {customerOrderCount} orders
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-semibold tracking-[-0.01em]">
            {order.customerName}
          </h2>

          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-subtle" />
              {order.customerPhone}
            </li>
            {order.customerEmail ? (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-subtle" />
                {order.customerEmail}
              </li>
            ) : null}
            {order.deliveryAddress ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                <span className="max-w-md whitespace-pre-line">
                  {order.deliveryAddress}
                </span>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold tracking-[-0.02em]">
            {formatMoney(order.total)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-line rounded-xl border border-line bg-canvas px-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-2.5 text-sm">
            <span>
              {item.chargerName}
              <span className="ml-2 text-muted">× {item.quantity}</span>
            </span>
            <span className="font-medium">{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
        {order.deliveryFee > 0 ? (
          <li className="flex justify-between gap-4 py-2.5 text-sm text-muted">
            <span>Delivery fee</span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </li>
        ) : null}
      </ul>

      {order.rejectionNote ? (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <span className="font-semibold">Reason given:</span> {order.rejectionNote}
        </p>
      ) : null}

      {showActions ? <OrderStatusForm order={order} /> : null}
    </Card>
  );
}
