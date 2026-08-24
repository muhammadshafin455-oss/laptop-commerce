import { ChargerCard } from "@/components/charger-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/ui";
import { getStorefrontChargers } from "@/lib/queries";

// Stock levels and prices are edited from the admin dashboard, so the
// catalogue is rendered per request rather than prerendered at build time.
export const dynamic = "force-dynamic";

export default async function ChargersPage() {
  const chargers = await getStorefrontChargers();
  const inStock = chargers.filter((charger) => charger.isPurchasable).length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The catalogue"
          title="Available chargers"
          description={
            chargers.length === 0
              ? undefined
              : `${chargers.length} ${chargers.length === 1 ? "model" : "models"} listed · ${inStock} ready to ship.`
          }
        />

        {chargers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-surface p-12 text-center">
            <p className="text-muted">
              No chargers are listed yet. Once the shop adds inventory it will
              show up here.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {chargers.map((charger) => (
              <ChargerCard key={charger.id} charger={charger} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
