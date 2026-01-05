"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatEuros, type MenuItem, type Restaurant } from "../../_data/restaurants";
import CartPill from "../../_components/CartPill";
import { useCart } from "../../_state/cart";

type CartLine = { item: MenuItem; qty: number };

export default function RestaurantDetailClient({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const { getQty, add, remove, items, restaurantId, clear } = useCart();

  const itemsFlat = useMemo(() => {
    const all: MenuItem[] = [];
    for (const c of restaurant.categories) for (const it of c.items) all.push(it);
    return all;
  }, [restaurant]);

  const lines: CartLine[] = useMemo(() => {
    // Solo mostramos líneas del restaurante actual
    if (restaurantId && restaurantId !== restaurant.id) return [];
    return itemsFlat
      .map((it) => ({ item: it, qty: getQty(restaurant.id, it.id) }))
      .filter((l) => l.qty > 0);
  }, [itemsFlat, getQty, restaurant.id, restaurantId]);

  const subtotalCents = useMemo(
    () => lines.reduce((acc, l) => acc + l.qty * l.item.priceCents, 0),
    [lines]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/restaurants"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            ← Restaurantes
          </Link>

          <div className="text-center leading-tight">
            <div className="text-sm font-semibold">{restaurant.name}</div>
            <div className="text-xs text-zinc-500">{restaurant.tagline}</div>
          </div>

          <CartPill />
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
                <p className="mt-2 text-sm text-zinc-600">
                  {restaurant.address} · {restaurant.hours}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {restaurant.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right text-sm text-zinc-600">
                <div className="font-semibold text-zinc-900">
                  {restaurant.rating.toFixed(1)} ★
                </div>
                <div className="mt-1">
                  {restaurant.minutes} min · {restaurant.distanceKm.toFixed(1)} km
                </div>
                <div className="mt-1">{restaurant.price}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {restaurant.categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold">{cat.name}</h2>

                <div className="mt-4 space-y-3">
                  {cat.items.map((it) => {
                    const qty = getQty(restaurant.id, it.id);
                    return (
                      <div
                        key={it.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold">{it.name}</div>
                            {it.tags?.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {it.description}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="text-sm font-semibold">
                            {formatEuros(it.priceCents)}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => remove(restaurant.id, it.id, 1)}
                              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-sm font-semibold hover:bg-zinc-50"
                              aria-label={`Quitar ${it.name}`}
                            >
                              −
                            </button>
                            <div className="w-6 text-center text-sm font-semibold">{qty}</div>
                            <button
                              onClick={() => add(restaurant.id, it.id, 1)}
                              className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800"
                              aria-label={`Añadir ${it.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Tu carrito</h3>
              <button
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                onClick={() => clear()}
                title="Vaciar carrito"
              >
                Vaciar
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">
                Aún no has añadido nada. Dale al “+” y empieza el festival.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {lines.map((l) => (
                  <div key={l.item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {l.qty}× {l.item.name}
                      </div>
                      <div className="text-xs text-zinc-500">{formatEuros(l.item.priceCents)}</div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatEuros(l.qty * l.item.priceCents)}
                    </div>
                  </div>
                ))}

                <div className="mt-4 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-600">Subtotal</div>
                    <div className="text-base font-semibold">{formatEuros(subtotalCents)}</div>
                  </div>

                  <button
                    className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={() => alert("MVP: el siguiente paso es conectar checkout/pedido 😉")}
                  >
                    Ir a pagar
                  </button>

                  <p className="mt-2 text-xs text-zinc-500">
                    (MVP) Ahora mismo es demo. Luego conectamos API + pedidos + pago.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}