import { CheckCheck, DollarSign } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { OrderCard } from "@/components/order-card";
import { Card, StatCard } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getOrderCountsByPhone, getOrderStats, getOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCompletedPage() {
  await guardAdmin();

  const [completed, stats, ordersPerPhone] = await Promise.all([
    getOrders(["COMPLETED"]),
    getOrderStats(),
    getOrderCountsByPhone(),
  ]);

  return (
    <AdminShell
      title="Completed"
      description="Orders the customer has received. Kept out of the working list."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Completed orders"
          value={String(stats.counts.COMPLETED)}
          icon={CheckCheck}
          tone="success"
        />
        <StatCard
          label="Revenue earned"
          value={formatMoney(stats.revenueByStatus.COMPLETED)}
          icon={DollarSign}
          tone="success"
        />
      </div>

      {completed.length === 0 ? (
        <Card className="mt-6 px-6 py-14 text-center">
          <p className="text-muted">No completed orders yet.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {completed.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              customerOrderCount={ordersPerPhone.get(order.customerPhone)}
              showActions={false}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
