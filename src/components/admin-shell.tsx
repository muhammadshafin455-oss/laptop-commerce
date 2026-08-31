import type { ReactNode } from "react";
import { markAdminNotificationsRead } from "@/app/actions/notifications";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationToaster } from "@/components/notification-toaster";
import { getAdminNotifications } from "@/lib/notifications";

/**
 * Page header and content padding. The sidebar is rendered once by the
 * dashboard layout, not here.
 */
export async function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { items, unread } = await getAdminNotifications();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <NotificationToaster audience="admin" />
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-muted">{description}</p>
          ) : null}
        </div>
        <NotificationBell
          items={items}
          unread={unread}
          markRead={markAdminNotificationsRead}
          linkTo="admin"
        />
      </header>
      {children}
    </main>
  );
}
