"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@buenbocado/ui";
import { useAuth } from "../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type SettlementDto = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalOrdersCents: number;
  totalOrders: number;
  platformFeeCents: number;
  netToRestaurantCents: number;
  commissionBps: number;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Pendiente",
  CONFIRMED: "Confirmada",
  PAID: "Pagada",
  DISPUTED: "En revisión",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-zinc-600",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISPUTED: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function RestaurantSettlementsPage() {
  const { getToken } = useAuth();
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/settlements", {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setSettlements(json.data || []);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  async function viewDetail(s: SettlementDto) {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/settlements/" + s.id, {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setDetail(json.data);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  // Totales
  const totalNet = settlements.reduce((s, x) => s + x.netToRestaurantCents, 0);
  const totalFees = settlements.reduce((s, x) => s + x.platformFeeCents, 0);
  const totalPaid = settlements.filter((s) => s.status === "PAID").reduce((s, x) => s + x.netToRestaurantCents, 0);
  const totalPending = totalNet - totalPaid;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Liquidaciones
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">Mis liquidaciones</h1>
        <p className="text-sm text-slate-400">Resumen de pagos por periodo</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link href="/r" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Panel
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total acumulado</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totalNet)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pagado</p>
          <p className="text-2xl font-bold text-emerald-700">{formatMoney(totalPaid)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pendiente</p>
          <p className="text-2xl font-bold text-amber-700">{formatMoney(totalPending)}</p>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <Card className="p-4"><p className="text-sm text-slate-400">Cargando…</p></Card>
      ) : error ? (
        <Card className="bg-rose-50 p-4 text-sm text-rose-700">{error}</Card>
      ) : settlements.length === 0 ? (
        <Card className="p-4"><p className="text-sm text-slate-400">Aún no hay liquidaciones.</p></Card>
      ) : (
        <div className="grid gap-3">
          {settlements.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(s.periodStart)} → {formatDate(s.periodEnd)}
                    </p>
                    <span className={"inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + (STATUS_COLORS[s.status] || "")}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {s.totalOrders} pedidos · Ventas: {formatMoney(s.totalOrdersCents)} · Comisión: {formatMoney(s.platformFeeCents)} ({(s.commissionBps / 100).toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-700">{formatMoney(s.netToRestaurantCents)}</p>
                  <button onClick={() => viewDetail(s)}
                    className="mt-1 text-xs font-semibold text-slate-400 hover:text-slate-900">
                    Ver detalle
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetail(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900">Detalle de liquidación</h2>
            <p className="text-sm text-slate-400">{formatDate(detail.periodStart)} → {formatDate(detail.periodEnd)}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Total ventas</p>
                <p className="text-lg font-bold">{formatMoney(detail.totalOrdersCents)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Comisión</p>
                <p className="text-lg font-bold">{formatMoney(detail.platformFeeCents)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-slate-400">Tu ingreso neto</p>
                <p className="text-lg font-bold text-emerald-700">{formatMoney(detail.netToRestaurantCents)}</p>
              </div>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Pedidos ({detail.orders?.length ?? 0})</h3>
            <div className="mt-2 max-h-60 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1">Código</th>
                    <th className="px-2 py-1">Oferta</th>
                    <th className="px-2 py-1">Cliente</th>
                    <th className="px-2 py-1">Total</th>
                    <th className="px-2 py-1">Comisión</th>
                    <th className="px-2 py-1">Entregado</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.orders || []).map((o: any) => (
                    <tr key={o.id} className="border-b border-zinc-50">
                      <td className="px-2 py-1 font-mono font-bold">{o.code}</td>
                      <td className="px-2 py-1">{o.menu?.title ?? "—"}</td>
                      <td className="px-2 py-1">{o.customerName}</td>
                      <td className="px-2 py-1">{formatMoney(o.totalCents ?? 0)}</td>
                      <td className="px-2 py-1">{formatMoney(o.platformFeeCents ?? 0)}</td>
                      <td className="px-2 py-1">{o.deliveredAt ? formatDate(o.deliveredAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDetail(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
