import {
  AlertTriangle,
  Boxes,
  CheckCheck,
  Clock,
  DollarSign,
  Loader,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Card, StatCard } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/order-flow";
import { formatMoney, round2 } from "@/lib/money";
import { getInventoryStats, getOrderStats } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Stages shown in the pipeline breakdown, in the order work flows through. */
const PIPELINE: { status: OrderStatus; filter: string }[] = [
  { status: "PENDING", filter: "PENDING" },
  { status: "CONFIRMED", filter: "CONFIRMED" },
  { status: "PREPARING", filter: "PREPARING" },
  { status: "READY", filter: "fulfilling" },
  { status: "OUT_FOR_DELIVERY", filter: "fulfilling" },
];

export default async function AdminDashboardPage() {
  await guardAdmin();

  // Both are database aggregates — no order or product rows are loaded here.
  const [stats, inventory] = await Promise.all([
    getOrderStats(),
    getInventoryStats(),
  ]);

  const countOf = (status: OrderStatus) => stats.counts[status];

  const inProgress =
    countOf("CONFIRMED") +
    countOf("PREPARING") +
    countOf("READY") +
    countOf("OUT_FOR_DELIVERY");

  const closed = countOf("REJECTED") + countOf("CANCELLED");

  // Rejected and cancelled orders never became revenue.
  const booked = round2(
    (Object.keys(stats.revenueByStatus) as OrderStatus[])
      .filter((status) => status !== "REJECTED" && status !== "CANCELLED")
      .reduce((sum, status) => sum + stats.revenueByStatus[status], 0),
  );
  const earned = stats.revenueByStatus.COMPLETED;

  return (
    <AdminShell title="Dashboard" description="How the store is doing right now.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Needs a call"
          value={String(countOf("PENDING"))}
          hint="Waiting to be confirmed"
          icon={Clock}
          tone="warn"
          href="/admin/orders?status=PENDING"
        />
        <StatCard
          label="In progress"
          value={String(inProgress)}
          hint="Confirmed through to delivery"
          icon={Loader}
          href="/admin/orders"
        />
        <StatCard
          label="Completed"
          value={String(countOf("COMPLETED"))}
          hint={`${formatMoney(earned)} earned`}
          icon={CheckCheck}
          tone="success"
          href="/admin/completed"
        />
        <StatCard
          label="Booked revenue"
          value={formatMoney(booked)}
          hint={`${stats.total} orders total`}
          icon={DollarSign}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Where the open orders are sitting */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold tracking-[-0.01em]">
            <ShoppingBag className="h-[18px] w-[18px] text-brand" />
            Order pipeline
          </h2>

          <ul className="mt-4 divide-y divide-line">
            {PIPELINE.map(({ status, filter }) => (
              <li key={status}>
                <Link
                  href={`/admin/orders?status=${filter}`}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm transition-colors hover:text-brand"
                >
                  <span>{STATUS_LABELS[status]}</span>
                  <span className="font-semibold">{countOf(status)}</span>
                </Link>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 py-2.5 text-sm text-muted">
              <span>Rejected / cancelled</span>
              <span className="font-semibold">{closed}</span>
            </li>
          </ul>
        </Card>

        {/* Inventory health */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold tracking-[-0.01em]">
            <Boxes className="h-[18px] w-[18px] text-brand" />
            Inventory
          </h2>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted">Products listed</dt>
              <dd className="mt-0.5 text-2xl font-bold tracking-[-0.02em]">
                {inventory.listed}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Pieces in stock</dt>
              <dd className="mt-0.5 text-2xl font-bold tracking-[-0.02em]">
                {inventory.totalPieces}
              </dd>
            </div>
          </dl>

          {inventory.lowStock.length > 0 ? (
            <>
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-warn">
                <AlertTriangle className="h-4 w-4" />
                Needs restocking
              </p>
              <ul className="mt-2 divide-y divide-line">
                {inventory.lowStock.map((charger) => (
                  <li
                    key={charger.id}
                    className="flex items-center justify-between gap-4 py-2 text-sm"
                  >
                    <span className="truncate">{charger.name}</span>
                    <span
                      className={`shrink-0 font-semibold ${charger.stock === 0 ? "text-danger" : "text-warn"}`}
                    >
                      {charger.stock === 0 ? "Out of stock" : `${charger.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/chargers"
                className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
              >
                Manage inventory
              </Link>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted">
              Every product is comfortably in stock.
            </p>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
