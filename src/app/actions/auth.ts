"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  endUserSession,
  hashPassword,
  isValidPhone,
  normalizePhone,
  startUserSession,
  verifyPassword,
} from "@/lib/user-auth";
import type { ActionResult } from "@/lib/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Only allow same-origin paths, so `?next=` cannot bounce users off-site. */
function safeRedirect(target: string): string {
  return target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export async function signUp(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = text(formData, "name");
  const rawPhone = text(formData, "phone");
  const email = text(formData, "email");
  const password = text(formData, "password");
  const confirm = text(formData, "confirmPassword");
  const next = safeRedirect(text(formData, "next") || "/");

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) fieldErrors.name = "Enter your full name.";
  if (!isValidPhone(rawPhone)) fieldErrors.phone = "Enter a valid phone number.";
  if (email && !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address, or leave it blank.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const phone = normalizePhone(rawPhone);

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return {
      ok: false,
      message: "An account with this phone number already exists.",
      fieldErrors: { phone: "Already registered — sign in instead." },
    };
  }

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email: email || null,
      passwordHash: await hashPassword(password),
    },
  });

  await startUserSession(user.id);
  redirect(next);
}

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rawPhone = text(formData, "phone");
  const password = text(formData, "password");
  const next = safeRedirect(text(formData, "next") || "/");

  if (!rawPhone || !password) {
    return { ok: false, message: "Enter your phone number and password." };
  }

  const user = await prisma.user.findUnique({
    where: { phone: normalizePhone(rawPhone) },
  });

  // One message for both "no such account" and "wrong password", so the form
  // does not reveal which phone numbers are registered.
  const invalid: ActionResult = {
    ok: false,
    message: "Incorrect phone number or password.",
  };

  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await startUserSession(user.id);
  redirect(next);
}

export async function signOut(): Promise<void> {
  await endUserSession();
  redirect("/");
}
