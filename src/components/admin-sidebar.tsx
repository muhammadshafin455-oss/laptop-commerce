"use client";

import {
  CheckCheck,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/completed", label: "Completed", icon: CheckCheck },
  { href: "/admin/chargers", label: "Inventory", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-1 bg-night px-3 py-4 text-white lg:h-screen lg:w-60 lg:sticky lg:top-0">
      <Link href="/admin" className="flex items-center gap-2 px-2 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <Zap className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="font-bold tracking-[-0.02em]">VoltSupply</span>
        <span className="ml-auto rounded-md bg-night-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Admin
        </span>
      </Link>

      <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-night-soft hover:text-white"
              }`}
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex gap-1 border-t border-night-line pt-3 lg:mt-auto lg:flex-col">
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-night-soft hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          Storefront
        </Link>
        <form action={logout} className="flex-1 lg:flex-none">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-danger hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
