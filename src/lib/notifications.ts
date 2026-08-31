import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import type { FulfillmentType, OrderStatus } from "@/lib/types";

type OrderSummaryInput = {
  id: string;
  customerName: string;
  total: number;
  orderType: FulfillmentType;
  itemCount: number;
};

type StatusChangeInput = {
  id: string;
  status: OrderStatus;
  userId: string | null;
  customerPhone: string;
  rejectionNote: string | null;
};

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  orderId: string | null;
  createdAt: string;
  read: boolean;
};

/** Statuses worth telling the customer about. */
const CUSTOMER_MESSAGES: Partial<
  Record<OrderStatus, (order: StatusChangeInput) => { title: string; body: string }>
> = {
  READY: (order) => ({
    title: "Your order is ready for pickup",
    body: `Order #${order.id.slice(-8)} is packed and waiting for you to collect.`,
  }),
  OUT_FOR_DELIVERY: (order) => ({
    title: "Your order is out for delivery",
    body: `Order #${order.id.slice(-8)} is on its way to you.`,
  }),
  REJECTED: (order) => ({
    title: "Your order was rejected",
    body:
      order.rejectionNote?.trim() ||
      `Order #${order.id.slice(-8)} could not be fulfilled.`,
  }),
  CANCELLED: (order) => ({
    title: "Your order was cancelled",
    body:
      order.rejectionNote?.trim() ||
      `Order #${order.id.slice(-8)} has been cancelled.`,
  }),
  CONFIRMED: (order) => ({
    title: "Your order is confirmed",
    body: `The shop confirmed order #${order.id.slice(-8)} and will start preparing it.`,
  }),
  COMPLETED: (order) => ({
    title: "Order complete",
    body: `Thanks! Order #${order.id.slice(-8)} is complete.`,
  }),
};

const KIND_FOR_STATUS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "ORDER_CONFIRMED",
  PREPARING: "ORDER_PACKING",
  READY: "ORDER_READY",
  OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  COMPLETED: "ORDER_COMPLETED",
  REJECTED: "ORDER_REJECTED",
  CANCELLED: "ORDER_CANCELLED",
};

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

/** Tells the shop a new order came in. */
export async function notifyAdminOfNewOrder(
  order: OrderSummaryInput,
): Promise<void> {
  const items = order.itemCount;
  await prisma.notification.create({
    data: {
      audience: "ADMIN",
      kind: "ORDER_PLACED",
      title: `New order from ${order.customerName}`,
      body: `${items} ${items === 1 ? "item" : "items"} · ${formatMoney(order.total)} · ${
        order.orderType === "DELIVERY" ? "Delivery" : "Self pickup"
      }. Call to confirm.`,
      orderId: order.id,
    },
  });
}

/**
 * Tells the customer their order moved on. Returns quietly for stages that are
 * internal to the shop, such as packing.
 */
export async function notifyCustomerOfStatus(
  order: StatusChangeInput,
): Promise<void> {
  const build = CUSTOMER_MESSAGES[order.status];
  const kind = KIND_FOR_STATUS[order.status];
  if (!build || !kind) return;

  const { title, body } = build(order);
  await prisma.notification.create({
    data: {
      audience: "CUSTOMER",
      kind: kind as never,
      title,
      body,
      orderId: order.id,
      userId: order.userId,
      phone: order.customerPhone,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

const LIST_LIMIT = 15;

function toView(row: {
  id: string;
  title: string;
  body: string;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationView {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    orderId: row.orderId,
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
  };
}

export async function getAdminNotifications(): Promise<{
  items: NotificationView[];
  unread: number;
}> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { audience: "ADMIN" },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    }),
    prisma.notification.count({ where: { audience: "ADMIN", readAt: null } }),
  ]);
  return { items: rows.map(toView), unread };
}

/**
 * A customer's notifications, matched on their account, their phone number, or
 * the orders remembered on this device — so guests are covered too.
 */
export async function getCustomerNotifications(match: {
  userId?: string | null;
  phone?: string | null;
  orderIds: string[];
}): Promise<{ items: NotificationView[]; unread: number }> {
  const clauses = [];
  if (match.userId) clauses.push({ userId: match.userId });
  if (match.phone) clauses.push({ phone: match.phone });
  if (match.orderIds.length > 0) clauses.push({ orderId: { in: match.orderIds } });

  if (clauses.length === 0) return { items: [], unread: 0 };

  const where = { audience: "CUSTOMER" as const, OR: clauses };
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ]);
  return { items: rows.map(toView), unread };
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.notification.updateMany({
    where: { id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
}
