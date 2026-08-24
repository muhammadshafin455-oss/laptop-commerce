"use server";

import { revalidatePath } from "next/cache";
import { applyDiscount, round2, toNumber } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getDeliveryFee } from "@/lib/queries";
import { getCurrentUser, isValidPhone, normalizePhone } from "@/lib/user-auth";
import type { FulfillmentType } from "@/lib/types";

export type PlaceOrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderType: FulfillmentType;
  items: { chargerId: string; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: PlaceOrderInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.customerName.trim().length < 2) {
    errors.customerName = "Enter the name the order is for.";
  }
  // Phone is the primary contact now that accounts are keyed on it; email is
  // optional, but must be well formed when supplied.
  if (!isValidPhone(input.customerPhone)) {
    errors.customerPhone = "Enter a reachable phone number.";
  }
  if (input.customerEmail.trim() && !EMAIL_PATTERN.test(input.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email address, or leave it blank.";
  }
  if (input.orderType === "DELIVERY" && input.deliveryAddress.trim().length < 8) {
    errors.deliveryAddress = "A delivery address is required for delivery orders.";
  }

  return errors;
}

/**
 * Creates an order from the client-held cart.
 *
 * Prices, discounts and the delivery fee are re-read from the database and
 * never taken from the client payload; the request only says *what* and *how
 * many*. Stock is decremented conditionally inside the transaction so two
 * simultaneous checkouts cannot oversell the last unit.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  // Collapse duplicate lines and drop anything non-positive.
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    quantities.set(item.chargerId, (quantities.get(item.chargerId) ?? 0) + quantity);
  }

  if (quantities.size === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  const chargers = await prisma.charger.findMany({
    where: { id: { in: [...quantities.keys()] } },
  });

  if (chargers.length !== quantities.size) {
    return {
      ok: false,
      message: "One of the chargers in your cart is no longer listed. Please review your cart.",
    };
  }

  const lines: { chargerId: string; quantity: number; unitPrice: number }[] = [];
  for (const charger of chargers) {
    const quantity = quantities.get(charger.id)!;

    if (!charger.isAvailable) {
      return { ok: false, message: `"${charger.name}" is no longer available.` };
    }
    if (charger.stock < quantity) {
      return {
        ok: false,
        message: `Only ${charger.stock} left of "${charger.name}". Please lower the quantity.`,
      };
    }

    lines.push({
      chargerId: charger.id,
      quantity,
      unitPrice: applyDiscount(toNumber(charger.price), toNumber(charger.discount)),
    });
  }

  // Orders placed while signed in are attached to the account so they show up
  // under "My orders" without needing a lookup.
  const user = await getCurrentUser();

  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const deliveryFee = input.orderType === "DELIVERY" ? await getDeliveryFee() : 0;
  const total = round2(subtotal + deliveryFee);

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        // The `stock: { gte }` guard makes the decrement fail rather than go
        // negative if another checkout took the units first.
        const claimed = await tx.charger.updateMany({
          where: { id: line.chargerId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (claimed.count === 0) {
          throw new Error("OUT_OF_STOCK");
        }
      }

      return tx.order.create({
        data: {
          userId: user?.id ?? null,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim().toLowerCase() || null,
          customerPhone: normalizePhone(input.customerPhone),
          deliveryAddress:
            input.orderType === "DELIVERY" ? input.deliveryAddress.trim() : null,
          orderType: input.orderType,
          deliveryFee,
          subtotal,
          total,
          items: {
            create: lines.map((line) => ({
              chargerId: line.chargerId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
      });
    });

    revalidatePath("/chargers");
    revalidatePath("/admin");
    revalidatePath("/orders");

    return { ok: true, orderId: order.id };
  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_STOCK") {
      return {
        ok: false,
        message: "Someone just bought the last unit. Please review your cart and try again.",
      };
    }
    console.error("placeOrder failed", error);
    return { ok: false, message: "We could not place the order. Please try again." };
  }
}
