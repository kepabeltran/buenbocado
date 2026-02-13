/**
 * settlement-routes.ts — Endpoints de liquidaciones
 *
 * ADMIN:
 *   POST /api/admin/settlements/generate       — Generar liquidaciones del periodo
 *   GET  /api/admin/settlements                 — Listar todas las liquidaciones
 *   GET  /api/admin/settlements/:id             — Detalle con pedidos
 *   PATCH /api/admin/settlements/:id/status     — Cambiar estado (confirm/pay/dispute)
 *
 * RESTAURANTE:
 *   GET /api/restaurant/me/settlements          — Mis liquidaciones
 *   GET /api/restaurant/me/settlements/:id      — Detalle
 */
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "./auth-middleware.js";

export function registerSettlementRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ─── GENERAR LIQUIDACIONES ────────────────────────────
  // Busca pedidos DELIVERED sin settlementId en el periodo indicado
  // y crea un Settlement por restaurante.
  app.post("/api/admin/settlements/generate", {
    onRequest: [requireAuth("admin")],
  }, async (req: any, reply) => {
    const body = (req.body ?? {}) as any;
    const periodStart = body.periodStart ? new Date(body.periodStart) : null;
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null;

    if (!periodStart || !periodEnd || isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "periodStart y periodEnd son obligatorios (ISO 8601)" });
    }

    if (periodEnd <= periodStart) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "periodEnd debe ser posterior a periodStart" });
    }

    // Buscar pedidos entregados en el periodo que no tengan liquidación asignada
    const orders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        deliveredAt: { gte: periodStart, lt: periodEnd },
        settlementId: null,
      },
      include: {
        menu: {
          select: { restaurantId: true, restaurant: { select: { commissionBps: true } } },
        },
      },
    });

    if (orders.length === 0) {
      return { ok: true, message: "No hay pedidos pendientes de liquidar en este periodo", created: 0 };
    }

    // Agrupar por restaurante
    const byRestaurant: Record<string, typeof orders> = {};
    for (const o of orders) {
      const rid = o.menu.restaurantId;
      if (!byRestaurant[rid]) byRestaurant[rid] = [];
      byRestaurant[rid].push(o);
    }

    const settlements: any[] = [];

    for (const [restaurantId, restaurantOrders] of Object.entries(byRestaurant)) {
      let totalOrdersCents = 0;
      let totalPlatformFee = 0;

      for (const o of restaurantOrders) {
        const total = o.totalCents ?? 0;
        const commBps = o.commissionBpsAtPurchase ?? o.menu.restaurant.commissionBps ?? 0;
        const fee = o.platformFeeCents ?? Math.round(total * (commBps / 10000));
        totalOrdersCents += total;
        totalPlatformFee += fee;
      }

      const commBps = restaurantOrders[0]?.menu.restaurant.commissionBps ?? 0;
      const netToRestaurant = totalOrdersCents - totalPlatformFee;

      // Crear liquidación
      const settlement = await prisma.settlement.create({
        data: {
          restaurantId,
          periodStart,
          periodEnd,
          status: "DRAFT",
          totalOrdersCents,
          totalOrders: restaurantOrders.length,
          platformFeeCents: totalPlatformFee,
          netToRestaurantCents: netToRestaurant,
          commissionBps: commBps,
        },
      });

      // Asignar pedidos a esta liquidación
      await prisma.order.updateMany({
        where: { id: { in: restaurantOrders.map((o) => o.id) } },
        data: { settlementId: settlement.id },
      });

      settlements.push({
        id: settlement.id,
        restaurantId,
        totalOrders: restaurantOrders.length,
        totalOrdersCents,
        platformFeeCents: totalPlatformFee,
        netToRestaurantCents: netToRestaurant,
      });
    }

    return { ok: true, created: settlements.length, settlements };
  });

  // ─── LISTAR LIQUIDACIONES (ADMIN) ─────────────────────
  app.get("/api/admin/settlements", {
    onRequest: [requireAuth("admin")],
  }, async (req: any) => {
    const q = req.query ?? {};
    const take = Math.min(200, Math.max(1, Number(q.take ?? 50)));
    const skip = Math.max(0, Number(q.skip ?? 0));

    const where: any = {};
    if (q.status) where.status = String(q.status).toUpperCase();
    if (q.restaurantId) where.restaurantId = String(q.restaurantId);

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        orderBy: { periodStart: "desc" },
        take,
        skip,
        include: {
          restaurant: { select: { id: true, name: true } },
        },
      }),
      prisma.settlement.count({ where }),
    ]);

    return { ok: true, data: settlements, total, take, skip };
  });

  // ─── DETALLE LIQUIDACIÓN (ADMIN) ──────────────────────
  app.get("/api/admin/settlements/:id", {
    onRequest: [requireAuth("admin")],
  }, async (req: any, reply) => {
    const id = String(req.params?.id ?? "").trim();

    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true, name: true, commissionBps: true } },
        orders: {
          select: {
            id: true, code: true, status: true, totalCents: true,
            platformFeeCents: true, commissionBpsAtPurchase: true,
            customerName: true, deliveredAt: true, createdAt: true,
            menu: { select: { title: true } },
          },
          orderBy: { deliveredAt: "asc" },
        },
      },
    });

    if (!settlement) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Liquidación no encontrada" });
    }

    return { ok: true, data: settlement };
  });

  // ─── CAMBIAR ESTADO LIQUIDACIÓN ───────────────────────
  app.patch("/api/admin/settlements/:id/status", {
    onRequest: [requireAuth("admin")],
  }, async (req: any, reply) => {
    const id = String(req.params?.id ?? "").trim();
    const body = (req.body ?? {}) as any;
    const newStatus = String(body.status ?? "").toUpperCase();
    const notes = String(body.notes ?? "").trim();

    const valid = ["DRAFT", "CONFIRMED", "PAID", "DISPUTED"];
    if (!valid.includes(newStatus)) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Estado inválido" });
    }

    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Liquidación no encontrada" });
    }

    const data: any = { status: newStatus };
    if (notes) data.notes = notes;

    if (newStatus === "CONFIRMED" && !settlement.confirmedAt) {
      data.confirmedAt = new Date();
      data.confirmedBy = req.authUser?.email;
    }
    if (newStatus === "PAID" && !settlement.paidAt) {
      data.paidAt = new Date();
      data.paidBy = req.authUser?.email;
    }

    const updated = await prisma.settlement.update({ where: { id }, data });

    console.log(`[ADMIN_AUDIT] Settlement ${id}: ${settlement.status} → ${newStatus} | by=${req.authUser?.email} | at=${new Date().toISOString()}`);

    return { ok: true, data: updated };
  });

  // ─── MIS LIQUIDACIONES (RESTAURANTE) ──────────────────
  app.get("/api/restaurant/me/settlements", {
    onRequest: [requireAuth("restaurant")],
  }, async (req) => {
    const restaurantId = req.authUser!.restaurantId!;

    const settlements = await prisma.settlement.findMany({
      where: { restaurantId },
      orderBy: { periodStart: "desc" },
      take: 50,
    });

    return { ok: true, data: settlements };
  });

  // ─── DETALLE LIQUIDACIÓN (RESTAURANTE) ────────────────
  app.get("/api/restaurant/me/settlements/:id", {
    onRequest: [requireAuth("restaurant")],
  }, async (req: any, reply) => {
    const restaurantId = req.authUser!.restaurantId!;
    const id = String(req.params?.id ?? "").trim();

    const settlement = await prisma.settlement.findFirst({
      where: { id, restaurantId },
      include: {
        orders: {
          select: {
            id: true, code: true, status: true, totalCents: true,
            platformFeeCents: true, customerName: true, deliveredAt: true,
            menu: { select: { title: true } },
          },
          orderBy: { deliveredAt: "asc" },
        },
      },
    });

    if (!settlement) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Liquidación no encontrada" });
    }

    return { ok: true, data: settlement };
  });
}
