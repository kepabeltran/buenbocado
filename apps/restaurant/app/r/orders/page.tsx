"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";
import { useAuth } from "../../_auth/AuthProvider";
import QRScanner from "../_components/QRScanner";

type OrderStatus = "CREATED" | "PREPARING" | "READY" | "DELIVERED";

type OrderDto = {
  id: string;
  status: OrderStatus;
  code: string;
  createdAt: string;
  customerName: string;
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
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Creado",
  PREPARING: "Preparando",
  READY: "Listo",
  DELIVERED: "Entregado",
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMoney(cents: number | null | undefined, currency = "EUR") {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function shortId(id: string) {
  return id ? id.slice(-6) : "";
}

export default function OrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const inFlightRef = useRef(false);

  const inProgress = useMemo(() => {
    return orders
      .filter((o) => o.status !== "DELIVERED")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const delivered = useMemo(() => {
    return orders
      .filter((o) => o.status === "DELIVERED")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  function focusCode(select = true) {
    const el = codeInputRef.current;
    if (!el) return;
    el.focus();
    if (select) el.select();
  }

  const loadOrders = useCallback(
    async (opts?: { initial?: boolean }) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const token = getToken();
      if (!token) { inFlightRef.current = false; return; }

      if (opts?.initial) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await fetch(API_BASE + "/api/restaurant/me/orders?take=200", {
          headers: { Authorization: "Bearer " + token },
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "HTTP " + res.status);
        setOrders(Array.isArray(json?.data) ? json.data : []);
        setLoadError(null);
      } catch (e: any) {
        setLoadError(String(e?.message || e));
      } finally {
        if (opts?.initial) setLoading(false);
        else setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [getToken]
  );

  useEffect(() => {
    loadOrders({ initial: true });
  }, [loadOrders]);

  // Auto-refresh cada 10s
  useEffect(() => {
    const id = setInterval(() => loadOrders(), 10000);
    return () => clearInterval(id);
  }, [loadOrders]);

  useEffect(() => {
    if (!message) return;
    const ms = message.type === "ok" ? 1600 : 2400;
    const t = setTimeout(() => setMessage(null), ms);
    return () => clearTimeout(t);
  }, [message]);

  const normalizedCode = useMemo(() => code.replace(/\D/g, ""), [code]);

  async function markDelivered(directCode?: string) {
    setMessage(null);
    const useCode = directCode || normalizedCode;
    if (useCode.length < 3) {
      focusCode(true);
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/orders/mark-delivered", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: useCode }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "HTTP " + res.status);

      setCode("");
      setMessage({
        type: "ok",
        text: json?.alreadyDelivered
          ? "Ese pedido ya estaba entregado."
          : "✅ Pedido marcado como ENTREGADO.",
      });
      await loadOrders();
      focusCode(true);
    } catch (e: any) {
      setMessage({ type: "error", text: String(e?.message || e) });
      focusCode(true);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    markDelivered();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Pedidos</p>
        <h1 className="text-3xl font-bold text-slate-900">Estados en tiempo real</h1>
        <p className="text-sm text-zinc-500">
          Confirma la entrega introduciendo el código del cliente.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/r/new"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Crear oferta
        </Link>
        <Link
          href="/r"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Panel
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">En curso</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inProgress.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Entregados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{delivered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Estado</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {loading ? "Cargando" : loadError ? "Error" : refreshing ? "Actualizando" : "Listo"}
          </p>
        </Card>
      </div>

      {/* Validate code */}
      <Card className="p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-700">Código de recogida</label>
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
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-zinc-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading || normalizedCode.length === 0}
            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            Marcar entregado
          </button>
          <button
            type="button"
            onClick={() => loadOrders()}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Refrescar
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Escanear QR del cliente
        </button>
        {showScanner && (
          <QRScanner
            onScan={(scannedCode) => {
              setShowScanner(false);
              const cleaned = scannedCode.replace(/\D/g, "");
              if (cleaned) {
                setCode(cleaned);
                markDelivered(cleaned);
              }
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {message && (
          <div
            className={
              "mt-3 rounded-xl px-3 py-2 text-sm font-medium " +
              (message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
            }
          >
            {message.text}
          </div>
        )}
        {loadError && (
          <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Error: {loadError}
          </div>
        )}
      </Card>

      {/* In progress */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-slate-900">En curso</h2>
          <p className="text-xs text-zinc-500">{inProgress.length} pedidos</p>
        </div>

        {loading ? (
          <Card className="p-4"><p className="text-sm text-zinc-500">Cargando…</p></Card>
        ) : inProgress.length === 0 ? (
          <Card className="p-4"><p className="text-sm text-zinc-500">No hay pedidos en curso.</p></Card>
        ) : (
          <div className="grid gap-3">
            {inProgress.map((o) => (
              <Card key={o.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {o.menu?.title ?? "Pedido"}{" "}
                    <span className="text-xs font-normal text-zinc-500">({shortId(o.id)})</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {o.customerName} · {formatDateTime(o.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Código: <span className="font-semibold text-zinc-700">{o.code}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Total: {formatMoney(o.totalCents, o.menu?.currency)} · Neto: {formatMoney(o.netToRestaurantCents, o.menu?.currency)}
                  </p>
                </div>
                <Chip>{STATUS_LABEL[o.status]}</Chip>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Delivered */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Entregados</h2>
          <button
            type="button"
            onClick={() => setShowDelivered((v) => !v)}
            className="text-xs font-semibold text-zinc-900 hover:opacity-80"
          >
            {showDelivered ? "Ocultar" : "Ver (" + delivered.length + ")"}
          </button>
        </div>

        {showDelivered && (
          delivered.length === 0 ? (
            <Card className="p-4"><p className="text-sm text-zinc-500">No hay entregados.</p></Card>
          ) : (
            <div className="grid gap-3">
              {delivered.map((o) => (
                <Card key={o.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {o.menu?.title ?? "Pedido"}{" "}
                      <span className="text-xs font-normal text-zinc-500">({shortId(o.id)})</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {o.customerName} · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Total: {formatMoney(o.totalCents, o.menu?.currency)} · Neto: {formatMoney(o.netToRestaurantCents, o.menu?.currency)}
                    </p>
                  </div>
                  <Chip>{STATUS_LABEL[o.status]}</Chip>
                </Card>
              ))}
            </div>
          )
        )}
      </section>
    </section>
  );
}
