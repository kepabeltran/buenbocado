"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getOrder, type Order } from "../../_state/orders";
import { formatEuros } from "../../_data/restaurants";

function pickFromNotes(notes?: string) {
  if (!notes) return { day: null as string | null, window: null as string | null, pickup: null as string | null };
  const parts = notes.split("|").map((s) => s.trim());
  const day = parts.find((p) => p.toLowerCase().startsWith("día:")) ?? null;
  const franja = parts.find((p) => p.toLowerCase().startsWith("franja:")) ?? null;
  const pickup = parts.find((p) => p.toLowerCase().startsWith("recogida:")) ?? null;

  return {
    day: day ? day.replace(/^Día:\s*/i, "") : null,
    window: franja ? franja.replace(/^Franja:\s*/i, "") : null,
    pickup: pickup ? pickup.replace(/^Recogida:\s*/i, "") : null,
  };
}

function statusLabel(s: Order["status"]) {
  if (s === "CREATED") return "Creado";
  if (s === "PREPARING") return "En preparación";
  if (s === "READY") return "Listo para recoger";
  if (s === "DELIVERED") return "Entregado";
  return s;
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<Order | null>(() => (id ? getOrder(id) : null));
  const [tick, setTick] = useState(0);

  // polling simple: cada 2s re-lee el pedido del storage
  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => setTick((x) => x + 1), 2000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setOrder(getOrder(id));
  }, [id, tick]);

  if (!id || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">Ticket no encontrado</h1>
            <p className="mt-2 text-sm text-zinc-600">Puede que el pedido no exista en este navegador.</p>
            <Link href="/orders" className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ir a mis pedidos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dt = useMemo(() => new Date(order.createdAt), [order.createdAt]);
  const qty = useMemo(() => order.items.reduce((acc, it) => acc + it.qty, 0), [order.items]);
  const { day, window, pickup } = pickFromNotes(order.customer.notes);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/orders" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            ← Mis pedidos
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              auto-actualiza
            </span>
            <Link
              href={`/pickup/${order.id}`}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver código
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-500">Ticket</div>
              <h1 className="mt-1 text-2xl font-semibold">{order.restaurantName}</h1>
              <div className="mt-2 text-xs text-zinc-500">
                {dt.toLocaleString("es-ES")} · ID: <span className="font-mono">{order.id}</span>
              </div>
            </div>

            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              {statusLabel(order.status)}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs text-zinc-500">Código de recogida</div>
              <div className="mt-2 font-mono text-3xl font-bold tracking-widest">
                {order.pickupCode ?? "— — — — — —"}
              </div>
              <div className="mt-2 text-xs text-zinc-500">Enseña este código en el local.</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs text-zinc-500">Plan</div>
              <div className="mt-2 text-sm">
                {day ? <div><span className="font-semibold">Día:</span> {day}</div> : <div className="text-zinc-600">Día: (no aplica)</div>}
                {window ? <div className="mt-1"><span className="font-semibold">Franja:</span> {window}</div> : <div className="mt-1 text-zinc-600">Franja: (no aplica)</div>}
                <div className="mt-1 text-zinc-600">{pickup ? pickup : order.customer.address}</div>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-base font-semibold">Detalle</h2>
          <div className="mt-3 space-y-3">
            {order.items.map((it) => (
              <div key={it.itemId} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{it.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">Cantidad: {it.qty}</div>
                </div>
                <div className="text-sm font-semibold">{formatEuros(it.qty * it.priceCents)}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-zinc-600">{qty} artículos</div>
              <div className="text-lg font-semibold">{formatEuros(order.subtotalCents)}</div>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Cliente</div>
            <div className="mt-2 text-sm text-zinc-700">
              <div><span className="font-semibold">Nombre:</span> {order.customer.name}</div>
              <div className="mt-1"><span className="font-semibold">Tel:</span> {order.customer.phone}</div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/pickup/${order.id}`}
                className="inline-flex justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Mostrar código de recogida
              </Link>
              <Link
                href="/restaurant"
                className="inline-flex justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50"
              >
                Ir al panel restaurante (demo)
              </Link>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              (MVP) El estado se actualiza cada 2s leyendo el navegador. Luego será tiempo real por API/DB.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}