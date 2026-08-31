import { isAdmin } from "@/lib/auth";
import {
  getAdminNotifications,
  getCustomerNotifications,
} from "@/lib/notifications";
import { getRememberedOrderIds } from "@/lib/recent-orders";
import { getCurrentUser } from "@/lib/user-auth";

/**
 * Polled by the toaster so new notifications can pop up without a reload.
 * Returns only what this viewer is entitled to see: the shop's queue for a
 * signed-in admin, or the customer's own — matched on account, phone, and the
 * orders remembered on this device.
 */
export async function GET(request: Request) {
  const audience = new URL(request.url).searchParams.get("audience");

  if (audience === "admin") {
    if (!(await isAdmin())) {
      return Response.json({ items: [], unread: 0 }, { status: 401 });
    }
    const { items, unread } = await getAdminNotifications();
    return Response.json({ items, unread });
  }

  const [user, orderIds] = await Promise.all([
    getCurrentUser(),
    getRememberedOrderIds(),
  ]);
  const { items, unread } = await getCustomerNotifications({
    userId: user?.id,
    phone: user?.phone,
    orderIds,
  });
  return Response.json({ items, unread });
}
