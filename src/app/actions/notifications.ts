"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getCustomerNotifications,
  markNotificationsRead,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getRememberedOrderIds } from "@/lib/recent-orders";
import { getCurrentUser } from "@/lib/user-auth";

export async function markAdminNotificationsRead(): Promise<void> {
  await requireAdmin();
  await prisma.notification.updateMany({
    where: { audience: "ADMIN", readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin", "layout");
}

/**
 * Marks only the notifications this visitor can actually see — matched the same
 * way they are listed, so one customer can never clear another's.
 */
export async function markMyNotificationsRead(): Promise<void> {
  const [user, orderIds] = await Promise.all([
    getCurrentUser(),
    getRememberedOrderIds(),
  ]);

  const { items } = await getCustomerNotifications({
    userId: user?.id,
    phone: user?.phone,
    orderIds,
  });

  await markNotificationsRead(items.filter((item) => !item.read).map((i) => i.id));
  revalidatePath("/", "layout");
}
