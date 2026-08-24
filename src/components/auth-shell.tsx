import { Zap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
          <Zap className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="text-lg font-bold tracking-[-0.02em]">VoltSupply</span>
      </Link>

      <Card className="mt-8 w-full max-w-md p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </Card>

      <Link
        href="/chargers"
        className="mt-6 text-sm text-muted transition-colors hover:text-brand"
      >
        Continue browsing without an account
      </Link>
    </main>
  );
}
