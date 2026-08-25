import { AlertTriangle, Boxes, Eye, PackagePlus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { ChargerCreateForm, ChargerEditor } from "@/components/charger-manager";
import { Tabs } from "@/components/tabs";
import { Card, LOW_STOCK_THRESHOLD, StatCard } from "@/components/ui";
import { guardAdmin } from "@/lib/auth";
import { getAllChargers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminChargersPage() {
  await guardAdmin();
  const chargers = await getAllChargers();

  const listed = chargers.filter((c) => c.isAvailable).length;
  const totalPieces = chargers.reduce((sum, c) => sum + c.stock, 0);
  const lowStock = chargers.filter(
    (c) => c.stock > 0 && c.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStock = chargers.filter((c) => c.stock === 0).length;

  return (
    <AdminShell
      title="Inventory"
      description="Everything in the catalogue, and how many pieces are left of each."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pieces in stock" value={String(totalPieces)} icon={Boxes} />
        <StatCard label="Listed on storefront" value={String(listed)} icon={Eye} />
        <StatCard
          label="Running low"
          value={String(lowStock)}
          icon={AlertTriangle}
          tone="warn"
        />
        <StatCard
          label="Out of stock"
          value={String(outOfStock)}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="mt-8">
        <Tabs
          tabs={[
            {
              id: "existing",
              label: "Existing chargers",
              count: chargers.length,
              icon: <Boxes className="h-[18px] w-[18px]" />,
              content:
                chargers.length === 0 ? (
                  <Card className="px-6 py-14 text-center">
                    <p className="text-muted">
                      Nothing in the catalogue yet. Add your first charger from the
                      next tab.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {chargers.map((charger) => (
                      <ChargerEditor key={charger.id} charger={charger} />
                    ))}
                  </div>
                ),
            },
            {
              id: "add",
              label: "Add charger",
              icon: <PackagePlus className="h-[18px] w-[18px]" />,
              content: <ChargerCreateForm />,
            },
          ]}
        />
      </div>
    </AdminShell>
  );
}
