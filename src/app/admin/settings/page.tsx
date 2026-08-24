import { Truck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { DeliveryFeeForm } from "@/components/settings-form";
import { Card } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { getDeliveryFee } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await guardAdmin();
  const deliveryFee = await getDeliveryFee();

  return (
    <AdminShell title="Settings" description="Store-wide options.">
      <Card className="max-w-md p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Truck className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-bold tracking-[-0.01em]">Delivery</h2>
            <p className="text-sm text-muted">
              Applied at checkout when a customer picks delivery.
            </p>
          </div>
        </div>
        <DeliveryFeeForm deliveryFee={deliveryFee} />
      </Card>
    </AdminShell>
  );
}
