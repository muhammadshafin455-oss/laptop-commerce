import {
  ArrowRight,
  Check,
  CircleAlert,
  Mail,
  MapPin,
  Phone,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, Card, STATUS_LABELS, StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { PickupLocation } from "@/components/pickup-details";
import { getOrderById, getPickupDetails } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The happy path an order walks through, per fulfilment type. */
const DELIVERY_TRACK: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

const PICKUP_TRACK: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
];

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const order = await getOrderById(id);

  if (!order) notFound();

  // Self-pickup customers need to know where to collect from.
  const pickup =
    order.orderType === "SELF_PICKUP" ? await getPickupDetails() : null;

  const track = order.orderType === "DELIVERY" ? DELIVERY_TRACK : PICKUP_TRACK;
  const currentIndex = track.indexOf(order.status);
  const closed = order.status === "REJECTED" || order.status === "CANCELLED";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Order #{order.id.slice(-8)}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
              Thanks, {order.customerName.split(" ")[0]}.
            </h1>
            <p className="mt-2 text-muted">
              Placed{" "}
              {new Date(order.createdAt).toLocaleString("en-US", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {closed ? (
          <Card className="mt-8 border-danger/40 p-5">
            <p className="flex items-center gap-2 font-semibold text-danger">
              <CircleAlert className="h-[18px] w-[18px]" />
              This order was {order.status === "REJECTED" ? "rejected" : "cancelled"}.
            </p>
            {order.rejectionNote ? (
              <p className="mt-2 text-sm leading-6 text-ink">{order.rejectionNote}</p>
            ) : null}
          </Card>
        ) : (
          <Card className="mt-8 p-6">
            <ol className="space-y-0">
              {track.map((step, index) => {
                const done = index < currentIndex;
                const current = index === currentIndex;
                const last = index === track.length - 1;
                return (
                  <li key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          done
                            ? "bg-success text-white"
                            : current
                              ? "bg-brand text-white ring-4 ring-brand-ring"
                              : "border border-line-strong bg-surface text-subtle"
                        }`}
                      >
                        {done ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      {!last ? (
                        <span
                          className={`w-0.5 flex-1 ${done ? "bg-success" : "bg-line"}`}
                        />
                      ) : null}
                    </div>
                    <span
                      className={`pb-6 pt-1.5 text-sm ${
                        current
                          ? "font-semibold text-ink"
                          : done
                            ? "text-muted"
                            : "text-subtle"
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {item.chargerName}
                  </span>
                  <span className="text-sm text-muted">
                    {item.quantity} × {formatMoney(item.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatMoney(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-muted">
                {order.orderType === "DELIVERY" ? (
                  <>
                    <Truck className="h-4 w-4" /> Delivery
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4" /> Self pickup
                  </>
                )}
              </dt>
              <dd className="font-medium">
                {order.deliveryFee > 0 ? formatMoney(order.deliveryFee) : "Free"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-xl font-bold tracking-[-0.02em]">
                {formatMoney(order.total)}
              </dd>
            </div>
          </dl>
        </Card>

        {pickup ? (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">Where to collect</h2>
            <PickupLocation pickup={pickup} />
          </div>
        ) : null}

        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold">
            {order.orderType === "DELIVERY" ? "Delivering to" : "Your details"}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <UserRound className="h-4 w-4 shrink-0 text-subtle" />
              <span className="font-medium">{order.customerName}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-subtle" />
              <span className="text-muted">{order.customerPhone}</span>
            </li>
            {order.customerEmail ? (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-subtle" />
                <span className="text-muted">{order.customerEmail}</span>
              </li>
            ) : null}
            {order.deliveryAddress ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                <span className="whitespace-pre-line text-muted">
                  {order.deliveryAddress}
                </span>
              </li>
            ) : null}
          </ul>
        </Card>

        <ButtonLink href="/chargers" size="lg" className="mt-8">
          Keep shopping
          <ArrowRight className="h-[18px] w-[18px]" />
        </ButtonLink>
      </main>

      <SiteFooter />
    </div>
  );
}
