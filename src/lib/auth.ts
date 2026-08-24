import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "vs_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function secret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

/** True when the deployment has no ADMIN_PASSWORD, which locks the dashboard. */
export function isAdminConfigured(): boolean {
  return secret() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  const key = secret();
  if (!key) return false;
  return safeEqual(candidate, key);
}

/**
 * The session token is `<issuedAt>.<hmac>`. It is derived from the admin
 * password, so changing the password invalidates every outstanding session.
 */
function createToken(issuedAt: number, key: string): string {
  return `${issuedAt}.${sign(String(issuedAt), key)}`;
}

function verifyToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;

  const [issuedAtRaw, signature] = token.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!issuedAtRaw || !signature || !Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_TTL_MS) return false;

  return safeEqual(signature, sign(issuedAtRaw, key));
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/**
 * Guards every admin Server Action. Server Functions are reachable by direct
 * POST, so authorisation is re-checked inside each one rather than relying on
 * the layout alone.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

export async function startAdminSession(): Promise<void> {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD is not configured");

  const issuedAt = Date.now();
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(issuedAt, key), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Page-level guard. Server Functions re-check with `requireAdmin`, so this is
 * about sending signed-out staff to the login screen rather than about
 * enforcement.
 */
export async function guardAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}
