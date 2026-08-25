import { ArrowRight } from "lucide-react";
import { ChargerCard } from "@/components/charger-card";
import { ChargerSearch } from "@/components/charger-search";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TypingHeadline } from "@/components/typing-headline";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getStorefrontChargers } from "@/lib/queries";

// Stock and prices are edited from the admin dashboard, so the landing page
// reads them per request rather than being prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const params = await props.searchParams;
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  const chargers = await getStorefrontChargers(query);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — type only: no imagery, no calls to action. */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Power, without the guesswork
            </p>

            <TypingHeadline
              className="mt-6 text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
              segments={[
                { text: "The right charge for your " },
                { text: "everyday machine.", accent: true },
              ]}
            />

            <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-muted text-balance">
              Compatible laptop chargers with clear specs, honest pricing, and
              pickup or delivery on your terms.
            </p>
          </div>
        </section>

        {/* Listings — two per row */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The catalogue"
            title="Available chargers"
            description="Live stock straight from the shop. Prices already include any active discount."
            action={
              <ButtonLink href="/chargers" variant="secondary">
                View all
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />

          <div className="mt-8">
            <ChargerSearch action="/" query={query} />
          </div>

          {chargers.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface p-12 text-center">
              <p className="text-muted">
                {query
                  ? `No chargers match “${query}”.`
                  : "No chargers are listed yet. Once the shop adds inventory it will show up here."}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
              {chargers.map((charger) => (
                <ChargerCard key={charger.id} charger={charger} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
