import { CartView } from "@/components/cart-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getDeliveryFee,
  getPickupDetails,
  getStorefrontChargers,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/user-auth";

// Live prices, stock and the delivery fee all come from the database.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [chargers, deliveryFee, pickup, user] = await Promise.all([
    getStorefrontChargers(),
    getDeliveryFee(),
    getPickupDetails(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
          Your cart
        </h1>
        <CartView
          catalogue={chargers}
          deliveryFee={deliveryFee}
          pickup={pickup}
          user={user}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
