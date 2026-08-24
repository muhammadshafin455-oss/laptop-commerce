import {
  Clock,
  DollarSign,
  Loader,
  Mail,
  MapPin,
  Phone,
  History,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { OrderStatusForm } from "@/components/order-status-form";
import { StageFilterMenu } from "@/components/stage-filter-menu";
import { Card, StatusBadge } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { formatMoney, round2 } from "@/lib/money";
import { getOrders } from "@/lib/queries";
import type { OrderStatus, OrderView } from "@/lib/types";

export const dynamic = "force-dynamic";

/** One screen per stage of the fulfilment pipeline. */
const FILTERS: { value: string; label: string; statuses: OrderStatus[] | null }[] = [
  { value: "all", label: "All", statuses: null },
  { value: "PENDING", label: "New", statuses: ["PENDING"] },
  { value: "CONFIRMED", label: "Confirmed", statuses: ["CONFIRMED"] },
  { value: "PREPARING", label: "Packing", statuses: ["PREPARING"] },
  {
    value: "fulfilling",
    label: "Ready / out for delivery",
    statuses: ["READY", "OUT_FOR_DELIVERY"],
  },
  { value: "COMPLETED", label: "Completed", statuses: ["COMPLETED"] },
  // A cancelled order lands here alongside rejected ones.
  { value: "closed", label: "Rejected / cancelled", statuses: ["REJECTED", "CANCELLED"] },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

function matchesFilter(order: OrderView, filter: string): boolean {
  const entry = FILTERS.find((option) => option.value === filter);
  if (!entry || entry.statuses === null) return true;
  return entry.statuses.includes(order.status);
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: typeof Clock;
  tone?: "brand" | "warn" | "success";
}) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    warn: "bg-warn-soft text-warn",
    success: "bg-success-soft text-success",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-[-0.02em]">{value}</p>
      </div>
    </Card>
  );
}

export default async function AdminOrdersPage(props: PageProps<"/admin">) {
  await guardAdmin();

  const params = await props.searchParams;
  const raw = params.status;
  const filter = (Array.isArray(raw) ? raw[0] : raw) ?? "all";

  const orders = await getOrders();
  const visible = orders.filter((order) => matchesFilter(order, filter));

  // `orders` is newest-first, so counting backwards gives each order its
  // position in that customer's history.
  const historyIndex = new Map<string, number>();
  const ordersPerPhone = new Map<string, number>();
  for (const order of orders) {
    ordersPerPhone.set(
      order.customerPhone,
      (ordersPerPhone.get(order.customerPhone) ?? 0) + 1,
    );
  }
  const seen = new Map<string, number>();
  for (const order of [...orders].reverse()) {
    const position = (seen.get(order.customerPhone) ?? 0) + 1;
    seen.set(order.customerPhone, position);
    historyIndex.set(order.id, position);
  }

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  // Rejected and cancelled orders never became revenue.
  const revenue = round2(
    orders
      .filter((o) => o.status !== "REJECTED" && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0),
  );

  return (
    <AdminShell
      title="Orders"
      description="Review incoming orders and move them through fulfilment."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Needs a call" value={String(pendingCount)} icon={Clock} tone="warn" />
        <Stat label="In progress" value={String(activeCount)} icon={Loader} />
        <Stat label="Total orders" value={String(orders.length)} icon={ShoppingBag} />
        <Stat
          label="Booked revenue"
          value={formatMoney(revenue)}
          icon={DollarSign}
          tone="success"
        />
      </div>

      <div className="mt-8">
        <StageFilterMenu
          current={filter}
          options={FILTERS.map((option) => ({
            value: option.value,
            label: option.label,
            count: orders.filter((order) => matchesFilter(order, option.value)).length,
            href:
              option.value === "all" ? "/admin" : `/admin?status=${option.value}`,
          }))}
        />
      </div>

      {visible.length === 0 ? (
        <Card className="mt-6 px-6 py-14 text-center">
          <p className="text-muted">No orders match this filter yet.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {visible.map((order) => (
            <Card key={order.id} className="p-6">
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
                    {(ordersPerPhone.get(order.customerPhone) ?? 0) > 1 ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted"
                        title={`This number has placed ${ordersPerPhone.get(order.customerPhone)} orders in total`}
                      >
                        <History className="h-3.5 w-3.5" />
                        Order #{historyIndex.get(order.id)} from this customer
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
                  <span className="font-semibold">Rejection note:</span>{" "}
                  {order.rejectionNote}
                </p>
              ) : null}

              <OrderStatusForm order={order} />
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
