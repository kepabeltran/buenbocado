type FetchOpts = { timeoutMs?: number };

function normalizeBase(raw: string) {
  return raw
    .replace("0.0.0.0", "127.0.0.1")
    .replace(/\/$/, "")
    .replace(/\/api\/?$/, "");
}

function getBase() {
  const raw =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000";
  return normalizeBase(raw);
}

async function fetchJson(url: string, opts?: FetchOpts) {
  const timeoutMs = opts?.timeoutMs ?? 1800;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export type MenuSummary = {
  id: string;
  restaurant: string;
  type: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  timeRemaining: string;
  distanceKm: number;
  badge: string | null;
};

export async function fetchMenus(opts?: FetchOpts): Promise<MenuSummary[]> {
  const base = getBase();

  // Preferimos /api/menus/active (tu API ya lo expone), y si no existe, caemos a /menus
  try {
    const j = await fetchJson(`${base}/api/menus/active`, opts);
    return (j.data ?? j) as MenuSummary[];
  } catch {
    const j = await fetchJson(`${base}/menus`, opts);
    return (j.data ?? j) as MenuSummary[];
  }
}

export async function fetchMenu(id: string, opts?: FetchOpts): Promise<MenuSummary> {
  const base = getBase();
  const j = await fetchJson(`${base}/menus/${id}`, opts);
  return (j.data ?? j) as MenuSummary;
}

export async function createOrder(
  input: { menuId: string; customerName: string; customerEmail: string },
  opts?: FetchOpts
) {
  const base = getBase();
  const timeoutMs = opts?.timeoutMs ?? 1800;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const json = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg = json?.message || json?.error || "No se pudo crear la reserva";
      throw new Error(msg);
    }

    // Devuelve la respuesta del API tal cual (tiene order.id y order.code)
    return json as Promise<{
      ok: true;
      order: { id: string; status: string; code: string; menuId: string; createdAt: string };
      menu?: { id: string; title: string; restaurant: string; priceCents: number; currency: string };
    }>;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchTicket(orderId: string, opts?: FetchOpts) {
  const base = getBase();
  const j = await fetchJson(`${base}/api/orders/${orderId}`, opts);

  // API devuelve: { ok:true, order:{...}, menu:{...}, restaurant:{...} }
  const restaurantName =
    j?.restaurant?.name ?? j?.menu?.restaurant ?? "Restaurante";
  const restaurantAddress = j?.restaurant?.address ?? "";
  const pickup = [restaurantName, restaurantAddress].filter(Boolean).join(" · ");

  const code = String(j?.order?.code ?? "");
  const status = String(j?.order?.status ?? "");

  // Instrucciones mínimas (luego las refinamos cuando definamos UX final)
  const instructions =
    restaurantAddress
      ? "Enseña este código en el local para recoger tu pedido."
      : "Enseña este código en el local para recoger tu pedido.";

  return {
    id: String(j?.order?.id ?? orderId),
    status,
    code,
    pickup,
    instructions,
  } as {
    id: string;
    status: string;
    code: string;
    pickup: string;
    instructions: string;
  };
}
