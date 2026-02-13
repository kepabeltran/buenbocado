import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";

type MenuType = string;
type OrderStatus = string;

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

function loadEnvIfMissing() {
  if (process.env.DATABASE_URL) return;

  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "..", "..", ".env"),
  ];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;

    const text = fs.readFileSync(p, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;

      const key = m[1];
      let val = m[2]?.trim() ?? "";
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

loadEnvIfMissing();

const app = Fastify({ logger: true });

const isProd = process.env.NODE_ENV === "production";
const rawCors = process.env.CORS_ORIGINS ?? "";
const extraAllowed = rawCors
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const devDefaults = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

const allowList = new Set(isProd ? extraAllowed : [...devDefaults, ...extraAllowed]);

if (isProd && allowList.size === 0) {
  app.log.error("CORS_ORIGINS is empty in production. Refusing to start for safety.");
  process.exit(1);
}

await app.register(cors, {
  origin: (origin, cb) => {
    // Permite llamadas server-to-server / curl (sin Origin)
    if (!origin) return cb(null, true);

    if (allowList.has(origin)) return cb(null, true);

    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});

// --- Uploads (MVP local) ---
await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Servir /uploads/...
const fastifyStaticMod: any = await import("@fastify/static");
const fastifyStaticPlugin: any = fastifyStaticMod?.default ?? fastifyStaticMod;
await app.register(fastifyStaticPlugin, {
  root: uploadsDir,
  prefix: "/uploads/",
});if (!process.env.DATABASE_URL) {
  app.log.error("DATABASE_URL no est?f?'?,? definida. Revisa tu .env en el root del repo.");
}

const prisma = new PrismaClient();
import { registerAuthRoutes } from './auth-routes.js';
registerAuthRoutes(app, prisma);
import { registerRestaurantRoutes } from './restaurant-routes.js';
registerRestaurantRoutes(app, prisma);
import { onOrderCreated, onOrderDelivered } from './order-hooks.js';
import { registerAdminRoutes } from './admin-routes.js';
registerAdminRoutes(app, prisma);
import { registerSettlementRoutes } from './settlement-routes.js';
registerSettlementRoutes(app, prisma);


function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseOptionalFloat(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
function formatTimeRemaining(to: Date, now: Date) {
  const mins = Math.max(0, Math.round((to.getTime() - now.getTime()) / 60000));
  if (mins >= 120) return `${Math.round(mins / 60)} h`;
  return `${mins} min`;
}

function menuToDto(menu: any, now: Date, userLat: number | null, userLng: number | null) {
  return {
    id: menu.id,
    restaurant: menu.restaurant?.name ?? "Restaurante",
    type: menu.type,
    title: menu.title,
    description: menu.description ?? "",
    priceCents: menu.priceCents,
    currency: menu.currency ?? "EUR",
    timeRemaining: formatTimeRemaining(menu.availableTo, now),
    distanceKm: (userLat !== null && userLng !== null && menu.restaurant?.lat != null && menu.restaurant?.lng != null) ? haversineKm(userLat, userLng, menu.restaurant.lat, menu.restaurant.lng) : null,
    badge: null,
    imageUrl: menu.imageUrl ?? null,
  };
}

app.get("/health", async () => ({ status: "ok" }));
app.get("/api/health", async () => ({ status: "ok" }));

// Men?f?'?,?s activos reales desde BD
app.get("/api/menus/active", async (req: any) => {
  const userLat = parseOptionalFloat((req.query as any)?.lat);
  const userLng = parseOptionalFloat((req.query as any)?.lng);

  const now = new Date();
  const items = await prisma.menu.findMany({
    where: {
      quantity: { gt: 0 },
      availableFrom: { lte: now },
      availableTo: { gte: now },
      expiresAt: { gte: now },
    },
    include: { restaurant: true },
    orderBy: { availableTo: "asc" },
    take: 50,
  });

    const data = items.map((m: any) => menuToDto(m, now, userLat, userLng));

  if (userLat !== null && userLng !== null) {
    data.sort((a: any, b: any) => {
      const ad = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const bd = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }

  return { data };
});

// Detalle por id
app.get<{ Params: { id: string } }>("/api/menus/:id", async (request, reply) => {
  const now = new Date();
  const item = await prisma.menu.findUnique({
    where: { id: request.params.id },
    include: { restaurant: true },
  });

  if (!item) return reply.code(404).send({ error: "Menu not found" });
    const q = (request.query ?? {}) as any;
  const latRaw = Number(q.lat);
  const lngRaw = Number(q.lng);
  const lat = Number.isFinite(latRaw) ? latRaw : (item as any).restaurant?.lat;
  const lng = Number.isFinite(lngRaw) ? lngRaw : (item as any).restaurant?.lng;
  return { data: menuToDto(item, now, lat, lng) };
});

// Upload endpoint (MVP)
app.post("/api/uploads/menu-image", async (request, reply) => {
  const mp = await (request as any).file();
  if (!mp) return reply.code(400).send({ ok: false, error: "file_required" });

  if (typeof mp.mimetype === "string" && !mp.mimetype.startsWith("image/")) {
    return reply.code(400).send({ ok: false, error: "only_images" });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of mp.file) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks);

  // Normaliza para la app: rota EXIF + recorta a 16:10 + comprime
  const out = await sharp(input)
    .rotate()
    .resize(1600, 1000, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const { randomBytes } = await import("node:crypto");
  const { writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");

  const filename = `menu-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`;
  await writeFile(join(uploadsDir, filename), out);

  const host = request.headers.host || "127.0.0.1:4000";
  const baseUrl = (process.env.PUBLIC_BASE_URL || `http://${host}`).replace(/\/$/, "");
  return reply.code(201).send({ ok: true, url: `${baseUrl}/uploads/${filename}`, filename });
});

// Crear oferta real en BD (acepta imageUrl)
type CreateMenuBody = {
  restaurantId?: string;
  type: "TAKEAWAY" | "DINEIN";
  title: string;
  description?: string;
  priceCents: number;
  currency?: string;
  quantity: number;
  availableFrom?: string;
  availableTo?: string;
  expiresAt?: string;
  allowTimeAdjustment?: boolean;
  imageUrl?: string;
};

async function createMenuHandler(body: CreateMenuBody, reply: any) {
  const now = new Date();

  if (!body?.type || !["TAKEAWAY", "DINEIN"].includes(body.type)) {
    return reply.code(400).send({ error: "type debe ser TAKEAWAY o DINEIN" });
  }
  if (!body?.title || body.title.trim().length < 3) {
    return reply.code(400).send({ error: "title es obligatorio (m?f?'?,n 3 caracteres)" });
  }
  if (!Number.isFinite(body.priceCents) || body.priceCents <= 0) {
    return reply.code(400).send({ error: "priceCents debe ser n?f?'?,?mero > 0" });
  }
  if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
    return reply.code(400).send({ error: "quantity debe ser n?f?'?,?mero > 0" });
  }

  let restaurantId = body.restaurantId;
  if (!restaurantId) {
    const firstRestaurant = await prisma.restaurant.findFirst({ orderBy: { name: "asc" } });
    if (!firstRestaurant) {
      return reply.code(400).send({ error: "No hay restaurantes en BD (ejecuta seed)" });
    }
    restaurantId = firstRestaurant.id;
  }

  const availableFrom = body.availableFrom ? new Date(body.availableFrom) : now;
  const availableTo = body.availableTo
    ? new Date(body.availableTo)
    : new Date(now.getTime() + 90 * 60 * 1000);
  const expiresAt = body.expiresAt
    ? new Date(body.expiresAt)
    : new Date(availableTo.getTime() + 30 * 60 * 1000);

  if (availableTo <= availableFrom) {
    return reply.code(400).send({ error: "availableTo debe ser posterior a availableFrom" });
  }

  const created = await prisma.menu.create({
    data: {
      restaurantId,
      type: (body.type === "TAKEAWAY" || body.type === "DINEIN") ? body.type : "TAKEAWAY",
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      priceCents: Math.round(body.priceCents),
      currency: (body.currency ?? "EUR").toUpperCase(),
      quantity: Math.round(body.quantity),
      availableFrom,
      availableTo,
      expiresAt,
      allowTimeAdjustment: Boolean(body.allowTimeAdjustment),
      imageUrl: body.imageUrl ?? null,
    },
  });

  return reply.code(201).send({ ok: true, id: created.id });
}

app.post<{ Body: CreateMenuBody }>("/api/restaurant/menus", async (request, reply) => {
  return createMenuHandler(request.body, reply);
});

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});


app.patch<{
  Params: { id: string };
  Body: {
    type?: "TAKEAWAY" | "DINEIN";
    title?: string;
    description?: string;
    priceCents?: number;
    quantity?: number;
    allowTimeAdjustment?: boolean;
    imageUrl?: string | null;
  };
}>("/api/restaurant/menus/:id", async (request, reply) => {
  const id = request.params.id;
  const body = request.body ?? {};

  const data: any = {};

  if (body.type === "TAKEAWAY" || body.type === "DINEIN") data.type = body.type;
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.priceCents === "number" && Number.isFinite(body.priceCents)) data.priceCents = Math.round(body.priceCents);
  if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) data.quantity = Math.max(0, Math.floor(body.quantity));
  if (typeof body.allowTimeAdjustment === "boolean") data.allowTimeAdjustment = body.allowTimeAdjustment;
  if (typeof body.imageUrl === "string" || body.imageUrl === null) data.imageUrl = body.imageUrl;

  if (Object.keys(data).length === 0) {
    return reply.code(400).send({ error: "No fields to update" });
  }

  try {
    const updated = await prisma.menu.update({
      where: { id },
      data
    });

    return { ok: true, id: updated.id };
  } catch (e: any) {
    request.log.error(e);
    // Prisma "record not found" suele ser P2025
    if (e?.code === "P2025") return reply.code(404).send({ error: "Menu not found" });
    return reply.code(500).send({ error: "Internal error" });
  }
});


const port = Number(process.env.PORT ?? 4000);
app.post("/api/orders", async (req: any, reply: any) => {
  const body = (req.body ?? {}) as any;

  const menuId = String(body.menuId ?? "").trim();
  const customerName = String(body.customerName ?? "").trim();
  const customerEmail = String(body.customerEmail ?? "").trim().toLowerCase();

  if (!menuId || !customerName || !customerEmail) {
    return reply.code(400).send({
      error: "BAD_REQUEST",
      message: "menuId, customerName y customerEmail son obligatorios",
    });
}
  const now = new Date();

  // Validar que el menu sigue activo y con stock > 0
  const menu = await prisma.menu.findFirst({
    where: {
      id: menuId,
      quantity: { gt: 0 },
      availableFrom: { lte: now },
      availableTo: { gte: now },
      expiresAt: { gte: now },
    },
    include: { restaurant: true },
  });

  if (!menu) {
    return reply.code(404).send({
      error: "MENU_NOT_FOUND_OR_INACTIVE",
      message: "La oferta no existe, no est? activa o no tiene stock",
    });
  }

  // Codigo simple (6 digitos)
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      // Decremento seguro: solo si hay stock
      const dec = await tx.menu.updateMany({
        where: { id: menuId, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      });

      if (dec.count !== 1) {
        throw new Error("OUT_OF_STOCK");
      }

            return tx.order.create({
        data: {
          menuId,
          customerName,
          customerEmail,
          code,
          totalCents: menu.priceCents,
          commissionBpsAtPurchase: menu.restaurant?.commissionBps ?? 0,
          platformFeeCents: Math.round(menu.priceCents * ((menu.restaurant?.commissionBps ?? 0) / 10000)),
          // status: CREATED por defecto
        },
      });
    });
    onOrderCreated(prisma, order.id);


    return {
      ok: true,
      order: {
        id: order.id,
        status: order.status,
        code: order.code,
        menuId: order.menuId,
        createdAt: order.createdAt,
      },
      menu: {
        id: menu.id,
        title: menu.title,
        restaurant: menu.restaurant?.name ?? "Restaurante",
        priceCents: menu.priceCents,
        currency: menu.currency ?? "EUR",
      },
    };
  } catch (e: any) {
    if (String(e?.message ?? "").includes("OUT_OF_STOCK")) {
      return reply.code(409).send({
        error: "OUT_OF_STOCK",
        message: "Sin stock (alguien reserv? justo antes)",
      });
    }

    req.log?.error?.(e);
    return reply.code(500).send({
      error: "INTERNAL",
      message: "No se pudo crear la reserva",
    });
  }
});

//
// --- Restaurant Orders (MVP) ---
// No auth yet: used for restaurant portal while we build roles.
// Opcional: filtrar por ?restaurantId=... y limitar con ?take=...
//
/**
 * ADMIN (MVP): listar restaurantes con configuración.
 * (Más adelante: auth/roles)
 */
/**
 * ADMIN: Crear restaurante (MVP)
 * Body ejemplo:
 * {
 *   "name":"Mi Restaurante",
 *   "slug":"mi-restaurante",            // opcional (si no, se genera)
 *   "address":"Calle X, Granada",
 *   "lat":37.176,
 *   "lng":-3.600,
 *   "zoneTag":"GR-CENTRO",
 *   "isActive":true,
 *   "commissionBps":1500,              // 1500 = 15%
 *   "contactPeople":"Ana · gerente · +34..., Luis · sala · +34...",
 *   "settlementMode":"WEEKLY_CALENDAR",
 *   "settlementWeekday":5,
 *   "settlementTimezone":"Europe/Madrid"
 * }
 */
app.post("/api/admin/restaurants", async (req: any, reply: any) => {
  const body = (req.body ?? {}) as any;

  const name = String(body.name ?? "").trim();
  const address = String(body.address ?? "").trim();
  const zoneTag = String(body.zoneTag ?? "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!name) return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "name es obligatorio" });
  if (!address) return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "address es obligatorio" });
  if (!zoneTag) return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "zoneTag es obligatorio" });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "lat/lng deben ser numéricos" });
  }

  let slug = String(body.slug ?? "").trim();
  if (!slug) {
    slug = name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }
  if (!slug) slug = `rest-${Math.random().toString(36).slice(2, 8)}`;

  const data: any = {
    name,
    slug,
    address,
    lat,
    lng,
    zoneTag,
    isActive: ("isActive" in body) ? !!body.isActive : true,
  };

  if ("commissionBps" in body) data.commissionBps = Number(body.commissionBps) || 0;
  if ("contactPeople" in body) data.contactPeople = String(body.contactPeople ?? "").trim() || null;
  if ("phone" in body) data.phone = String(body.phone ?? "").trim() || null;

  // Estos 3 pueden existir con defaults en BD: si vienen, los guardamos; si no, los defaults mandan.
  if ("settlementMode" in body) data.settlementMode = String(body.settlementMode ?? "").trim();
  if ("settlementWeekday" in body) data.settlementWeekday = Number(body.settlementWeekday);
  if ("settlementTimezone" in body) data.settlementTimezone = String(body.settlementTimezone ?? "").trim();

  const select: any = {
    id: true, name: true, slug: true, address: true, phone: true, lat: true, lng: true, zoneTag: true,
    isActive: true, commissionBps: true,
    settlementMode: true, settlementWeekday: true, settlementTimezone: true,
    contactPeople: true,
    logoUrl: true,
    coverUrl: true,
    createdAt: true, updatedAt: true,
  };

  try {
    const created = await prisma.restaurant.create({ data, select });
    return reply.send({ ok: true, data: created });
  } catch (e: any) {
    // Si el slug choca por unique, reintenta 1 vez con sufijo
    if (String(e?.code ?? "") === "P2002") {
      try {
        const created2 = await prisma.restaurant.create({
          data: { ...data, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` },
          select,
        });
        return reply.send({ ok: true, data: created2 });
      } catch (e2: any) {
        return reply.code(500).send({ ok: false, error: "INTERNAL_ERROR", message: e2?.message ?? String(e2) });
      }
    }
    return reply.code(500).send({ ok: false, error: "INTERNAL_ERROR", message: e?.message ?? String(e) });
  }
});
app.get("/api/admin/restaurants", async (_req: any) => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      lat: true,
      lng: true,
      zoneTag: true,
      isActive: true,
      commissionBps: true,
      contactPeople: true,
      logoUrl: true,
      coverUrl: true,
      settlementMode: true,
      settlementWeekday: true,
      settlementTimezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ok: true, data: restaurants };
});
/**
 * ADMIN (MVP): actualizar un restaurante (config + datos básicos).
 * (Más adelante: auth/roles)
 */
app.patch("/api/admin/restaurants/:id", async (req: any, reply: any) => {
  const id = String((req.params as any)?.id ?? "").trim();
  if (!id) {
    return reply
      .code(400)
      .send({ ok: false, error: "BAD_REQUEST", message: "id es obligatorio" });
  }

  const body = (req.body ?? {}) as any;

  const modeRaw = String(body.settlementMode ?? "").trim();
  const allowedModes = ["WEEKLY_CALENDAR", "ROLLING_7D", "CUSTOM_RANGE"];
  const settlementMode = allowedModes.includes(modeRaw) ? modeRaw : undefined;

  const weekdayNum = Number(body.settlementWeekday);
  const settlementWeekday =
    Number.isFinite(weekdayNum) && weekdayNum >= 1 && weekdayNum <= 7
      ? Math.trunc(weekdayNum)
      : undefined;

  const latNum = Number(body.lat);
  const lngNum = Number(body.lng);

  const data: any = {
    slug: "slug" in body ? (String(body.slug ?? "").trim() || null) : undefined,
    address: "address" in body ? String(body.address ?? "").trim() : undefined,
    phone: "phone" in body ? (String(body.phone ?? "").trim() || null) : undefined,
    zoneTag: "zoneTag" in body ? String(body.zoneTag ?? "").trim() : undefined,
    isActive: "isActive" in body ? !!body.isActive : undefined,
    lat: "lat" in body && Number.isFinite(latNum) ? latNum : undefined,
    lng: "lng" in body && Number.isFinite(lngNum) ? lngNum : undefined,
    commissionBps:
      "commissionBps" in body && Number.isFinite(Number(body.commissionBps))
        ? Math.trunc(Number(body.commissionBps))
        : undefined,
    contactPeople:
      "contactPeople" in body ? (String(body.contactPeople ?? "").trim() || null) : undefined,
    settlementMode: "settlementMode" in body ? settlementMode : undefined,
    settlementWeekday: "settlementWeekday" in body ? settlementWeekday : undefined,
    settlementTimezone:
      "settlementTimezone" in body
        ? (String(body.settlementTimezone ?? "").trim() || "Europe/Madrid")
        : undefined,
  };

  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  try {
    const updated = await prisma.restaurant.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        lat: true,
        lng: true,
        zoneTag: true,
        isActive: true,
        commissionBps: true,
        contactPeople: true,
        logoUrl: true,
        coverUrl: true,
        settlementMode: true,
        settlementWeekday: true,
        settlementTimezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send({ ok: true, data: updated });
  } catch (e: any) {
    return reply
      .code(500)
      .send({ ok: false, error: "SERVER_ERROR", message: String(e?.message ?? e) });
  }
});
app.get("/api/restaurant/orders", async (req: any) => {
  const q = (req.query ?? {}) as any;
  const restaurantId = String(q.restaurantId ?? "").trim() || null;

  const takeRaw = Number(q.take ?? 50);
  const take = Number.isFinite(takeRaw) ? Math.max(1, Math.min(100, Math.floor(takeRaw))) : 50;

  const where: any = {};
  if (restaurantId) {
    // filtra por restaurante via relaci?f?'?,?n menu -> restaurantId
    where.menu = { restaurantId };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      menu: { include: { restaurant: true } },
    },
  });

const data = orders.map((o: any) => {
  const totalCents = o.totalCents ?? o.menu?.priceCents ?? null;
  const commissionBpsAtPurchase =
    o.commissionBpsAtPurchase ?? o.menu?.restaurant?.commissionBps ?? null;
  const platformFeeCents =
    o.platformFeeCents ??
    (totalCents != null && commissionBpsAtPurchase != null
      ? Math.round(totalCents * (commissionBpsAtPurchase / 10000))
      : null);
  const netToRestaurantCents =
    totalCents != null && platformFeeCents != null ? totalCents - platformFeeCents : null;

  return {
    id: o.id,
    status: o.status,
    code: o.code,
    createdAt: o.createdAt,
    customerName: o.customerName,
    customerEmail: o.customerEmail,

    totalCents,
    commissionBpsAtPurchase,
    platformFeeCents,
    netToRestaurantCents,

    menu: o.menu
      ? {
          id: o.menu.id,
          title: o.menu.title,
          type: o.menu.type,
          priceCents: o.menu.priceCents,
          currency: o.menu.currency ?? "EUR",
        }
      : null,
    restaurant: o.menu?.restaurant
      ? {
          id: o.menu.restaurant.id,
          name: o.menu.restaurant.name,
        }
      : null,
  };
});

  return { ok: true, data };
});


app.get("/api/orders/:id", async (req: any, reply: any) => {
  const id = String((req.params as any)?.id ?? "").trim();
  if (!id) {
    return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "id es obligatorio" });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { menu: { include: { restaurant: true } } },
  });

  if (!order) {
    return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Pedido no encontrado" });
  }

  const totalCents = order.totalCents ?? order.menu?.priceCents ?? null;
  const commissionBpsAtPurchase =
    order.commissionBpsAtPurchase ?? order.menu?.restaurant?.commissionBps ?? null;
  const platformFeeCents =
    order.platformFeeCents ??
    (totalCents != null && commissionBpsAtPurchase != null
      ? Math.round(totalCents * (commissionBpsAtPurchase / 10000))
      : null);
  const netToRestaurantCents =
    totalCents != null && platformFeeCents != null ? totalCents - platformFeeCents : null;

  return {
    ok: true,
    order: {
      id: order.id,
      status: order.status,
      code: order.code,
      menuId: order.menuId,
      createdAt: order.createdAt,
      totalCents,
      commissionBpsAtPurchase,
      platformFeeCents,
      netToRestaurantCents,
    },
    menu: order.menu
      ? {
          id: order.menu.id,
          title: order.menu.title,
          type: order.menu.type,
          priceCents: order.menu.priceCents,
          currency: order.menu.currency ?? "EUR",
          description: order.menu.description,
        }
      : null,
    restaurant: order.menu?.restaurant
      ? {
          id: order.menu.restaurant.id,
          name: order.menu.restaurant.name,
          address: order.menu.restaurant.address,
          lat: order.menu.restaurant.lat,
          lng: order.menu.restaurant.lng,
        }
      : null,
  };
});

  

  
// --- Restaurant Orders (MVP) ---
// Marcar entregado POR RESTAURANTE (seguro)
app.post("/api/restaurants/:restaurantId/orders/mark-delivered", async (req: any, reply: any) => {
  const restaurantId = String((req.params as any)?.restaurantId ?? "").trim();
  const body = (req.body ?? {}) as any;
  const code = String(body.code ?? "").trim();

  if (!restaurantId) {
    return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "restaurantId es obligatorio" });
  }
  if (!code) {
    return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "code es obligatorio" });
  }

  const order = await prisma.order.findFirst({
    where: { code, menu: { restaurantId } },
    include: { menu: { include: { restaurant: true } } },
  });

  if (!order) {
    return reply.code(404).send({
      ok: false,
      error: "NOT_FOUND",
      message: "Pedido no encontrado para este restaurante",
    });
  }

  if (order.status === "DELIVERED") {
    return {
      ok: true,
      alreadyDelivered: true,
      order: { id: order.id, status: order.status, code: order.code },
      restaurant: order.menu?.restaurant ? { id: order.menu.restaurant.id, name: order.menu.restaurant.name } : null,
    };
  }

  // Modo estricto (solo desde READY) -> si lo quieres, descomenta:
  // if (order.status !== OrderStatus.READY) {
  //   return reply.code(409).send({ ok: false, error: "NOT_READY", message: "El pedido a?n no est? LISTO" });
  // }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "DELIVERED" },
  });

  return {
    ok: true,
    order: { id: updated.id, status: updated.status, code: updated.code },
    restaurant: order.menu?.restaurant ? { id: order.menu.restaurant.id, name: order.menu.restaurant.name } : null,
  };
});
app.post("/api/restaurant/orders/mark-delivered", async (req: any, reply: any) => {
  const body = (req.body ?? {}) as any;
  const code = String(body.code ?? "").trim();

  if (!code) {
    return reply.code(400).send({
      ok: false,
      error: "BAD_REQUEST",
      message: "code es obligatorio",
    });
  }

  const order = await prisma.order.findFirst({
    where: { code },
    include: { menu: { include: { restaurant: true } } },
  });

  if (!order) {
    return reply.code(404).send({
      ok: false,
      error: "NOT_FOUND",
      message: "Pedido no encontrado",
    });
  }

  if (order.status === "DELIVERED") {
    return {
      ok: true,
      alreadyDelivered: true,
      order: { id: order.id, status: order.status, code: order.code },
    };
  }

  // Modo estricto (solo desde READY) -> si lo quieres, descomenta:
  // if (order.status !== OrderStatus.READY) {
  //   return reply.code(409).send({
  //     ok: false,
  //     error: "NOT_READY",
  //     message: "El pedido a?n no est? LISTO",
  //   });
  // }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "DELIVERED" },
  });

  return {
    ok: true,
    order: { id: updated.id, status: updated.status, code: updated.code },
  };
});

await app.listen({ port, host: "0.0.0.0" });
