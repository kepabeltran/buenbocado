const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const menuId = process.env.MENU_ID;

  const total = await prisma.order.count({ where: { menuId } });
  const last = await prisma.order.findMany({
    where: { menuId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, code: true, createdAt: true },
  });

  console.log("orders_total_for_menu:", total);
  console.table(last.map(o => ({
    id: o.id,
    status: o.status,
    code: o.code,
    createdAt: o.createdAt.toISOString()
  })));

  const dups = await prisma.order.groupBy({
    by: ["menuId", "code"],
    _count: { code: true },
    having: { code: { _count: { gt: 1 } } },
  });

  console.log("dup_groups_menu_code:", dups.length);
  if (dups.length) console.log(dups.slice(0, 10));
})()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
