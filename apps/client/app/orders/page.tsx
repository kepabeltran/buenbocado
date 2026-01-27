"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listOrders, type Order } from "../_state/orders";
import { formatEuros } from "../_data/restaurants";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(listOrders());
  }, []);

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
              <div className="text-xs text-zinc-500">mis pedidos</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/ofertas"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Ver ofertas
            </Link>
            <Link
              href="/restaurants"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Pedir
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <p className="mt-2 text-sm text-zinc-600">
          (MVP) Guardados en tu navegador. Luego esto vendrá de la base de datos
          por usuario.
        </p>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="text-sm text-zinc-700">Aún no tienes pedidos.</div>
            <Link
              href="/ofertas"
              className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver ofertas
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((o) => {
              const dt = new Date(o.createdAt);
              const qty = o.items.reduce((acc, it) => acc + it.qty, 0);

              return (
                <div
                  key={o.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {o.restaurantName}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {dt.toLocaleString("es-ES")} · ID:{" "}
                        <span className="font-mono">{o.id}</span>
                      </div>
                      <div className="mt-2 text-xs text-zinc-600">
                        {qty} artículos ·{" "}
                        <span className="font-semibold text-zinc-900">
                          {formatEuros(o.subtotalCents)}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                      {o.status === "PREPARING" ? "En preparación" : o.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/ticket/${o.id}`}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Ver ticket
                    </Link>
                    <Link
                      href={`/ticket/${o.id}#codigo`}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                    >
                      Código
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
