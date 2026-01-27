const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  const r = await prisma.restaurant.upsert({
    where: { slug: "buen-bocado" },
    update: { isActive: true },
    create: {
      name: "Buen Bocado",
      slug: "buen-bocado",
      address: "Granada (dev)",
      lat: 37.176,
      lng: -3.6,
      zoneTag: "GR-DEV",
      commissionBps: 1200,
      isActive: true,
    },
  });

  console.log("Restaurant OK -> id=" + r.id + " slug=" + r.slug);
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });