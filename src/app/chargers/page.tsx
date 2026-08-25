import { PackageSearch } from "lucide-react";
import { ChargerCard } from "@/components/charger-card";
import { ChargerSearch } from "@/components/charger-search";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, Card, SectionHeading } from "@/components/ui";
import { countStorefrontChargers, getStorefrontChargers } from "@/lib/queries";

// Stock levels and prices are edited from the admin dashboard, so the
// catalogue is rendered per request rather than prerendered at build time.
export const dynamic = "force-dynamic";

export default async function ChargersPage(props: PageProps<"/chargers">) {
  const params = await props.searchParams;
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  const [chargers, totalListed] = await Promise.all([
    getStorefrontChargers(query),
    countStorefrontChargers(),
  ]);
  const inStock = chargers.filter((charger) => charger.isPurchasable).length;

  function description() {
    if (totalListed === 0) return undefined;
    if (query) {
      return `${chargers.length} of ${totalListed} ${totalListed === 1 ? "model" : "models"} match “${query}”.`;
    }
    return `${totalListed} ${totalListed === 1 ? "model" : "models"} listed · ${inStock} ready to ship.`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The catalogue"
          title="Available chargers"
          description={description()}
        />

        {totalListed > 0 ? (
          <div className="mt-8">
            <ChargerSearch action="/chargers" query={query} />
          </div>
        ) : null}

        {chargers.length === 0 ? (
          <Card className="mt-8 flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <PackageSearch className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold">
              {query ? "No matching chargers" : "Nothing listed yet"}
            </h2>
            <p className="mt-2 max-w-sm text-muted">
              {query ? (
                <>
                  Nothing in the catalogue matches{" "}
                  <span className="font-medium text-ink">{query}</span>. Try a
                  wattage like “65W”, or a brand name.
                </>
              ) : (
                "Once the shop adds inventory it will show up here."
              )}
            </p>
            {query ? (
              <ButtonLink href="/chargers" variant="secondary" className="mt-6">
                Show all chargers
              </ButtonLink>
            ) : null}
          </Card>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
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
