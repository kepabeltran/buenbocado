/**
 * admin-routes.ts — Endpoints del panel de administración
 *
 * Todos requieren role=admin.
 *
 * GET  /api/admin/stats                  — KPIs globales
 * GET  /api/admin/orders                 — Todos los pedidos (filtros)
 * PATCH /api/admin/orders/:id/status     — Cambiar estado + auditoría
 * GET  /api/admin/offers                 — Todas las ofertas (filtros)
 * GET  /api/admin/restaurant-users       — Listar usuarios restaurante
 */
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "./auth-middleware.js";

export function registerAdminRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ─── STATS GLOBALES ───────────────────────────────────
  app.get("/api/admin/stats", {
    onRequest: [requireAuth("admin")],
  }, async () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      totalRestaurants,
      activeRestaurants,
      totalCustomers,
      totalOrders,
      ordersToday,
      deliveredToday,
      pendingOrders,
      totalMenus,
      activeMenus,
      salesToday,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { status: "DELIVERED", updatedAt: { gte: todayStart } } }),
      prisma.order.count({ where: { status: { in: ["CREATED", "PREPARING", "READY"] } } }),
      prisma.menu.count(),
      prisma.menu.count({
        where: { quantity: { gt: 0 }, availableFrom: { lte: now }, availableTo: { gte: now }, expiresAt: { gte: now } },
      }),
      prisma.order.aggregate({
        where: { status: "DELIVERED", updatedAt: { gte: todayStart } },
        _sum: { totalCents: true },
      }),
    ]);

    return {
      ok: true,
      data: {
        totalRestaurants,
        activeRestaurants,
        totalCustomers,
        totalOrders,
        ordersToday,
        deliveredToday,
        pendingOrders,
        totalMenus,
        activeMenus,
        salesTodayCents: salesToday._sum.totalCents ?? 0,
      },
    };
  });

  // ─── TODOS LOS PEDIDOS ────────────────────────────────
  app.get("/api/admin/orders", {
    onRequest: [requireAuth("admin")],
  }, async (req: any) => {
    const q = req.query ?? {};
    const take = Math.min(500, Math.max(1, Number(q.take ?? 50)));
    const skip = Math.max(0, Number(q.skip ?? 0));

    // Filtros
    const where: any = {};

    if (q.status) where.status = String(q.status).toUpperCase();
    if (q.code) where.code = { contains: String(q.code) };
    if (q.restaurantId) where.menu = { restaurantId: String(q.restaurantId) };
    if (q.customerId) where.customerId = String(q.customerId);
    if (q.search) {
      const s = String(q.search).trim();
      where.OR = [
        { code: { contains: s } },
        { customerName: { contains: s, mode: "insensitive" } },
        { customerEmail: { contains: s, mode: "insensitive" } },
        { id: { contains: s } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          menu: {
            select: {
              id: true, title: true, type: true, priceCents: true, currency: true,
              restaurant: { select: { id: true, name: true } },
            },
          },
          customer: { select: { id: true, name: true, email: true } },
          deliveredBy: { select: { id: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { ok: true, data: orders, total, take, skip };
  });

  // ─── CAMBIAR ESTADO DE PEDIDO ─────────────────────────
  app.patch("/api/admin/orders/:id/status", {
    onRequest: [requireAuth("admin")],
  }, async (req: any, reply) => {
    const id = String(req.params?.id ?? "").trim();
    const body = (req.body ?? {}) as any;
    const newStatus = String(body.status ?? "").toUpperCase();
    const reason = String(body.reason ?? "").trim();

    const validStatuses = ["CREATED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "NOSHOW"];
    if (!validStatuses.includes(newStatus)) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Estado inválido: " + newStatus });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Pedido no encontrado" });
    }

    const oldStatus = order.status;
    const data: any = { status: newStatus };

    if (newStatus === "DELIVERED" && !order.deliveredAt) {
      data.deliveredAt = new Date();
    }

    const updated = await prisma.order.update({ where: { id }, data });

    // Log de auditoría (por ahora en console, en futuras fases en tabla AuditLog)
    console.log(`[ADMIN_AUDIT] Order ${id}: ${oldStatus} → ${newStatus} | by=${req.authUser?.email} | reason="${reason}" | at=${new Date().toISOString()}`);

    return {
      ok: true,
      data: {
        id: updated.id,
        oldStatus,
        newStatus: updated.status,
        reason,
        changedBy: req.authUser?.email,
        changedAt: new Date().toISOString(),
      },
    };
  });

  // ─── TODAS LAS OFERTAS ────────────────────────────────
  app.get("/api/admin/offers", {
    onRequest: [requireAuth("admin")],
  }, async (req: any) => {
    const q = req.query ?? {};
    const take = Math.min(500, Math.max(1, Number(q.take ?? 50)));
    const skip = Math.max(0, Number(q.skip ?? 0));
    const now = new Date();

    const where: any = {};

    if (q.restaurantId) where.restaurantId = String(q.restaurantId);
    if (q.status === "active") {
      where.quantity = { gt: 0 };
      where.availableFrom = { lte: now };
      where.availableTo = { gte: now };
      where.expiresAt = { gte: now };
    } else if (q.status === "expired") {
      where.OR = [
        { expiresAt: { lt: now } },
        { availableTo: { lt: now } },
      ];
    } else if (q.status === "paused") {
      where.quantity = 0;
      where.availableTo = { gte: now };
    }

    if (q.search) {
      const s = String(q.search).trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { id: { contains: s } },
      ];
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          restaurant: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.menu.count({ where }),
    ]);

    const data = menus.map((m: any) => ({
      ...m,
      isExpired: m.expiresAt < now || m.availableTo < now,
      isActive: m.quantity > 0 && m.availableFrom <= now && m.availableTo >= now && m.expiresAt >= now,
      orderCount: m._count?.orders ?? 0,
    }));

    return { ok: true, data, total, take, skip };
  });

  // ─── LISTAR USUARIOS RESTAURANTE ──────────────────────
  app.get("/api/admin/restaurant-users", {
    onRequest: [requireAuth("admin")],
  }, async (req: any) => {
    const q = req.query ?? {};
    const where: any = {};

    if (q.restaurantId) where.restaurantId = String(q.restaurantId);

    const users = await prisma.restaurantUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        restaurantId: true,
        createdAt: true,
        restaurant: { select: { name: true } },
      },
    });

    return { ok: true, data: users };
  });
}
