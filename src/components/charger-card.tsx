import { Plug } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Card, StockBadge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import type { ChargerView } from "@/lib/types";

function Artwork({ charger }: { charger: ChargerView }) {
  if (charger.imageSrc) {
    return (
      // Uploaded photos are served from our own /api/charger-image route, and
      // legacy rows may still hold an external URL — neither needs the Image
      // optimiser or a remotePatterns entry.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={charger.imageSrc}
        alt={charger.name}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft via-white to-canvas">
      <Plug className="h-14 w-14 text-brand-ring" strokeWidth={1.5} />
    </div>
  );
}

export function ChargerCard({ charger }: { charger: ChargerView }) {
  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_40px_-16px_rgba(37,99,235,0.28)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line">
        <Artwork charger={charger} />
        {charger.discount > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {charger.discount}% off
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em]">
          {charger.name}
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">
          {charger.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-[-0.02em]">
              {formatMoney(charger.finalPrice)}
            </span>
            {charger.discount > 0 ? (
              <span className="text-sm text-subtle line-through">
                {formatMoney(charger.price)}
              </span>
            ) : null}
          </div>
          <StockBadge stock={charger.stock} />
        </div>

        <div className="mt-4">
          <AddToCart charger={charger} />
        </div>
      </div>
    </Card>
  );
}
