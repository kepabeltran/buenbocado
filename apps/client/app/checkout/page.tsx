"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CartPill from "../_components/CartPill";
import { useCart } from "../_state/cart";
import { createOrder } from "@/lib/api";
import {
  getRestaurantById,
  restaurants,
  formatEuros,
} from "../_data/restaurants";

export default function CheckoutPage() {
  const router = useRouter();
  const { restaurantId, items, clear } = useCart();

  const restaurant = useMemo(() => {
    if (!restaurantId) return null;
    return getRestaurantById(restaurantId) ?? null;
  }, [restaurantId]);

  const lineItems = useMemo(() => {
    if (!restaurant) return [];
    const map = new Map(
      ((restaurant as any).categories ?? []).flatMap((c: any) =>
        (c?.items ?? []).map((it: any) => [it.id, it]),
      ),
    );
    return Object.entries(items)
      .filter(([k, qty]) => k.startsWith(`${restaurant.id}:`) && qty > 0)
      .map(([k, qty]) => {
        const itemId = k.split(":")[1];
        const it = map.get(itemId);
        if (!it) return null;
        return {
          itemId,
          name: (it as any).name,
          qty,
          priceCents: (it as any).priceCents,
        };
      })
      .filter(Boolean) as {
      itemId: string;
      name: string;
      qty: number;
      priceCents: number;
    }[];
  }, [items, restaurant]);

  const subtotalCents = useMemo(
    () => lineItems.reduce((acc, l) => acc + l.qty * l.priceCents, 0),
    [lineItems],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);

    if (!restaurant)
      return setError("No hay restaurante activo en el carrito.");
    if (lineItems.length === 0) return setError("Tu carrito está vacío.");
    if (name.trim().length < 2)
      return setError("Pon tu nombre (mínimo 2 letras).");

    const emailClean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean))
      return setError("Pon un email válido.");

    if (phone.trim().length < 6) return setError("Pon un teléfono válido.");
    if (address.trim().length < 6) return setError("Pon una dirección válida.");

    const res = await createOrder({
      menuId: lineItems[0]?.itemId ? String(lineItems[0].itemId) : "",
      customerName: name.trim(),
      customerEmail: emailClean,
    });

    clear();
    router.push(`/ticket/${res.order.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">
              BB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">checkout</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={
                restaurant ? `/restaurants/${restaurant.id}` : "/restaurants"
              }
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              ? Volver
            </Link>
            <CartPill />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-2 text-sm text-zinc-600">
            (MVP) Esto guarda el pedido en localStorage. Luego lo conectamos a
            API + DB sin cambiar pantallas.
          </p>

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
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
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

            {!restaurant ? (
              <p className="mt-3 text-sm text-zinc-600">
                No hay carrito activo. Ve a{" "}
                <Link className="underline" href="/restaurants">
                  restaurantes
                </Link>
                .
              </p>
            ) : lineItems.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">
                Tu carrito está vacío. Vuelve a{" "}
                <Link
                  className="underline"
                  href={`/restaurants/${restaurant.id}`}
                >
                  la carta
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="mt-3 text-sm text-zinc-600">
                  Restaurante:{" "}
                  <span className="font-semibold text-zinc-900">
                    {restaurant.name}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {lineItems.map((l) => (
                    <div
                      key={l.itemId}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {l.qty} · {l.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {formatEuros(l.priceCents)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatEuros(l.qty * l.priceCents)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-600">Subtotal</div>
                    <div className="text-base font-semibold">
                      {formatEuros(subtotalCents)}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    (MVP) En el siguiente paso añadimos gastos/propina/cupones
                    si quieres.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
