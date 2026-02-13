/**
 * customer-routes.ts — Endpoints del cliente autenticado
 *
 * PATCH /api/customer/me/profile   — Actualizar perfil
 * GET   /api/customer/me/orders    — Mis pedidos
 */
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "./auth-middleware.js";

export function registerCustomerRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ─── ACTUALIZAR PERFIL ────────────────────────────────
  app.patch("/api/customer/me/profile", {
    onRequest: [requireAuth("customer")],
  }, async (req, reply) => {
    const userId = req.authUser!.sub;
    const body = (req.body ?? {}) as any;

    const data: any = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return reply.code(400).send({ ok: false, message: "Nombre mín. 2 caracteres" });
      data.name = name;
    }
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
    if (body.address !== undefined) data.address = String(body.address).trim() || null;
    if (body.city !== undefined) data.city = String(body.city).trim() || null;
    if (body.postalCode !== undefined) data.postalCode = String(body.postalCode).trim() || null;
    if (body.lat !== undefined) data.lat = body.lat !== null ? Number(body.lat) : null;
    if (body.lng !== undefined) data.lng = body.lng !== null ? Number(body.lng) : null;

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ ok: false, message: "No hay campos para actualizar" });
    }

    const updated = await prisma.customer.update({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, address: true, city: true, postalCode: true, lat: true, lng: true },
      data,
    });

    return { ok: true, data: updated };
  });

  // ─── MIS PEDIDOS ──────────────────────────────────────
  app.get("/api/customer/me/orders", {
    onRequest: [requireAuth("customer")],
  }, async (req) => {
    const userId = req.authUser!.sub;
    const email = req.authUser!.email;

    const orders = await prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        menu: {
          select: {
            id: true, title: true, type: true, priceCents: true, currency: true,
            imageUrl: true, availableTo: true,
            restaurant: { select: { id: true, name: true, address: true, phone: true, lat: true, lng: true } },
          },
        },
      },
    });

    return { ok: true, data: orders };
  });
}
