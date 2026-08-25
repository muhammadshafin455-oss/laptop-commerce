/**
 * Money is stored as `Decimal` in Postgres and arrives as a Prisma `Decimal`
 * object, which cannot cross the server/client boundary. Everything leaving a
 * Server Component is normalised to a plain number of currency units here.
 */

type DecimalLike = { toString(): string };

export function toNumber(value: DecimalLike | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Rounds to 2 decimals, avoiding float drift like 0.1 + 0.2. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Applies a percentage discount (0-100) to a base price. */
export function applyDiscount(price: number, discountPercent: number): number {
  const safeDiscount = Math.min(Math.max(discountPercent, 0), 100);
  return round2(price * (1 - safeDiscount / 100));
}

/**
 * `Intl` formats PKR with zero decimal places by default, which would round a
 * Rs 7.50 delivery fee to Rs 8 and stop line items adding up to the total.
 * Prices are stored as Decimal(10,2), so two decimals are forced to keep what
 * is shown identical to what is charged.
 */
const formatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return formatter.format(round2(value));
}
