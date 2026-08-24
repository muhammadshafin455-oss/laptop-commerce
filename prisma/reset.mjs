/**
 * Clears catalogue and customer data so the store can be filled with real
 * products. Store settings (the delivery fee) are kept.
 *
 *   npm run db:reset          # show what would be removed, change nothing
 *   npm run db:reset -- --yes # actually remove it
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const confirmed = process.argv.includes("--yes");

async function main() {
  const chargers = await prisma.charger.findMany({
    include: { image: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "asc" } });
  const users = await prisma.user.findMany();

  if (chargers.length + orders.length + users.length === 0) {
    console.log("Nothing to remove — the store is already empty.");
    return;
  }

  console.log(confirmed ? "Removing:" : "Would remove (dry run):");
  for (const c of chargers) {
    console.log(`  charger  ${c.name} — stock ${c.stock}, photo: ${c.image ? "yes" : "no"}`);
  }
  for (const o of orders) {
    console.log(`  order    ${o.customerName} (${o.customerPhone}) — ${o.status}, ${o.total}`);
  }
  for (const u of users) {
    console.log(`  account  ${u.name} (${u.phone})`);
  }

  if (!confirmed) {
    console.log("\nRe-run with --yes to delete:  npm run db:reset -- --yes");
    return;
  }

  // OrderItem cascades from Order, ChargerImage cascades from Charger.
  const removedOrders = await prisma.order.deleteMany({});
  const removedChargers = await prisma.charger.deleteMany({});
  const removedUsers = await prisma.user.deleteMany({});

  console.log(
    `\nDeleted ${removedChargers.count} chargers, ${removedOrders.count} orders, ${removedUsers.count} accounts.`,
  );
  const setting = await prisma.storeSetting.findFirst();
  console.log(`Delivery fee kept at ${setting?.deliveryFee ?? "n/a"}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
