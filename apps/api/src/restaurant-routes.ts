/**
 * restaurant-routes.ts — Endpoints autenticados del portal restaurante
 *
 * Todos requieren role=restaurant y usan el restaurantId del token.
 *
 * GET  /api/restaurant/me/menus          — Mis ofertas (activas + expiradas)
 * GET  /api/restaurant/me/stats          — Stats del dashboard (hoy)
 * POST /api/restaurant/me/menus/:id/duplicate — Duplicar oferta
 * POST /api/restaurant/me/menus/:id/pause     — Pausar (quantity=0)
 * POST /api/restaurant/me/menus/:id/activate  — Reactivar (restore quantity)
 */
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "./auth-middleware.js";

export function registerRestaurantRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ─── MIS OFERTAS ──────────────────────────────────────
  app.get("/api/restaurant/me/menus", {
    onRequest: [requireAuth("restaurant")],
  }, async (req) => {
    const restaurantId = req.authUser!.restaurantId!;
    const now = new Date();

    const menus = await prisma.menu.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const data = menus.map((m: any) => {
      const isExpired = m.expiresAt < now || m.availableTo < now;
      const isActive = !isExpired && m.quantity > 0;

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        priceCents: m.priceCents,
        currency: m.currency,
        quantity: m.quantity,
        availableFrom: m.availableFrom,
        availableTo: m.availableTo,
        expiresAt: m.expiresAt,
        imageUrl: m.imageUrl,
        allowTimeAdjustment: m.allowTimeAdjustment,
        isActive,
        isExpired,
        createdAt: m.createdAt,
      };
    });

    return { ok: true, data };
  });

  // ─── STATS DASHBOARD ──────────────────────────────────
  app.get("/api/restaurant/me/stats", {
    onRequest: [requireAuth("restaurant")],
  }, async (req) => {
    const restaurantId = req.authUser!.restaurantId!;
    const now = new Date();

    // Inicio del día (UTC)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    // Menús activos ahora
    const activeMenus = await prisma.menu.count({
      where: {
        restaurantId,
        quantity: { gt: 0 },
        availableFrom: { lte: now },
        availableTo: { gte: now },
        expiresAt: { gte: now },
      },
    });

    // Pedidos en curso (no entregados, no cancelados)
    const pendingOrders = await prisma.order.count({
      where: {
        menu: { restaurantId },
        status: { in: ["CREATED", "PREPARING", "READY"] },
      },
    });

    // Entregados hoy
    const deliveredToday = await prisma.order.count({
      where: {
        menu: { restaurantId },
        status: "DELIVERED",
        updatedAt: { gte: todayStart },
      },
    });

    // Ventas del día (suma de totalCents de entregados hoy)
    const salesToday = await prisma.order.aggregate({
      where: {
        menu: { restaurantId },
        status: "DELIVERED",
        updatedAt: { gte: todayStart },
      },
      _sum: { totalCents: true },
    });

    // Total pedidos del restaurante
    const totalOrders = await prisma.order.count({
      where: { menu: { restaurantId } },
    });

    return {
      ok: true,
      data: {
        activeMenus,
        pendingOrders,
        deliveredToday,
        salesTodayCents: salesToday._sum.totalCents ?? 0,
        totalOrders,
      },
    };
  });

  // ─── DUPLICAR OFERTA ──────────────────────────────────
  app.post("/api/restaurant/me/menus/:id/duplicate", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any, reply) => {
    const restaurantId = req.authUser!.restaurantId!;
    const id = String(req.params?.id ?? "").trim();

    const original = await prisma.menu.findFirst({
      where: { id, restaurantId },
    });

    if (!original) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Oferta no encontrada" });
    }

    const now = new Date();
    const durationMs = original.availableTo.getTime() - original.availableFrom.getTime();
    const expiryOffset = original.expiresAt.getTime() - original.availableTo.getTime();

    const newFrom = now;
    const newTo = new Date(now.getTime() + durationMs);
    const newExpiry = new Date(newTo.getTime() + expiryOffset);

    const copy = await prisma.menu.create({
      data: {
        restaurantId,
        type: original.type,
        title: original.title,
        description: original.description,
        priceCents: original.priceCents,
        currency: original.currency,
        quantity: original.quantity,
        availableFrom: newFrom,
        availableTo: newTo,
        expiresAt: newExpiry,
        allowTimeAdjustment: original.allowTimeAdjustment,
        imageUrl: original.imageUrl,
      },
    });

    return { ok: true, id: copy.id };
  });

  // ─── PAUSAR OFERTA (quantity → 0) ─────────────────────
  app.post("/api/restaurant/me/menus/:id/pause", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any, reply) => {
    const restaurantId = req.authUser!.restaurantId!;
    const id = String(req.params?.id ?? "").trim();

    const menu = await prisma.menu.findFirst({ where: { id, restaurantId } });
    if (!menu) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Oferta no encontrada" });
    }

    await prisma.menu.update({
      where: { id },
      data: { quantity: 0 },
    });

    return { ok: true, message: "Oferta pausada" };
  });

  // ─── ACTIVAR OFERTA ───────────────────────────────────
  app.post("/api/restaurant/me/menus/:id/activate", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any, reply) => {
    const restaurantId = req.authUser!.restaurantId!;
    const id = String(req.params?.id ?? "").trim();
    const body = (req.body ?? {}) as any;
    const quantity = Number(body.quantity ?? 10);

    const menu = await prisma.menu.findFirst({ where: { id, restaurantId } });
    if (!menu) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Oferta no encontrada" });
    }

    // También extender ventana temporal si ya expiró
    const now = new Date();
    const data: any = {
      quantity: Math.max(1, Math.floor(quantity)),
    };

    if (menu.availableTo < now) {
      const durationMs = menu.availableTo.getTime() - menu.availableFrom.getTime();
      data.availableFrom = now;
      data.availableTo = new Date(now.getTime() + durationMs);
      data.expiresAt = new Date(data.availableTo.getTime() + 30 * 60 * 1000);
    }

    await prisma.menu.update({ where: { id }, data });

    return { ok: true, message: "Oferta activada" };
  });

  // ─── MIS PEDIDOS (autenticado) ────────────────────────
  app.get("/api/restaurant/me/orders", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any) => {
    const restaurantId = req.authUser!.restaurantId!;
    const q = (req.query ?? {}) as any;
    const takeRaw = Number(q.take ?? 200);
    const take = Math.max(1, Math.min(500, Math.floor(takeRaw)));

    const orders = await prisma.order.findMany({
      where: { menu: { restaurantId } },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        menu: { select: { id: true, title: true, type: true, priceCents: true, currency: true } },
      },
    });

    const data = orders.map((o: any) => {
      const totalCents = o.totalCents ?? o.menu?.priceCents ?? null;
      const commBps = o.commissionBpsAtPurchase ?? 0;
      const feeCents = o.platformFeeCents ?? (totalCents != null ? Math.round(totalCents * (commBps / 10000)) : null);
      const netCents = totalCents != null && feeCents != null ? totalCents - feeCents : null;

      return {
        id: o.id,
        status: o.status,
        code: o.code,
        createdAt: o.createdAt,
        customerName: o.customerName,
        totalCents,
        platformFeeCents: feeCents,
        netToRestaurantCents: netCents,
        commissionBpsAtPurchase: commBps,
        menu: o.menu,
      };
    });

    return { ok: true, data };
  });

  // ─── MARCAR ENTREGADO (autenticado) ───────────────────
  app.post("/api/restaurant/me/orders/mark-delivered", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any, reply) => {
    const restaurantId = req.authUser!.restaurantId!;
    const body = (req.body ?? {}) as any;
    const code = String(body.code ?? "").trim();

    if (!code) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "code es obligatorio" });
    }

    const order = await prisma.order.findFirst({
      where: { code, menu: { restaurantId } },
      include: { menu: { select: { title: true } } },
    });

    if (!order) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Código no encontrado para este restaurante" });
    }

    if (order.status === "DELIVERED") {
      return { ok: true, alreadyDelivered: true, order: { id: order.id, status: order.status, code: order.code } };
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        deliveredByUserId: req.authUser!.sub,
      },
    });

    return {
      ok: true,
      order: { id: updated.id, status: updated.status, code: updated.code, menuTitle: order.menu?.title },
    };
  });
}
