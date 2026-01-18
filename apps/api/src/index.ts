import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { PrismaClient, MenuType, OrderStatus } from "@prisma/client";
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

await app.register(cors, { origin: true });

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
await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: "/uploads/",
});

if (!process.env.DATABASE_URL) {
  app.log.error("DATABASE_URL no está definida. Revisa tu .env en el root del repo.");
}

const prisma = new PrismaClient();


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

// Menús activos reales desde BD
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

    const data = items.map((m) => menuToDto(m, now, userLat, userLng));

  if (userLat !== null && userLng !== null) {
    data.sort((a, b) => {
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
  return { data: menuToDto(item, now) };
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
    return reply.code(400).send({ error: "title es obligatorio (mín 3 caracteres)" });
  }
  if (!Number.isFinite(body.priceCents) || body.priceCents <= 0) {
    return reply.code(400).send({ error: "priceCents debe ser número > 0" });
  }
  if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
    return reply.code(400).send({ error: "quantity debe ser número > 0" });
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
      type: body.type as MenuType,
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
      message: "La oferta no existe, no está activa o no tiene stock",
    });
  }

  // Codigo simple (6 digitos)
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");

  try {
    const order = await prisma.$transaction(async (tx) => {
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
          // status: CREATED por defecto
        },
      });
    });

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
        message: "Sin stock (alguien reservó justo antes)",
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
// Sin auth todavía: sirve para portal restaurante mientras montamos roles.
// Opcional: filtrar por ?restaurantId=... y limitar con ?take=...
//
app.get("/api/restaurant/orders", async (req: any) => {
  const q = (req.query ?? {}) as any;
  const restaurantId = String(q.restaurantId ?? "").trim() || null;

  const takeRaw = Number(q.take ?? 50);
  const take = Number.isFinite(takeRaw) ? Math.max(1, Math.min(100, Math.floor(takeRaw))) : 50;

  const where: any = {};
  if (restaurantId) {
    // filtra por restaurante via relación menu -> restaurantId
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

  const data = orders.map((o: any) => ({
    id: o.id,
    status: o.status,
    code: o.code,
    createdAt: o.createdAt,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
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
  }));

  return { ok: true, data };
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

  if (order.status === OrderStatus.DELIVERED) {
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
  //     message: "El pedido aún no está LISTO",
  //   });
  // }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.DELIVERED },
  });

  return {
    ok: true,
    order: { id: updated.id, status: updated.status, code: updated.code },
  };
});

await app.listen({ port, host: "0.0.0.0" });
