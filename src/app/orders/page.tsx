import { ArrowRight, PackageSearch, Search } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Button,
  ButtonLink,
  Card,
  SectionHeading,
  StatusBadge,
  inputClass,
} from "@/components/ui";
import { formatMoney } from "@/lib/money";
import {
  findOrders,
  getOrdersByIds,
  getOrdersForUser,
} from "@/lib/queries";
import { getRememberedOrderIds } from "@/lib/recent-orders";
import type { OrderView } from "@/lib/types";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function OrderRow({ order }: { order: OrderView }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-brand">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={order.status} />
            <span className="font-mono text-xs text-subtle">
              #{order.id.slice(-8)}
            </span>
          </div>
          <p className="mt-2.5 font-semibold tracking-[-0.01em]">
            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            {formatMoney(order.total)}
          </p>
          <p className="mt-1 truncate text-sm text-muted">
            {order.items.map((item) => item.chargerName).join(", ")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </span>
          <ArrowRight className="h-[18px] w-[18px] text-subtle" />
        </div>
      </Card>
    </Link>
  );
}

/** A short roll-up so the page reads as a history, not just a result list. */
function Summary({ orders }: { orders: OrderView[] }) {
  const spent = orders
    .filter((order) => order.status !== "REJECTED" && order.status !== "CANCELLED")
    .reduce((sum, order) => sum + order.total, 0);
  const active = orders.filter(
    (order) =>
      order.status !== "COMPLETED" &&
      order.status !== "REJECTED" &&
      order.status !== "CANCELLED",
  ).length;

  return (
    <dl className="mt-8 grid gap-4 sm:grid-cols-3">
      {[
        { label: "Orders", value: String(orders.length) },
        { label: "In progress", value: String(active) },
        { label: "Total spent", value: formatMoney(spent) },
      ].map((stat) => (
        <Card key={stat.label} className="p-4">
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd className="mt-0.5 text-2xl font-bold tracking-[-0.02em]">
            {stat.value}
          </dd>
        </Card>
      ))}
    </dl>
  );
}

export default async function OrdersPage(props: PageProps<"/orders">) {
  const params = await props.searchParams;
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  const user = await getCurrentUser();

  // A signed-in customer sees their own history; the lookup form stays
  // available for orders placed as a guest.
  // Without a search, show everything this visitor can claim: their account's
  // orders plus anything placed on this device as a guest.
  let results: OrderView[];
  if (query) {
    results = await findOrders(query);
  } else {
    const [accountOrders, deviceOrders] = await Promise.all([
      user ? getOrdersForUser(user.id, user.phone) : Promise.resolve([]),
      getRememberedOrderIds().then(getOrdersByIds),
    ]);
    const byId = new Map<string, OrderView>();
    for (const order of [...accountOrders, ...deviceOrders]) {
      byId.set(order.id, order);
    }
    results = [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  const showingOwnOrders = !query;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Order status"
          title={showingOwnOrders ? "My orders" : "Track an order"}
          description={
            !showingOwnOrders
              ? "Search by your name, phone number, email, or order ID."
              : user
                ? `Orders on this account, and any placed with ${user.phone} or from this device.`
                : "Orders placed from this device. Sign in to keep them across devices."
          }
        />

        {/* A plain GET form keeps results linkable and works without JS. */}
        <form className="mt-8 flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Name, phone, email, or order ID"
              aria-label="Search by name, phone number, email address, or order ID"
              className={`${inputClass} mt-0 pl-10`}
            />
          </div>
          <Button type="submit">Find order</Button>
        </form>

        {results.length === 0 ? (
          <Card className="mt-8 flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <PackageSearch className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold">
              {query ? "No orders found" : "No orders yet"}
            </h2>
            <p className="mt-2 max-w-sm text-muted">
              {query ? (
                <>
                  Nothing matched{" "}
                  <span className="font-medium text-ink">{query}</span>. Check the
                  number or ID and try again.
                </>
              ) : (
                "Once you place an order it will appear here."
              )}
            </p>
            <ButtonLink href="/chargers" variant="secondary" className="mt-6">
              Browse chargers
            </ButtonLink>
          </Card>
        ) : (
          <>
            <Summary orders={results} />
            <div className="mt-6 space-y-4">
              {results.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
