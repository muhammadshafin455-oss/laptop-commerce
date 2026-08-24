"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui";
import { useCart } from "@/lib/cart-store";
import type { SessionUserView } from "@/lib/types";

const NAV = [
  { href: "/chargers", label: "Shop" },
  { href: "/orders", label: "My orders" },
];

function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { lineCount, hydrated } = useCart();
  const pathname = usePathname();
  const active = pathname === "/cart";
  // Counts distinct products, not units: bumping the quantity of a charger
  // already in the cart should not move the badge.
  // Render only after the store has been read, so the server markup and the
  // hydration render agree.
  const count = hydrated ? lineCount : 0;

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      aria-label={`Cart, ${count} ${count === 1 ? "product" : "products"}`}
      className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-canvas hover:text-ink"
      }`}
    >
      <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function AccountMenu({ user }: { user: SessionUserView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-24 truncate md:inline">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.phone}</p>
          </div>
          <Link
            href="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-canvas"
          >
            <Package className="h-4 w-4 text-muted" />
            My orders
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderBar({ user }: { user: SessionUserView | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Zap className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.02em]">VoltSupply</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <CartButton />

          {user ? (
            <AccountMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                Sign in
              </Link>
              <Link href="/signup" className={buttonClass("primary", "sm")}>
                <UserRound className="h-4 w-4" />
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink sm:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-line bg-surface px-4 py-3 sm:hidden">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              {link.label}
            </Link>
          ))}
          {!user ? (
            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className={`${buttonClass("secondary", "sm")} flex-1`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className={`${buttonClass("primary", "sm")} flex-1`}
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
