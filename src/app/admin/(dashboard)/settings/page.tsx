import { AlertTriangle } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StoreSettingsForm } from "@/components/settings-form";
import { Card } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { getDeliveryFee, getPickupDetails } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await guardAdmin();
  const [deliveryFee, pickup] = await Promise.all([
    getDeliveryFee(),
    getPickupDetails(),
  ]);

  return (
    <AdminShell title="Settings" description="Store-wide options.">
      {!pickup.hasAddress ? (
        <p className="mb-6 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          No pickup address is set. Customers choosing self pickup are not being
          told where to collect their order.
        </p>
      ) : null}

      <Card className="max-w-2xl p-6">
        <StoreSettingsForm deliveryFee={deliveryFee} pickup={pickup} />
      </Card>
    </AdminShell>
  );
}
