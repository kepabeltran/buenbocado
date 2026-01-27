const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const arg = process.argv[2];

  if (!arg) {
    console.log("Uso:");
    console.log("  node scripts/inspect_order.js <orderId>");
    console.log('  node scripts/inspect_order.js code=<6digitos>');
    process.exit(1);
  }

  const where = arg.startsWith("code=")
    ? { code: arg.slice(5) }
    : { id: arg };

  const o = arg.startsWith("code=")
    ? await prisma.order.findFirst({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          totalCents: true,
          commissionBpsAtPurchase: true,
          platformFeeCents: true,
          createdAt: true,
        },
      })
    : await prisma.order.findUnique({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          totalCents: true,
          commissionBpsAtPurchase: true,
          platformFeeCents: true,
          createdAt: true,
        },
      });

  console.log(o);
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });