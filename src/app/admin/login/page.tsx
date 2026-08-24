import { ShieldAlert, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Card } from "@/components/ui";
import { isAdmin, isAdminConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-night text-white">
          <Zap className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="text-lg font-bold tracking-[-0.02em]">VoltSupply</span>
      </Link>

      <Card className="mt-8 w-full max-w-sm p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          Operations
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em]">Admin sign in</h1>
        <p className="mt-1.5 text-sm text-muted">
          Staff access to orders, inventory and settings.
        </p>

        <div className="mt-7">
          {isAdminConfigured() ? (
            <AdminLoginForm />
          ) : (
            <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm leading-6 text-danger">
              <ShieldAlert className="mt-0.5 h-[18px] w-[18px] shrink-0" />
              <span>
                <code className="font-mono font-semibold">ADMIN_PASSWORD</code> is
                not set on the server. Add it to your environment and restart to
                unlock the dashboard.
              </span>
            </p>
          )}
        </div>
      </Card>

      <Link
        href="/"
        className="mt-6 text-sm text-muted transition-colors hover:text-brand"
      >
        Back to the storefront
      </Link>
    </main>
  );
}
