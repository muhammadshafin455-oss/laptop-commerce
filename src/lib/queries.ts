import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyDiscount, round2, toNumber } from "@/lib/money";
import { normalizePhone } from "@/lib/user-auth";
import type {
  ChargerView,
  FulfillmentType,
  OrderStatus,
  OrderView,
} from "@/lib/types";

// Only the image's timestamp is selected — never its bytes — so listing the
// catalogue stays cheap no matter how large the uploads are.
const chargerSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  price: true,
  discount: true,
  stock: true,
  isAvailable: true,
  createdAt: true,
  image: { select: { updatedAt: true } },
} as const;

type ChargerRow = Awaited<
  ReturnType<
    typeof prisma.charger.findFirstOrThrow<{ select: typeof chargerSelect }>
  >
>;

export function mapCharger(row: ChargerRow): ChargerView {
  const price = toNumber(row.price);
  const discount = toNumber(row.discount);
  // `?v=` lets the image response be cached hard and still update on re-upload.
  const imageSrc = row.image
    ? `/api/charger-image/${row.id}?v=${row.image.updatedAt.getTime()}`
    : row.imageUrl;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    imageSrc,
    hasUploadedImage: !!row.image,
    price,
    discount,
    finalPrice: applyDiscount(price, discount),
    stock: row.stock,
    isAvailable: row.isAvailable,
    isPurchasable: row.isAvailable && row.stock > 0,
  };
}

/**
 * Storefront catalogue: only chargers the shop is actively selling, optionally
 * narrowed by a shopper's search. Name and description are both matched, so
 * "65W", "usb-c" and "thinkpad" all find something.
 */
export async function getStorefrontChargers(
  query?: string,
): Promise<ChargerView[]> {
  const trimmed = query?.trim();

  const where: Prisma.ChargerWhereInput = { isAvailable: true };
  if (trimmed) {
    where.OR = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.charger.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: chargerSelect,
  });
  return rows.map(mapCharger);
}

/** Total listed chargers, so a filtered view can say what it filtered from. */
export async function countStorefrontChargers(): Promise<number> {
  return prisma.charger.count({ where: { isAvailable: true } });
}

/** Admin catalogue: everything, including hidden and out-of-stock chargers. */
export async function getAllChargers(): Promise<ChargerView[]> {
  const rows = await prisma.charger.findMany({
    orderBy: { createdAt: "desc" },
    select: chargerSelect,
  });
  return rows.map(mapCharger);
}

export async function getChargerById(id: string): Promise<ChargerView | null> {
  const row = await prisma.charger.findUnique({
    where: { id },
    select: chargerSelect,
  });
  return row ? mapCharger(row) : null;
}

/**
 * `StoreSetting` is a single-row table. Read it lazily and create the default
 * row on first access so a fresh database needs no manual setup.
 */
export async function getStoreSetting() {
  const existing = await prisma.storeSetting.findFirst();
  if (existing) return existing;
  return prisma.storeSetting.create({ data: {} });
}

export async function getDeliveryFee(): Promise<number> {
  const setting = await getStoreSetting();
  return toNumber(setting.deliveryFee);
}

const orderInclude = {
  items: { include: { charger: { select: { name: true } } } },
} as const;

type OrderRow = Awaited<
  ReturnType<
    typeof prisma.order.findFirstOrThrow<{ include: typeof orderInclude }>
  >
>;

export function mapOrder(row: OrderRow): OrderView {
  return {
    id: row.id,
    userId: row.userId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    deliveryAddress: row.deliveryAddress,
    orderType: row.orderType as FulfillmentType,
    deliveryFee: toNumber(row.deliveryFee),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    status: row.status as OrderStatus,
    rejectionNote: row.rejectionNote,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => {
      const unitPrice = toNumber(item.unitPrice);
      return {
        id: item.id,
        chargerId: item.chargerId,
        chargerName: item.charger.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: round2(unitPrice * item.quantity),
      };
    }),
  };
}

export async function getOrders(): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapOrder);
}

export async function getOrderById(id: string): Promise<OrderView | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  return row ? mapOrder(row) : null;
}

/**
 * Customer-facing lookup. Matches whatever the visitor is most likely to type:
 * an order ID, their name, their email, or their phone number — the last two
 * partially, so "0331" or "shafin" find something rather than nothing.
 */
export async function findOrders(query: string): Promise<OrderView[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const clauses: Prisma.OrderWhereInput[] = [
    { id: trimmed },
    { customerName: { contains: trimmed, mode: "insensitive" } },
    { customerEmail: { contains: trimmed, mode: "insensitive" } },
  ];

  // Phone numbers are stored as digits only, so the query is reduced the same
  // way before matching. Guarded on length because `contains: ""` matches every
  // row — which is exactly what a name-only search would otherwise produce.
  const digits = normalizePhone(trimmed);
  if (digits.length >= 3) {
    clauses.push({ customerPhone: { contains: digits } });
  }

  const rows = await prisma.order.findMany({
    where: { OR: clauses },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapOrder);
}

/**
 * A signed-in customer's history. Orders placed as a guest with the same phone
 * number are included, so checking out before signing in does not hide them.
 */
export async function getOrdersForUser(
  userId: string,
  phone: string,
): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    where: { OR: [{ userId }, { customerPhone: phone }] },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapOrder);
}

