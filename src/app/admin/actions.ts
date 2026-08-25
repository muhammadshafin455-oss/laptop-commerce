"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  endAdminSession,
  isAdminConfigured,
  requireAdmin,
  startAdminSession,
} from "@/lib/auth";
import { readImageUpload, type ImageUpload } from "@/lib/images";
import { round2 } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getStoreSetting } from "@/lib/queries";
import {
  RESTOCKING_STATUSES,
  STATUS_LABELS,
  canTransition,
  nextStatuses,
} from "@/lib/order-flow";
import type { ActionResult, FulfillmentType, OrderStatus } from "@/lib/types";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function number(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/completed");
  revalidatePath("/admin/chargers");
  revalidatePath("/admin/settings");
  revalidatePath("/chargers");
  revalidatePath("/cart");
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export async function login(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      message: "ADMIN_PASSWORD is not set on the server, so the dashboard is locked.",
    };
  }

  if (!checkPassword(text(formData, "password"))) {
    return { ok: false, message: "Incorrect password." };
  }

  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/* Chargers                                                                   */
/* -------------------------------------------------------------------------- */

type ChargerInput = {
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  isAvailable: boolean;
};

type ParsedCharger =
  | { data: ChargerInput; image: ImageUpload | null; removeImage: boolean }
  | { fieldErrors: Record<string, string> };

async function readChargerInput(formData: FormData): Promise<ParsedCharger> {
  const fieldErrors: Record<string, string> = {};

  const name = text(formData, "name");
  const description = text(formData, "description");
  const price = number(formData, "price");
  const discount = number(formData, "discount") ?? 0;
  const stock = number(formData, "stock") ?? 0;

  if (name.length < 2) fieldErrors.name = "Give the charger a name.";
  if (description.length < 10) fieldErrors.description = "Add a short description.";
  if (price === null || price <= 0) fieldErrors.price = "Price must be greater than 0.";
  if (discount < 0 || discount > 100) fieldErrors.discount = "Discount must be 0-100%.";
  if (!Number.isInteger(stock) || stock < 0) fieldErrors.stock = "Stock must be 0 or more.";

  const upload = await readImageUpload(formData.get("imageFile"));
  if (upload.kind === "error") fieldErrors.imageFile = upload.message;

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      name,
      description,
      price: round2(price!),
      discount: round2(discount),
      stock,
      isAvailable: formData.get("isAvailable") !== null,
    },
    image: upload.kind === "image" ? upload.image : null,
    removeImage: formData.get("removeImage") !== null,
  };
}

export async function createCharger(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = await readChargerInput(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  await prisma.charger.create({
    data: {
      ...parsed.data,
      // Nested create keeps the row and its photo in one write.
      ...(parsed.image ? { image: { create: parsed.image } } : {}),
    },
  });
  revalidateAdmin();
  return { ok: true, message: `"${parsed.data.name}" added to the catalogue.` };
}

export async function updateCharger(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing charger id." };

  const parsed = await readChargerInput(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  // A new upload replaces the old photo and "remove" clears it; submitting
  // neither leaves the existing photo alone. The image is written separately
  // from the charger row so removal stays idempotent — a nested `delete` on a
  // one-to-one relation throws when there is nothing to delete.
  await prisma.$transaction(async (tx) => {
    await tx.charger.update({ where: { id }, data: parsed.data });

    if (parsed.image) {
      await tx.chargerImage.upsert({
        where: { chargerId: id },
        create: { chargerId: id, ...parsed.image },
        update: parsed.image,
      });
    } else if (parsed.removeImage) {
      await tx.chargerImage.deleteMany({ where: { chargerId: id } });
    }
  });

  revalidateAdmin();
  return { ok: true, message: "Saved." };
}

export async function deleteCharger(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing charger id." };

  // Deleting inventory is destructive and Server Functions are reachable by
  // direct POST, so the confirmation is enforced here rather than relying on
  // the two-step button in the UI.
  if (text(formData, "confirm") !== "yes") {
    return { ok: false, message: "Deletion was not confirmed." };
  }

  // OrderItem holds a required reference to Charger, so a charger that has
  // been ordered cannot be deleted without destroying order history. Hide it
  // from the storefront instead.
  const orderedCount = await prisma.orderItem.count({ where: { chargerId: id } });
  if (orderedCount > 0) {
    await prisma.charger.update({
      where: { id },
      data: { isAvailable: false },
    });
    revalidateAdmin();
    return {
      ok: true,
      message: "This charger appears in past orders, so it was hidden from the storefront instead of deleted.",
    };
  }

  await prisma.charger.delete({ where: { id } });
  revalidateAdmin();
  return { ok: true, message: "Charger deleted." };
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrderStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = text(formData, "id");
  const status = text(formData, "status") as OrderStatus;
  const note = text(formData, "rejectionNote");

  if (!id) return { ok: false, message: "Missing order id." };

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === status) return { ok: true, message: "Status unchanged." };

  const from = order.status as OrderStatus;
  const orderType = order.orderType as FulfillmentType;

  // The pipeline is enforced here, not just in the dropdown: Server Functions
  // are reachable by direct POST, so an out-of-stage jump must be refused.
  if (!canTransition(from, status, orderType)) {
    const allowed = nextStatuses(from, orderType);
    return {
      ok: false,
      message:
        allowed.length === 0
          ? `This order is ${STATUS_LABELS[from].toLowerCase()} and cannot be changed further.`
          : `An order that is ${STATUS_LABELS[from].toLowerCase()} can only move to ${allowed
              .map((value) => STATUS_LABELS[value].toLowerCase())
              .join(" or ")}.`,
    };
  }

  if (status === "REJECTED" && note.length < 3) {
    return {
      ok: false,
      message: "Add a short note so the customer knows why the order was rejected.",
      fieldErrors: { rejectionNote: "Required when rejecting an order." },
    };
  }

  // Restocking only ever runs one way, because no transition leads back out of
  // a rejected or cancelled order.
  const willRestock = RESTOCKING_STATUSES.includes(status);

  await prisma.$transaction(async (tx) => {
    if (willRestock) {
      for (const item of order.items) {
        await tx.charger.update({
          where: { id: item.chargerId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id },
      data: {
        status,
        // Both negative outcomes carry their reason through to the customer.
        rejectionNote: willRestock ? note || null : null,
      },
    });
  });

  revalidateAdmin();
  revalidatePath(`/orders/${id}`);
  return { ok: true, message: "Order updated." };
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateDeliveryFee(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const fee = number(formData, "deliveryFee");
  if (fee === null || fee < 0) {
    return {
      ok: false,
      message: "Enter a delivery fee of 0 or more.",
      fieldErrors: { deliveryFee: "Must be 0 or more." },
    };
  }

  const setting = await getStoreSetting();
  await prisma.storeSetting.update({
    where: { id: setting.id },
    data: { deliveryFee: round2(fee) },
  });

  revalidateAdmin();
  return { ok: true, message: "Delivery fee updated." };
}
