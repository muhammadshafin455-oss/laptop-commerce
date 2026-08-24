import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const COOKIE_NAME = "vs_user";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const KEY_LENGTH = 64;

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set; customer sessions cannot be signed.");
  }
  return value;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

/** Stored as `salt:derivedKey`, both hex. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return safeEqual(derived.toString("hex"), hash);
}

/* -------------------------------------------------------------------------- */
/* Phone numbers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Phone numbers are the login identifier, so they are reduced to one canonical
 * form: digits only. A leading `+` is dropped rather than kept, because
 * treating it as significant would let "+1 555 010 9999" and "15550109999"
 * register as two separate accounts and would stop a customer signing in with
 * the same number typed a different way.
 *
 * Numbers still have to be entered in a consistent national/international
 * shape — "03001234567" and "+923001234567" remain distinct, which would need
 * a country code to resolve.
 */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function parseToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!userId || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_TTL_MS) return null;
  if (!safeEqual(signature, sign(`${userId}.${issuedAtRaw}`))) return null;

  return userId;
}

/**
 * Wrapped in `cache` so a page that checks the session in several places still
 * makes a single query per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const userId = parseToken(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, email: true },
  });
  return user;
});

export async function startUserSession(userId: string): Promise<void> {
  const issuedAt = Date.now();
  const payload = `${userId}.${issuedAt}`;
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endUserSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
