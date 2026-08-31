import { markMyNotificationsRead } from "@/app/actions/notifications";
import { HeaderBar } from "@/components/header-bar";
import { NotificationToaster } from "@/components/notification-toaster";
import { getCustomerNotifications } from "@/lib/notifications";
import { getRememberedOrderIds } from "@/lib/recent-orders";
import { getCurrentUser } from "@/lib/user-auth";

/** Server wrapper: reads the session and notifications, then hands them down. */
export async function SiteHeader() {
  const [user, orderIds] = await Promise.all([
    getCurrentUser(),
    getRememberedOrderIds(),
  ]);

  // Matched on account, phone, and orders placed from this device, so guests
  // get their updates too.
  const notifications = await getCustomerNotifications({
    userId: user?.id,
    phone: user?.phone,
    orderIds,
  });

  return (
    <>
      <HeaderBar
        user={user}
        notifications={notifications}
        markNotificationsRead={markMyNotificationsRead}
      />
      <NotificationToaster audience="customer" />
    </>
  );
}
