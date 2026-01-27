"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listOrders,
  setOrderStatus,
  validatePickupCode,
  type Order,
  type OrderStatus,
} from "../../_state/orders";
import { formatEuros } from "../../_data/restaurants";

function pickFromNotes(notes?: string) {
  if (!notes)
    return { day: null as string | null, window: null as string | null };
  const parts = notes.split("|").map((s) => s.trim());
  const day = parts.find((p) => p.toLowerCase().startsWith("día:")) ?? null;
  const franja =
    parts.find((p) => p.toLowerCase().startsWith("franja:")) ?? null;
  return {
    day: day ? day.replace(/^Día:\s*/i, "") : null,
    window: franja ? franja.replace(/^Franja:\s*/i, "") : null,
  };
}

function labelStatus(s: OrderStatus) {
  if (s === "CREATED") return "Creado";
  if (s === "PREPARING") return "En preparación";
  if (s === "READY") return "Listo";
  if (s === "DELIVERED") return "Entregado";
  return s;
}

export default function RestaurantRidPage({
  params,
}: {
  params: { rid: string };
}) {
  const rid = params.rid;

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "__ALL__">(
    "__ALL__",
  );
  const [code, setCode] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  // Gate mínimo (temporal): sin sesión -> /r/login
  // - demo=1 permite entrar mientras montamos login real
  // - más adelante: cookie/roles reales por restaurante
  useEffect(() => {    const hasCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("bb_rest=1"));
    if (!hasCookie) {
      window.location.href = "/r/login";
    }
  }, []);
  useEffect(() => {
    setOrders(listOrders());
  }, []);

  function refreshOrders() {
    setOrders(listOrders());
  }

  const visible = useMemo(() => {
    return orders.filter((o) => {
      if (o.restaurantId !== rid) return false;
      if (statusFilter !== "__ALL__" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, rid, statusFilter]);

  function bump(orderId: string, next: OrderStatus) {
    setOrderStatus(orderId, next);
    refreshOrders();
    setToast({
      ok: true,
      msg: `✅ Estado actualizado a: ${labelStatus(next)}`,
    });
    setTimeout(() => setToast(null), 2200);
  }

  function onValidate() {
    const res = validatePickupCode(code, rid);
    setToast({ ok: res.ok, msg: res.message });
    setTimeout(() => setToast(null), 2500);
    if (res.ok) {
      setCode("");
      refreshOrders();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
              Panel Restaurante
            </span>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              rid: <span className="font-mono">{rid}</span>
            </div>

            <Link
              href="/orders"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Mis pedidos (cliente)
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/restaurant"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              title="Vista admin demo (todos)"
            >
              Admin demo
            </Link>
            <Link
              href="/ofertas"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">Pedidos entrantes</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Vista fija del restaurante.{" "}
                  <b>No puedes cambiar de restaurante aquí.</b>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="__ALL__">Todos los estados</option>
                  <option value="PREPARING">En preparación</option>
                  <option value="READY">Listo</option>
                  <option value="DELIVERED">Entregado</option>
                </select>

                <button
                  type="button"
                  onClick={refreshOrders}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                >
                  Refrescar
                </button>
              </div>
            </div>

            {toast && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  toast.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {toast.msg}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {visible.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600">
                  No hay pedidos con estos filtros.
                </div>
              ) : (
                visible.map((o) => {
                  const dt = new Date(o.createdAt);
                  const qty = o.items.reduce((acc, it) => acc + it.qty, 0);
                  const { day, window } = pickFromNotes(o.customer.notes);

                  return (
                    <div
                      key={o.id}
                      className="rounded-3xl border border-zinc-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-zinc-500">
                            {dt.toLocaleString("es-ES")}
                          </div>
                          <div className="mt-1 text-base font-semibold">
                            {o.restaurantName}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500 font-mono">
                            ID: {o.id}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Código</div>
                          <div className="font-mono text-2xl font-bold tracking-widest">
                            {o.pickupCode}
                          </div>
                          <div className="mt-1 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                            {labelStatus(o.status)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                          <div className="text-xs font-semibold text-zinc-700">
                            Cliente
                          </div>
                          <div className="mt-1">
                            {o.customer.name} · {o.customer.phone}
                          </div>
                          {day && (
                            <div className="mt-1 text-xs text-zinc-600">
                              Día: {day}
                            </div>
                          )}
                          {window && (
                            <div className="mt-1 text-xs text-zinc-600">
                              Franja: {window}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                          <div className="text-xs font-semibold text-zinc-700">
                            Resumen
                          </div>
                          <div className="mt-1">
                            {qty} items ·{" "}
                            <span className="font-semibold">
                              {formatEuros(o.subtotalCents)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-600">
                            {o.items[0]?.name}
                            {o.items.length > 1
                              ? ` +${o.items.length - 1} más`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/ticket/${o.id}`}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                        >
                          Ver ticket
                        </Link>

                        <button
                          onClick={() => bump(o.id, "PREPARING")}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                          type="button"
                        >
                          En preparación
                        </button>

                        <button
                          onClick={() => bump(o.id, "READY")}
                          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                          type="button"
                        >
                          Marcar LISTO
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold">Validar recogida</h2>
              <p className="mt-2 text-sm text-zinc-600">
                El cliente enseña el código. Tú lo metes aquí. Solo entrega si
                está <b>LISTO</b>.
              </p>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Código (6 dígitos)
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-zinc-200"
                  placeholder="954307"
                  maxLength={6}
                />
              </div>

              <button
                onClick={onValidate}
                className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                type="button"
              >
                Validar y marcar ENTREGADO
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
