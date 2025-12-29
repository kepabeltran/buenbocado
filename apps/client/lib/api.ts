export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export async function fetchMenus() {
  const response = await fetch(`${API_URL}/menus`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudieron cargar los menús");
  }
  const data = await response.json();
  return data.data as MenuSummary[];
}

export async function fetchMenu(id: string) {
  const response = await fetch(`${API_URL}/menus/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudo cargar el menú");
  }
  const data = await response.json();
  return data.data as MenuSummary;
}

export async function createOrder() {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  if (!response.ok) {
    throw new Error("No se pudo crear el pedido");
  }
  return response.json() as Promise<{ orderId: string; code: string }>;
}

export async function fetchTicket(orderId: string) {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("No se pudo cargar el ticket");
  }
  return response.json() as Promise<{
    id: string;
    status: string;
    code: string;
    pickup: string;
    instructions: string;
  }>;
}
