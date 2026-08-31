import { cookies } from "next/headers";

/**
 * Orders placed on this device, remembered so a guest can find them again
 * under "My orders" without signing in or pasting an order ID.
 *
 * Only order IDs are stored, and `/orders/[id]` is already reachable by anyone
 * holding an ID — so this exposes nothing new. It is `httpOnly` simply because
 * no client code needs to read it.
 */
const COOKIE_NAME = "vs_orders";
const MAX_REMEMBERED = 20;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function getRememberedOrderIds(): Promise<string[]> {
  const store = await cookies();
  return parse(store.get(COOKIE_NAME)?.value);
}

/** Called from `placeOrder`, so the order shows up straight after checkout. */
export async function rememberOrder(orderId: string): Promise<void> {
  const store = await cookies();
  const next = [orderId, ...parse(store.get(COOKIE_NAME)?.value).filter((id) => id !== orderId)]
    .slice(0, MAX_REMEMBERED);

  store.set(COOKIE_NAME, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}
