"use client";

export type OrderStatus = "CREATED" | "PREPARING" | "READY" | "DELIVERED";

export type OrderItem = {
  itemId: string;
  name: string;
  qty: number;
  priceCents: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  address: string;
  notes?: string;
};

export type Order = {
  id: string;
  createdAt: string; // ISO
  restaurantId: string;
  restaurantName: string;
  status: OrderStatus;
  pickupCode: string; // 6 dígitos
  items: OrderItem[];
  subtotalCents: number;
  customer: OrderCustomer;
};

const PRIMARY_KEY = "bb_orders_v1";
const LEGACY_KEYS = ["bb_orders", "bb_orders_v0", "bb_orders_v0_legacy"];

function safeParse(raw: string | null): any[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalize(list: any[]): Order[] {
  return list
    .map((o: any) => {
      const created =
        typeof o?.createdAt === "string"
          ? o.createdAt
          : typeof o?.createdAt === "number"
            ? new Date(o.createdAt).toISOString()
            : new Date().toISOString();

      const statusRaw = String(o?.status ?? "PREPARING").toUpperCase();
      const status: OrderStatus =
        statusRaw === "CREATED" ||
        statusRaw === "PREPARING" ||
        statusRaw === "READY" ||
        statusRaw === "DELIVERED"
          ? (statusRaw as OrderStatus)
          : "PREPARING";

      const pickup = String(o?.pickupCode ?? o?.code ?? "").trim();
      const pickupCode = /^\d{6}$/.test(pickup)
        ? pickup
        : String(Math.floor(100000 + Math.random() * 900000));

      return {
        id: String(
          o?.id ??
            o?.orderId ??
            `ord_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
        ),
        createdAt: created,
        restaurantId: String(
          o?.restaurantId ?? o?.restaurant?.id ?? "rest_demo",
        ),
        restaurantName: String(
          o?.restaurantName ?? o?.restaurant?.name ?? "Restaurante (demo)",
        ),
        status,
        pickupCode,
        items: Array.isArray(o?.items) ? o.items : [],
        subtotalCents: Number.isFinite(o?.subtotalCents) ? o.subtotalCents : 0,
        customer: {
          name: String(o?.customer?.name ?? ""),
          phone: String(o?.customer?.phone ?? ""),
          address: String(o?.customer?.address ?? ""),
          notes:
            typeof o?.customer?.notes === "string"
              ? o.customer.notes
              : undefined,
        },
      } as Order;
    })
    .filter((o) => !!o.id);
}

function save(list: Order[]) {
  try {
    localStorage.setItem(PRIMARY_KEY, JSON.stringify(list));
  } catch {}
}

function load(): Order[] {
  // 1) clave nueva
  const primary = safeParse(localStorage.getItem(PRIMARY_KEY));
  if (primary && primary.length) return normalize(primary);

  // 2) legacy: primera que tenga datos
  for (const k of LEGACY_KEYS) {
    const legacy = safeParse(localStorage.getItem(k));
    if (legacy && legacy.length) {
      const norm = normalize(legacy);
      // Migración automática a la nueva clave
      save(norm);
      return norm;
    }
  }

  return [];
}

function randId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function genPickupCode(existing: Set<string>) {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!existing.has(code)) return code;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function listOrders(): Order[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(id: string): Order | null {
  return load().find((o) => o.id === id) ?? null;
}

export function createOrder(input: {
  restaurantId: string;
  restaurantName: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotalCents: number;
}): Order {
  const list = load();
  const existingCodes = new Set(list.map((o) => o.pickupCode));

  const order: Order = {
    id: randId("ord"),
    createdAt: new Date().toISOString(),
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    status: "PREPARING",
    pickupCode: genPickupCode(existingCodes),
    customer: input.customer,
    items: input.items,
    subtotalCents: input.subtotalCents,
  };

  list.unshift(order);
  save(list);
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus): Order | null {
  const list = load();
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;

  list[idx] = { ...list[idx], status };
  save(list);
  return list[idx];
}

export function findOrderByPickupCode(
  code: string,
  restaurantId?: string,
): Order | null {
  const clean = (code ?? "").trim();
  if (!/^\d{6}$/.test(clean)) return null;

  const list = load();
  const found = list.find(
    (o) =>
      o.pickupCode === clean &&
      (!restaurantId || o.restaurantId === restaurantId),
  );
  return found ?? null;
}

export function validatePickupCode(
  code: string,
  restaurantId?: string,
): { ok: boolean; message: string; order?: Order } {
  const order = findOrderByPickupCode(code, restaurantId);
  if (!order)
    return {
      ok: false,
      message: "Código no encontrado (o no pertenece a este restaurante).",
    };

  if (order.status === "DELIVERED")
    return { ok: false, message: "Este pedido ya fue entregado.", order };
  if (order.status !== "READY") {
    return {
      ok: false,
      message: `Aún no está listo (estado: ${order.status}). Márcalo como LISTO antes de entregar.`,
      order,
    };
  }

  const updated = setOrderStatus(order.id, "DELIVERED");
  return {
    ok: true,
    message: "✅ Entrega confirmada. Pedido marcado como ENTREGADO.",
    order: updated ?? order,
  };
}

/** Inserta/actualiza un pedido en localStorage con un id externo (ej: cmk... de Prisma) */
export function upsertOrder(order: Order): Order {
  const list = load();
  const idx = list.findIndex((o) => o.id === order.id);

  if (idx >= 0) list[idx] = { ...list[idx], ...order };
  else list.unshift(order);

  save(list);
  return order;
}

function toStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? "").toUpperCase();
  if (
    s === "CREATED" ||
    s === "PREPARING" ||
    s === "READY" ||
    s === "DELIVERED"
  )
    return s as OrderStatus;
  return "CREATED";
}

export function upsertExternalOrder(input: {
  orderId: string;
  status?: unknown;
  code?: unknown;
  createdAt?: unknown;

  restaurantName: string;
  restaurantId?: string;

  menuId: string;
  menuTitle: string;
  priceCents: number;

  customerName: string;
  customerPhone?: string;
  notes?: string;
}): Order | null {
  const orderId = String(input.orderId ?? "").trim();
  if (!orderId) return null;

  const list = load();
  const existingCodes = new Set(list.map((o) => o.pickupCode));

  const codeRaw = String(input.code ?? "").trim();
  const pickupCode = /^\d{6}$/.test(codeRaw)
    ? codeRaw
    : genPickupCode(existingCodes);

  const createdAt =
    typeof input.createdAt === "string" && input.createdAt
      ? input.createdAt
      : new Date().toISOString();

  const order: Order = {
    id: orderId,
    createdAt,
    restaurantId: String(input.restaurantId ?? "rest_api"),
    restaurantName: String(input.restaurantName ?? "Restaurante"),
    status: toStatus(input.status),
    pickupCode,
    items: [
      {
        itemId: String(input.menuId),
        name: String(input.menuTitle),
        qty: 1,
        priceCents: Number(input.priceCents) || 0,
      },
    ],
    subtotalCents: Number(input.priceCents) || 0,
    customer: {
      name: String(input.customerName ?? ""),
      phone: String(input.customerPhone ?? ""),
      address: "",
      notes: typeof input.notes === "string" ? input.notes : undefined,
    },
  };

  return upsertOrder(order);
}
