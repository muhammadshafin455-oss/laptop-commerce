import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const chargers = [
  {
    name: "VoltSupply 65W USB-C GaN",
    description:
      "Compact gallium-nitride adapter for most modern USB-C laptops. Power delivery up to 65W with a foldable plug and a detachable 2m cable.",
    price: "59.00",
    discount: "10",
    stock: 42,
    isAvailable: true,
  },
  {
    name: "VoltSupply 100W USB-C Pro",
    description:
      "Full-speed charging for 15\" and 16\" workstations. Dual-port design shares 100W across a laptop and a phone without throttling either.",
    price: "89.00",
    discount: "0",
    stock: 18,
    isAvailable: true,
  },
  {
    name: "Dell-Compatible 90W Barrel",
    description:
      "Direct replacement for 7.4mm barrel Dell Latitude and Inspiron models. Includes surge protection and a 1.8m grounded cable.",
    price: "44.50",
    discount: "0",
    stock: 27,
    isAvailable: true,
  },
  {
    name: "HP-Compatible 65W Blue Tip",
    description:
      "Fits HP Pavilion, Envy and ProBook units using the 4.5mm blue connector. Smart chip negotiates voltage to protect the battery.",
    price: "39.00",
    discount: "15",
    stock: 6,
    isAvailable: true,
  },
  {
    name: "Lenovo-Compatible 135W Slim Tip",
    description:
      "High-output adapter for ThinkPad and Legion machines with the rectangular slim tip. Rated for continuous load under gaming workloads.",
    price: "74.00",
    discount: "0",
    stock: 0,
    isAvailable: true,
  },
  {
    name: "VoltSupply 45W Travel Kit",
    description:
      "Ultralight 45W charger bundled with three international plug heads and a braided cable in a zip case. Built for carry-on bags.",
    price: "34.00",
    discount: "5",
    stock: 55,
    isAvailable: true,
  },
];

const withDemoProducts = process.argv.includes("--demo");

async function main() {
  const setting = await prisma.storeSetting.findFirst();
  if (setting) {
    await prisma.storeSetting.update({
      where: { id: setting.id },
      data: { deliveryFee: "7.50" },
    });
  } else {
    await prisma.storeSetting.create({ data: { deliveryFee: "7.50" } });
  }
  console.log("Store settings ready (delivery fee Rs 7.50)");

  if (!withDemoProducts) {
    console.log(
      "Skipped demo products. Pass --demo to insert them:  npm run db:seed -- --demo",
    );
    return;
  }

  for (const charger of chargers) {
    const existing = await prisma.charger.findFirst({
      where: { name: charger.name },
    });
    if (existing) {
      await prisma.charger.update({ where: { id: existing.id }, data: charger });
    } else {
      await prisma.charger.create({ data: charger });
    }
  }
  console.log(`Seeded ${chargers.length} demo chargers`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
