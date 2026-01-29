"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";

type OrderStatus = "CREATED" | "PREPARING" | "READY" | "DELIVERED";

type OrderDto = {
  id: string;
  status: OrderStatus;
  code: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;

  // --- contabilidad (liquidaciones) ---
  totalCents?: number | null;
  commissionBpsAtPurchase?: number | null;
  platformFeeCents?: number | null;
  netToRestaurantCents?: number | null;
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
  return id.slice(-6);
}


function formatMoney(cents: number | null | undefined, currency: string) {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function formatBps(bps: number | null | undefined) {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(2)}%`;
}
export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true); // solo primera carga
  const [refreshing, setRefreshing] = useState(false); // manual/poll
  const [loadError, setLoadError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);

  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const inFlightRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

  

  const RESTAURANT_ID_ENV = (process.env.NEXT_PUBLIC_RESTAURANT_ID || "").trim();

const inProgress = useMemo(() => {
    const list = orders.filter((o) => o.status !== "DELIVERED");
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }, [orders]);

  const delivered = useMemo(() => {
    const list = orders.filter((o) => o.status === "DELIVERED");
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [orders]);

  function focusCode(select: boolean = true) {
    const el = codeInputRef.current;
    if (!el) return;
    el.focus();
    if (select) el.select();
  }

  const loadOrders = useCallback(
    async (opts?: { initial?: boolean; focusAfter?: boolean; selectAfter?: boolean }) => {
      const initial = Boolean(opts?.initial);

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (initial) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await fetch(`${API_BASE}/api/restaurant/orders?take=200`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = json?.message || json?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        setOrders(Array.isArray(json?.data) ? json.data : []);
        setLoadError(null);

        if (opts?.focusAfter) {
          setTimeout(() => focusCode(Boolean(opts?.selectAfter)), 0);
        }
      } catch (e: any) {
        setLoadError(String(e?.message ?? e ?? "Error cargando pedidos"));
      } finally {
        if (initial) setLoading(false);
        else setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [API_BASE]
  );

  useEffect(() => {
    loadOrders({ initial: true, focusAfter: true, selectAfter: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const ms = message.type === "ok" ? 1600 : 2400;
    const t = setTimeout(() => setMessage(null), ms);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    const stop = () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const start = () => {
      stop();
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      pollTimerRef.current = window.setInterval(() => {
        loadOrders();
      }, 10000);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadOrders();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [loadOrders]);

  const normalizedCode = useMemo(() => code.replace(/\D/g, ""), [code]);

  async function markDeliveredByCode() {
    setMessage(null);

    if (normalizedCode.length < 3) {
      setMessage({ type: "error", text: "Introduce un código válido (solo números)." });
      focusCode(true);
      return;
    }

    try {
            const endpoint = RESTAURANT_ID_ENV
        ? `${API_BASE}/api/restaurants/${encodeURIComponent(RESTAURANT_ID_ENV)}/orders/mark-delivered`
        : `${API_BASE}/api/restaurant/orders/mark-delivered`;

      const res = await fetch(endpoint, {
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

      await loadOrders({ focusAfter: true, selectAfter: true });
    } catch (e: any) {
      setMessage({ type: "error", text: String(e?.message ?? e ?? "Error marcando entregado") });
      focusCode(true);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    markDeliveredByCode();
  }

  const topStatus = useMemo(() => {
    if (loading) return "Cargando";
    if (loadError) return "Error";
    if (refreshing) return "Actualizando";
    return "Listo";
  }, [loading, loadError, refreshing]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Pedidos</p>
        <h1 className="text-3xl font-bold text-slate-900">Estados en tiempo real</h1>
        <p className="text-sm text-slate-600">
          Para evitar errores, la entrega se confirma introduciendo el <span className="font-semibold">código</span>{" "}
          que enseña el cliente.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/r/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 active:opacity-90"
        >
          Crear oferta
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">En curso</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inProgress.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entregados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{delivered.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{topStatus}</p>
        </Card>
      </div>

      <Card className="p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-700">Código de recogida</label>
            <input
              ref={codeInputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onFocus={(e) => e.currentTarget.select()}
              inputMode="numeric"
              pattern="\d*"
              autoComplete="one-time-code"
              enterKeyHint="done"
              placeholder="Ej. 054128"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-slate-300"
            />
            <p className="mt-1 text-xs text-slate-500">Solo números. Enter = confirmar.</p>
          </div>

          <button
            type="submit"
            disabled={loading || normalizedCode.length === 0}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 active:opacity-90 disabled:opacity-50"
          >
            Marcar como entregado
          </button>

          <button
            type="button"
            onClick={() => loadOrders()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >Refrescar</button><span className="text-xs opacity-70 ml-2">Se actualiza solo</span>
        </form>

        {message && (
          <div
            className={[
              "mt-3 rounded-xl px-3 py-2 text-sm font-medium",
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

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-slate-900">En curso</h2>
          <p className="text-xs text-slate-500">{inProgress.length} pedidos</p>
        </div>

        {loading ? (
          <Card className="p-4">
            <p className="text-sm text-slate-600">Cargando pedidos</p>
          </Card>
        ) : inProgress.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-slate-600">No hay pedidos en curso.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {inProgress.map((o) => (
              <Card key={o.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {o.menu?.title ?? "Pedido"}{" "}
                    <span className="text-xs font-normal text-slate-500">({shortId(o.id)})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.customerName} · {formatDateTime(o.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Código: <span className="font-semibold text-slate-700">{o.code}</span>
                    {o.restaurant?.name ? <span className="ml-2 text-slate-400">· {o.restaurant.name}</span> : null}
                  </p>
                    {(o.totalCents != null || o.platformFeeCents != null || o.netToRestaurantCents != null || o.commissionBpsAtPurchase != null) ? (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">Total</span>: {formatMoney(o.totalCents ?? o.menu?.priceCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">Fee</span>: {formatMoney(o.platformFeeCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">Neto</span>: {formatMoney(o.netToRestaurantCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">%</span>: {formatBps(o.commissionBpsAtPurchase)}
                      </p>
                    ) : null}
                </div>
                <Chip>{STATUS_LABEL[o.status]}</Chip>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Entregados</h2>
          <button
            type="button"
            onClick={() => setShowDelivered((v) => !v)}
            className="text-xs font-semibold text-slate-900 hover:opacity-80"
          >
            {showDelivered ? "Ocultar" : `Ver (${delivered.length})`}
          </button>
        </div>

        {showDelivered ? (
          delivered.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-slate-600">Todavía no hay entregados.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {delivered.map((o) => (
                <Card key={o.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {o.menu?.title ?? "Pedido"}{" "}
                      <span className="text-xs font-normal text-slate-500">({shortId(o.id)})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.customerName} · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Código: <span className="font-semibold text-slate-700">{o.code}</span>
                      {o.restaurant?.name ? <span className="ml-2 text-slate-400">· {o.restaurant.name}</span> : null}
                    </p>
                    {(o.totalCents != null || o.platformFeeCents != null || o.netToRestaurantCents != null || o.commissionBpsAtPurchase != null) ? (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">Total</span>: {formatMoney(o.totalCents ?? o.menu?.priceCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">Fee</span>: {formatMoney(o.platformFeeCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">Neto</span>: {formatMoney(o.netToRestaurantCents ?? null, o.menu?.currency ?? "EUR")}
                        {" · "}
                        <span className="font-semibold">%</span>: {formatBps(o.commissionBpsAtPurchase)}
                      </p>
                    ) : null}
                  </div>
                  <Chip>{STATUS_LABEL[o.status]}</Chip>
                </Card>
              ))}
            </div>
          )
        ) : null}
      </section>
    </section>
  );
}
