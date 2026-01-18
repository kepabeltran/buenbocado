"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";

type OrderStatus = "CREATED" | "PREPARING" | "READY" | "DELIVERED";

type OrderDto = {
  id: string;
  status: OrderStatus;
  code: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  menu: null | {
    id: string;
    title: string;
    type: "TAKEAWAY" | "DINEIN";
    priceCents: number;
    currency: string;
  };
  restaurant: null | {
    id: string;
    name: string;
  };
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Creado",
  PREPARING: "Preparando",
  READY: "Listo",
  DELIVERED: "Entregado",
};

const STATUS_ORDER_IN_PROGRESS: Record<OrderStatus, number> = {
  READY: 0,
  PREPARING: 1,
  CREATED: 2,
  DELIVERED: 99,
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function shortId(id: string) {
  if (!id) return "";
  return id.length > 10 ? `${id.slice(-6)}` : id;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const normalizedCode = useMemo(() => code.replace(/\D/g, ""), [code]);

  const [showDelivered, setShowDelivered] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

  async function loadOrders(opts?: { initial?: boolean }) {
    const initial = Boolean(opts?.initial);

    if (initial) setLoading(true);
    else setRefreshing(true);

    setLoadError(null);

    try {
      const res = await fetch(`${API_BASE}/api/restaurant/orders?take=50`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setOrders(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setLoadError(String(e?.message ?? e ?? "Error cargando pedidos"));
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inProgress = useMemo(() => orders.filter((o) => o.status !== "DELIVERED"), [orders]);
  const delivered = useMemo(() => orders.filter((o) => o.status === "DELIVERED"), [orders]);

  const inProgressSorted = useMemo(() => {
    const copy = [...inProgress];
    copy.sort((a, b) => {
      const sa = STATUS_ORDER_IN_PROGRESS[a.status] ?? 50;
      const sb = STATUS_ORDER_IN_PROGRESS[b.status] ?? 50;
      if (sa !== sb) return sa - sb;

      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      // Dentro del mismo estado: más antiguo primero (operativo)
      return ta - tb;
    });
    return copy;
  }, [inProgress]);

  const deliveredSorted = useMemo(() => {
    const copy = [...delivered];
    copy.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      // Entregados: más reciente primero
      return tb - ta;
    });
    return copy;
  }, [delivered]);

  async function markDeliveredByCode() {
    setMessage(null);

    if (normalizedCode.length < 3) {
      setMessage({ type: "error", text: "Introduce un código válido (solo números)." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/restaurant/orders/mark-delivered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setCode("");
      setMessage({
        type: "ok",
        text: json?.alreadyDelivered ? "Ese pedido ya estaba entregado." : "Pedido marcado como ENTREGADO.",
      });

      await loadOrders();
    } catch (e: any) {
      setMessage({ type: "error", text: String(e?.message ?? e ?? "Error marcando entregado") });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    markDeliveredByCode();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Pedidos</p>
        <h1 className="text-3xl font-bold text-slate-900">Estados en tiempo real</h1>
        <p className="text-sm text-slate-600">
          Para evitar errores, <span className="font-semibold">la entrega se confirma introduciendo el código</span> que
          enseña el cliente.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">En curso</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inProgress.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Entregados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{delivered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estado</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {loading ? "Cargando" : refreshing ? "Actualizando" : "Listo"}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-700">Código de recogida</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="Ej. 054128"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-300"
            />
            <p className="mt-1 text-xs text-slate-500">Solo números. Se valida al confirmar.</p>
          </div>

          <button
            type="submit"
            disabled={refreshing}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 active:opacity-90 disabled:opacity-60"
          >
            Marcar como entregado
          </button>

          <button
            type="button"
            onClick={() => loadOrders()}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? "Actualizando" : "Actualizar"}
          </button>
        </form>

        {message && (
          <div
            className={[
              "mt-3 rounded-xl px-3 py-2 text-sm",
              message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        {loadError && (
          <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Error cargando pedidos: {loadError}
          </div>
        )}
      </Card>

      {/* EN CURSO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">En curso</h2>
          <p className="text-xs text-slate-500">{inProgressSorted.length} pedidos</p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card className="p-4">
              <p className="text-sm text-slate-600">Cargando pedidos</p>
            </Card>
          ) : inProgressSorted.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-slate-600">No hay pedidos en curso.</p>
            </Card>
          ) : (
            inProgressSorted.map((o) => (
              <Card key={o.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={o.menu?.title ?? "Pedido"}>
                    {o.menu?.title ?? "Pedido"}{" "}
                    <span className="text-xs font-normal text-slate-500" title={o.id}>
                      ({shortId(o.id)})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.customerName} · {formatDateTime(o.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Código: <span className="font-semibold text-slate-700">{o.code}</span>
                    {o.restaurant?.name ? <span className="ml-2 text-slate-400">· {o.restaurant.name}</span> : null}
                  </p>
                </div>
                <Chip>{STATUS_LABEL[o.status]}</Chip>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* ENTREGADOS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Entregados</h2>
          <button
            type="button"
            onClick={() => setShowDelivered((v) => !v)}
            className="text-xs font-semibold text-slate-900 underline decoration-slate-200 underline-offset-4 hover:decoration-slate-400"
          >
            {showDelivered ? "Ocultar" : "Ver"} ({deliveredSorted.length})
          </button>
        </div>

        {showDelivered ? (
          <div className="grid gap-4">
            {deliveredSorted.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-slate-600">Todavía no hay entregados.</p>
              </Card>
            ) : (
              deliveredSorted.map((o) => (
                <Card key={o.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate" title={o.menu?.title ?? "Pedido"}>
                      {o.menu?.title ?? "Pedido"}{" "}
                      <span className="text-xs font-normal text-slate-500" title={o.id}>
                        ({shortId(o.id)})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.customerName} · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Código: <span className="font-semibold text-slate-700">{o.code}</span>
                      {o.restaurant?.name ? <span className="ml-2 text-slate-400">· {o.restaurant.name}</span> : null}
                    </p>
                  </div>
                  <Chip>{STATUS_LABEL[o.status]}</Chip>
                </Card>
              ))
            )}
          </div>
        ) : null}
      </section>
    </section>
  );
}