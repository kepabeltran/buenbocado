"use client";

function kickToLogin() {
  try {
    localStorage.removeItem("bb_admin_token");
    localStorage.removeItem("bb_admin_user");
  } catch {}
  if (typeof window !== "undefined") window.location.replace("/admin/login");
}

function getTokenOrKick() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("bb_admin_token");
  if (!t) { window.location.replace("/admin/login"); return null; }
  return t;
}


import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type SettlementDto = {
  id: string;
  restaurantId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalOrdersCents: number;
  totalOrders: number;
  platformFeeCents: number;
  netToRestaurantCents: number;
  commissionBps: number;
  notes: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  restaurant: { id: string; name: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  PAID: "Pagada",
  DISPUTED: "Disputada",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISPUTED: "bg-rose-50 text-rose-700 border-rose-200",
};

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("bb_admin_token") : null;
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getLastWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Generate form
  const defaultRange = getLastWeekRange();
  const [genStart, setGenStart] = useState(defaultRange.start);
  const [genEnd, setGenEnd] = useState(defaultRange.end);
  const [generating, setGenerating] = useState(false);

  // Status change modal
  const [changing, setChanging] = useState<SettlementDto | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Detail modal
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(async () => {
    const token = getTokenOrKick();
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch(API_BASE + "/api/admin/settlements?take=100", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setSettlements(json.data || []);
      setTotal(json.total || 0);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  async function generate() {
    const token = getTokenOrKick();
    if (!token) return;
    setGenerating(true);
    setMsg(null);

    try {
      const res = await fetch(API_BASE + "/api/admin/settlements/generate", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: new Date(genStart).toISOString(),
          periodEnd: new Date(genEnd).toISOString(),
        }),
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setMsg({ type: "ok", text: json.created > 0 ? json.created + " liquidaciones generadas" : "No hay pedidos pendientes en este periodo" });
      await load();
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setGenerating(false);
    }
  }

  async function changeStatus() {
    if (!changing || !newStatus) return;
    const token = getTokenOrKick();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/admin/settlements/" + changing.id + "/status", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setMsg({ type: "ok", text: "Estado actualizado a " + (STATUS_LABELS[newStatus] || newStatus) });
      setChanging(null);
      setNewStatus("");
      setNotes("");
      await load();
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    }
  }

  async function viewDetail(s: SettlementDto) {
    const token = getTokenOrKick();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/admin/settlements/" + s.id, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setDetail(json.data);
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Liquidaciones</h1>
        <p className="text-sm text-zinc-500">Genera y gestiona liquidaciones por periodo</p>
      </div>

      {/* Generate form */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">Desde</span>
          <input type="date" value={genStart} onChange={(e) => setGenStart(e.target.value)}
            className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">Hasta</span>
          <input type="date" value={genEnd} onChange={(e) => setGenEnd(e.target.value)}
            className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
        </label>
        <button onClick={generate} disabled={generating}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {generating ? "Generando…" : "Generar liquidaciones"}
        </button>
      </div>

      {msg && (
        <div className={"rounded-xl px-3 py-2 text-sm font-medium " + (msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
          {msg.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay liquidaciones aún.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Estado</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Periodo</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Pedidos</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Total ventas</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Comisión</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Neto restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2">
                    <span className={"inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + (STATUS_COLORS[s.status] || "")}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{s.restaurant?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(s.periodStart)} → {formatDate(s.periodEnd)}</td>
                  <td className="px-3 py-2 text-xs font-semibold">{s.totalOrders}</td>
                  <td className="px-3 py-2 text-xs">{formatMoney(s.totalOrdersCents)}</td>
                  <td className="px-3 py-2 text-xs">{formatMoney(s.platformFeeCents)} ({(s.commissionBps / 100).toFixed(1)}%)</td>
                  <td className="px-3 py-2 text-xs font-semibold">{formatMoney(s.netToRestaurantCents)}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button onClick={() => viewDetail(s)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Ver
                    </button>
                    <button onClick={() => { setChanging(s); setNewStatus(""); setNotes(""); }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Estado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetail(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900">Detalle de liquidación</h2>
            <p className="text-sm text-zinc-500">{detail.restaurant?.name} · {formatDate(detail.periodStart)} → {formatDate(detail.periodEnd)}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Total ventas</p>
                <p className="text-lg font-bold">{formatMoney(detail.totalOrdersCents)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Comisión BuenBocado</p>
                <p className="text-lg font-bold">{formatMoney(detail.platformFeeCents)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-zinc-500">Neto restaurante</p>
                <p className="text-lg font-bold text-emerald-700">{formatMoney(detail.netToRestaurantCents)}</p>
              </div>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Pedidos ({detail.orders?.length ?? 0})</h3>
            <div className="mt-2 max-h-60 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50">
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
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change status modal */}
      {changing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setChanging(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900">Cambiar estado</h2>
            <p className="text-sm text-zinc-500">{changing.restaurant?.name} · Estado actual: {STATUS_LABELS[changing.status] || changing.status}</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-zinc-700">Nuevo estado</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                  <option value="">Selecciona…</option>
                  {["DRAFT", "CONFIRMED", "PAID", "DISPUTED"].filter((s) => s !== changing.status).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-700">Notas</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" rows={2} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setChanging(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">Cancelar</button>
              <button onClick={changeStatus} disabled={!newStatus}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
