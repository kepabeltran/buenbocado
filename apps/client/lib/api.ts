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

export async function createOrder(opts?: FetchOpts) {
  const base = getBase();
  const timeoutMs = opts?.timeoutMs ?? 1800;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("No se pudo crear el pedido");
    return res.json() as Promise<{ orderId: string; code: string }>;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchTicket(orderId: string, opts?: FetchOpts) {
  const base = getBase();
  const j = await fetchJson(`${base}/orders/${orderId}`, opts);
  return j as Promise<{
    id: string;
    status: string;
    code: string;
    pickup: string;
    instructions: string;
  }>;
}