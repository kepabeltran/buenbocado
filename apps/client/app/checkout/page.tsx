"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CartPill from "../_components/CartPill";
import { useCart } from "../_state/cart";
import { createOrder } from "../_state/orders";
import { formatEuros, getRestaurantById } from "../_data/restaurants";

type ApiMenu = {
  id: string;
  title?: string;
  name?: string;
  priceCents?: number;
  price?: number; // por si viniera en euros
  restaurantId?: string;
  restaurantName?: string;
  restaurant?: any; // a veces viene string u objeto
};

function pickRestaurantName(m: any): string | null {
  if (!m) return null;
  if (typeof m.restaurantName === "string" && m.restaurantName.trim()) return m.restaurantName.trim();
  if (typeof m.restaurant === "string" && m.restaurant.trim()) return m.restaurant.trim();
  if (m.restaurant && typeof m.restaurant.name === "string" && m.restaurant.name.trim()) return m.restaurant.name.trim();
  return null;
}

function pickRestaurantId(m: any): string | null {
  if (!m) return null;
  if (typeof m.restaurantId === "string" && m.restaurantId.trim()) return m.restaurantId.trim();
  if (m.restaurant && typeof m.restaurant.id === "string" && m.restaurant.id.trim()) return m.restaurant.id.trim();
  return null;
}

function pickMenuTitle(m: any, fallback: string) {
  if (!m) return fallback;
  const t = (m.title ?? m.name);
  return typeof t === "string" && t.trim() ? t.trim() : fallback;
}

function pickPriceCents(m: any): number {
  if (!m) return 0;
  if (typeof m.priceCents === "number" && Number.isFinite(m.priceCents)) return Math.max(0, Math.round(m.priceCents));
  if (typeof m.price === "number" && Number.isFinite(m.price)) return Math.max(0, Math.round(m.price * 100));
  return 0;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { restaurantId: storedRestaurantId, items, clear } = useCart();

  // 1) Inferir restaurantId si falta (por keys tipo `${restaurantId}:${itemId}`)
  const activeRestaurantId = useMemo(() => {
    if (storedRestaurantId) return storedRestaurantId;

    const firstKey = Object.entries(items).find(([k, qty]) => qty > 0)?.[0];
    if (!firstKey) return null;

    const parts = String(firstKey).split(":");
    const rid = parts.length > 1 ? parts[0] : null;
    return rid || null;
  }, [storedRestaurantId, items]);

  // 2) Intentar resolver restaurante en mock (modo “restaurante”)
  const mockRestaurant = useMemo(() => {
    if (!activeRestaurantId) return null;
    return getRestaurantById(activeRestaurantId) ?? null;
  }, [activeRestaurantId]);

  // 3) Si NO existe en mock, cargamos menús desde API (modo “API/menús”)
  const [apiIndex, setApiIndex] = useState<Record<string, ApiMenu>>({});
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const cartKeys = useMemo(
    () => Object.entries(items).filter(([_, qty]) => qty > 0).map(([k]) => String(k)),
    [items]
  );

  const cartItemIds = useMemo(() => {
    return cartKeys
      .map((k) => {
        const parts = k.split(":");
        return parts.length > 1 ? parts[1] : parts[0];
      })
      .filter(Boolean);
  }, [cartKeys]);

  const cartSig = useMemo(() => [...cartItemIds].sort().join("|"), [cartItemIds]);

  useEffect(() => {
    // Solo modo API si no hay restaurante mock
    if (mockRestaurant) return;

    if (cartItemIds.length === 0) return;

    let cancelled = false;

    async function run() {
      setApiError(null);
      setApiLoaded(false);

      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
      const lat = 37.176;
      const lng = -3.600;

      const urls = [
        `${base}/api/menus/active?lat=${lat}&lng=${lng}`,
        `${base}/api/menus/active`,
        `${base}/menus`,
        `${base}/api/menus`,
      ];

      let json: any = null;

      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          json = await res.json();
          if (json) break;
        } catch {
          // probamos siguiente
        }
      }

      if (cancelled) return;

      if (!json) {
        setApiError("No pude cargar menús desde la API (¿está levantada en :4000?).");
        setApiLoaded(true);
        return;
      }

      const data =
        Array.isArray(json) ? json :
        Array.isArray(json.data) ? json.data :
        Array.isArray(json.menus) ? json.menus :
        Array.isArray(json.items) ? json.items :
        [];

      const idx: Record<string, ApiMenu> = {};
      for (const m of data) {
        if (m && m.id) idx[String(m.id)] = m as ApiMenu;
      }

      setApiIndex(idx);
      setApiLoaded(true);
    }

    run();
    return () => { cancelled = true; };
  }, [mockRestaurant, cartSig]);

  // 4) Construir lineItems en función del modo
  const lineItems = useMemo(() => {
    // Modo restaurante (mock)
    if (mockRestaurant) {
      const map = new Map(
        (mockRestaurant as any).categories.flatMap((c: any) => c.items.map((it: any) => [it.id, it]))
      );

      return Object.entries(items)
        .filter(([k, qty]) => qty > 0 && String(k).startsWith(`${mockRestaurant.id}:`))
        .map(([k, qty]) => {
          const parts = String(k).split(":");
          const itemId = parts[1];
          const it = map.get(itemId);
          if (!it) return null;
          return { itemId, name: it.name, qty, priceCents: it.priceCents, missing: false };
        })
        .filter(Boolean) as { itemId: string; name: string; qty: number; priceCents: number; missing: boolean }[];
    }

    // Modo API (menús)
    return Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([k, qty]) => {
        const parts = String(k).split(":");
        const itemId = parts.length > 1 ? parts[1] : parts[0];
        const m = apiIndex[itemId];
        return {
          itemId,
          name: pickMenuTitle(m, `Menú ${itemId}`),
          qty,
          priceCents: pickPriceCents(m),
          missing: !m,
        };
      });
  }, [items, mockRestaurant, apiIndex]);

  const subtotalCents = useMemo(
    () => lineItems.reduce((acc, l) => acc + l.qty * l.priceCents, 0),
    [lineItems]
  );

  const restaurantName = useMemo(() => {
    if (mockRestaurant) return (mockRestaurant as any).name as string;
    const first = lineItems.find((l) => !l.missing);
    const m = first ? apiIndex[first.itemId] : null;
    return pickRestaurantName(m) ?? "Restaurante";
  }, [mockRestaurant, lineItems, apiIndex]);

  const restaurantIdForOrder = useMemo(() => {
    if (mockRestaurant) return mockRestaurant.id;
    const first = lineItems.find((l) => !l.missing);
    const m = first ? apiIndex[first.itemId] : null;
    return activeRestaurantId ?? pickRestaurantId(m) ?? "unknown";
  }, [mockRestaurant, activeRestaurantId, lineItems, apiIndex]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);

    if (lineItems.length === 0) return setError("Tu carrito está vacío.");

    // Si estamos en modo API, y aún no cargó, frenamos
    if (!mockRestaurant) {
      if (!apiLoaded) return setError("Cargando datos de la oferta… prueba en 1 segundo.");
      if (apiError) return setError(apiError);
      const missing = lineItems.filter((l) => l.missing);
      if (missing.length > 0) {
        return setError("No pude cargar algún menú del carrito (puede haber caducado). Vuelve atrás y elige otra oferta.");
      }
    } else {
      // modo restaurante (mock): necesitamos restaurante
      if (!mockRestaurant) return setError("No hay restaurante activo en el carrito.");
    }

    if (name.trim().length < 2) return setError("Pon tu nombre (mínimo 2 letras).");
    if (phone.trim().length < 6) return setError("Pon un teléfono válido.");
    if (address.trim().length < 6) return setError("Pon una dirección válida.");

    const order = createOrder({
      restaurantId: restaurantIdForOrder,
      restaurantName,
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
      },
      items: lineItems.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.qty, priceCents: l.priceCents })),
      subtotalCents,
    });

    clear();
    router.push(`/order/${order.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">BB</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">checkout</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              ← Volver
            </Link>
            <CartPill />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Checkout</h1>

          {!mockRestaurant && (
            <p className="mt-2 text-xs text-zinc-500">
              Modo API: restauranteId en carrito = <span className="font-mono">{activeRestaurantId ?? "null"}</span>
              {apiError ? ` · API error: ${apiError}` : ""}
            </p>
          )}

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="600 123 123"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Dirección</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Calle, número, puerta..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Ej: sin cebolla, llamar al llegar..."
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={onConfirm}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Confirmar pedido
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Resumen</h2>

            {lineItems.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">
                Tu carrito está vacío. Vuelve atrás y añade una oferta.
              </p>
            ) : (
              <>
                <div className="mt-3 text-sm text-zinc-600">
                  Restaurante: <span className="font-semibold text-zinc-900">{restaurantName}</span>
                </div>

                <div className="mt-4 space-y-3">
                  {lineItems.map((l) => (
                    <div key={l.itemId} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {l.qty}× {l.name}
                          {l.missing ? <span className="ml-2 text-xs text-red-600">(no cargado)</span> : null}
                        </div>
                        <div className="text-xs text-zinc-500">{formatEuros(l.priceCents)}</div>
                      </div>
                      <div className="text-sm font-semibold">{formatEuros(l.qty * l.priceCents)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-600">Subtotal</div>
                    <div className="text-base font-semibold">{formatEuros(subtotalCents)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}