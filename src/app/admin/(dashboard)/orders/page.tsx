import { AdminShell } from "@/components/admin-shell";
import { OrderCard } from "@/components/order-card";
import { StageFilterMenu } from "@/components/stage-filter-menu";
import { Card } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { getOrderCountsByPhone, getOrderStats, getOrders } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Orders still needing work. Completed orders have their own section, so they
 * never clutter the working list.
 */
const FILTERS: { value: string; label: string; statuses: OrderStatus[] }[] = [
  {
    value: "open",
    label: "All open",
    statuses: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"],
  },
  { value: "PENDING", label: "New", statuses: ["PENDING"] },
  { value: "CONFIRMED", label: "Confirmed", statuses: ["CONFIRMED"] },
  { value: "PREPARING", label: "Packing", statuses: ["PREPARING"] },
  {
    value: "fulfilling",
    label: "Ready / out for delivery",
    statuses: ["READY", "OUT_FOR_DELIVERY"],
  },
  {
    value: "closed",
    label: "Rejected / cancelled",
    statuses: ["REJECTED", "CANCELLED"],
  },
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await guardAdmin();

  const params = await props.searchParams;
  const raw = params.status;
  const filter = (Array.isArray(raw) ? raw[0] : raw) ?? "open";
  const active = FILTERS.find((option) => option.value === filter) ?? FILTERS[0];

  // Only the orders this filter actually shows are fetched; the badge counts
  // and repeat-customer totals come from aggregates rather than a full scan.
  const [orders, stats, ordersPerPhone] = await Promise.all([
    getOrders(active.statuses),
    getOrderStats(),
    getOrderCountsByPhone(),
  ]);

  return (
    <AdminShell
      title="Orders"
      description="Call the customer, then move each order through fulfilment."
    >
      <StageFilterMenu
        current={active.value}
        options={FILTERS.map((option) => ({
          value: option.value,
          label: option.label,
          count: option.statuses.reduce(
            (sum, status) => sum + stats.counts[status],
            0,
          ),
          href:
            option.value === "open"
              ? "/admin/orders"
              : `/admin/orders?status=${option.value}`,
        }))}
      />

      {orders.length === 0 ? (
        <Card className="mt-6 px-6 py-14 text-center">
          <p className="text-muted">Nothing here right now.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              customerOrderCount={ordersPerPhone.get(order.customerPhone)}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
