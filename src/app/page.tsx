import {
  ArrowRight,
  BadgeCheck,
  PackageCheck,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { ChargerCard } from "@/components/charger-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getStorefrontChargers } from "@/lib/queries";

// Stock and prices are edited from the admin dashboard, so the landing page
// reads them per request rather than being prerendered at build time.
export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Compatibility first",
    body: "Clear wattage and connector specs on every listing, so you can actually compare.",
  },
  {
    icon: Truck,
    title: "Delivery or pickup",
    body: "Choose doorstep delivery or collect in store — you pick at checkout.",
  },
  {
    icon: ShieldCheck,
    title: "Human confirmed",
    body: "Every order is reviewed by the shop and tracked through to completion.",
  },
];

export default async function Home() {
  const chargers = await getStorefrontChargers();
  const inStock = chargers.filter((charger) => charger.isPurchasable).length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-ring bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                Power, without the guesswork
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                The right charge for your{" "}
                <span className="text-brand">everyday machine.</span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-muted">
                Compatible laptop chargers with clear specs, honest pricing, and
                pickup or delivery on your terms.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/chargers" size="lg">
                  Browse chargers
                  <ArrowRight className="h-[18px] w-[18px]" />
                </ButtonLink>
                <ButtonLink href="/orders" variant="secondary" size="lg">
                  Track an order
                </ButtonLink>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <PackageCheck className="h-[18px] w-[18px] text-success" />
                  {inStock} {inStock === 1 ? "model" : "models"} ready to ship
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-[18px] w-[18px] text-success" />
                  Surge-protected &amp; tested
                </span>
              </div>
            </div>

            {/* Decorative product panel */}
            <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft via-white to-canvas p-8 shadow-[0_24px_60px_-30px_rgba(37,99,235,0.45)] sm:p-10">
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/10 blur-2xl"
              />
              <div className="relative flex h-full min-h-72 flex-col justify-between gap-8">
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
                    <Zap className="h-8 w-8" fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                    USB-C · GaN · Barrel
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "45W", label: "Travel" },
                    { value: "65W", label: "Everyday" },
                    { value: "100W", label: "Workstation" },
                  ].map((tier) => (
                    <div
                      key={tier.value}
                      className="rounded-xl border border-line bg-surface/80 p-3 text-center backdrop-blur"
                    >
                      <p className="text-lg font-bold tracking-[-0.02em] text-brand">
                        {tier.value}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{tier.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-b border-line bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{feature.body}</p>
                </div>
              </div>
            ))}
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
