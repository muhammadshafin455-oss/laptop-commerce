import { Zap } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          </span>
          <span className="font-bold tracking-[-0.02em]">VoltSupply</span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/chargers" className="transition-colors hover:text-brand">
            Shop chargers
          </Link>
          <Link href="/orders" className="transition-colors hover:text-brand">
            Track an order
          </Link>
          <Link href="/admin" className="transition-colors hover:text-brand">
            Staff sign in
          </Link>
        </nav>

        <p className="text-sm text-subtle">
          &copy; {new Date().getFullYear()} VoltSupply
        </p>
      </div>
    </footer>
  );
}
