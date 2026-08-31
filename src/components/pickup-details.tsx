import { Clock, MapPin, Phone, Store } from "lucide-react";
import type { PickupDetails } from "@/lib/types";

/**
 * Where to collect a self-pickup order. Falls back to a clear message rather
 * than rendering an empty box when the shop has not set an address yet.
 */
export function PickupLocation({
  pickup,
  className = "",
}: {
  pickup: PickupDetails;
  className?: string;
}) {
  if (!pickup.hasAddress) {
    return (
      <div
        className={`rounded-lg border border-line bg-canvas p-4 text-sm leading-6 text-muted ${className}`}
      >
        Collect in store once the shop marks your order ready. The shop will
        contact you on the number above with the collection address.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-line bg-canvas p-4 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Store className="h-4 w-4 shrink-0 text-brand" />
        Collect from {pickup.shopName ?? "our shop"}
      </p>

      <ul className="mt-3 space-y-2 text-sm text-muted">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
          <span className="whitespace-pre-line">{pickup.shopAddress}</span>
        </li>
        {pickup.pickupHours ? (
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            <span>{pickup.pickupHours}</span>
          </li>
        ) : null}
        {pickup.shopPhone ? (
          <li className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            <a href={`tel:${pickup.shopPhone}`} className="hover:text-brand">
              {pickup.shopPhone}
            </a>
          </li>
        ) : null}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Wait until the shop marks your order ready before coming in.
      </p>
    </div>
  );
}
