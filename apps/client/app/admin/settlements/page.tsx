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
  if (!t) {
    window.location.replace("/admin/login");
    return null;
  }
  return t;
}

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type SettlementDto = {
  id: string;
  restaurantId: string;
  periodStart: string;
  periodEnd: string; // stored as end-exclusive
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

type RestaurantOption = { id: string; name: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  PAID: "Pagada",
  DISPUTED: "Disputada",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 border-zinc-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISPUTED: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDateFromDate(d: Date) {
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return formatDateFromDate(d);
}

function percent(n: number) {
  if (!isFinite(n)) return "0.0%";
  return n.toFixed(1) + "%";
}

function effectiveCommissionPct(totalOrdersCents: number, platformFeeCents: number) {
  if (!totalOrdersCents) return 0;
  return (platformFeeCents / totalOrdersCents) * 100;
}

function parseLocalStartOfDay(dateStr: string) {
  // dateStr is YYYY-MM-DD
  return new Date(dateStr + "T00:00:00");
}

function toIsoLocalStart(dateStr: string) {
  const d = parseLocalStartOfDay(dateStr);
  return d.toISOString();
}

function toIsoLocalEndExclusive(dateStr: string) {
  // inclusive end date -> end exclusive at next day 00:00 local
  const d = parseLocalStartOfDay(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function getLastWeekRangeLocal() {
  const now = new Date();
  const end = new Date(now);
  // today local
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function periodEndInclusive(periodEndIso: string) {
  // If stored as midnight boundary, show previous day as inclusive.
  const end = new Date(periodEndIso);
  if (isNaN(end.getTime())) return periodEndIso;

  const isMidnight =
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0;

  if (isMidnight) {
    const incl = new Date(end);
    incl.setDate(incl.getDate() - 1);
    return incl;
  }
  return end;
}

function formatPeriod(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const endIncl = periodEndInclusive(endIso);
  if (isNaN(start.getTime()) || isNaN(endIncl.getTime())) return formatDate(startIso) + " -> " + formatDate(endIso);
  return formatDateFromDate(start) + " -> " + formatDateFromDate(endIncl);
}

function allowedNextStatuses(current: string) {
  // UI guardrails (API is still the source of truth)
  const c = String(current || "").toUpperCase();
  if (c === "DRAFT") return ["CONFIRMED", "DISPUTED"];
  if (c === "CONFIRMED") return ["PAID", "DISPUTED"];
  if (c === "DISPUTED") return ["CONFIRMED", "PAID"];
  return []; // PAID: no changes from UI
}

function escapeCsv(v: any) {
  const s = String(v ?? "");
  const needs = s.includes(",") || s.includes("\n") || s.includes('"');
  const esc = s.replace(/"/g, '""');
  return needs ? `"${esc}"` : esc;
}

function downloadTextFile(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [total, setTotal] = useState(0);
  const [take] = useState(50);
  const [skip, setSkip] = useState(0);

  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [restaurantFilter, setRestaurantFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Generate form
  const defaultRange = getLastWeekRangeLocal();
  const [genStart, setGenStart] = useState(defaultRange.start);
  const [genEnd, setGenEnd] = useState(defaultRange.end);
  const [generating, setGenerating] = useState(false);

  // Status change modal
  const [changing, setChanging] = useState<SettlementDto | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Detail modal
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filteredSettlements = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return settlements;
    return settlements.filter((s) => {
      const rn = (s.restaurant?.name ?? "").toLowerCase();
      const id = s.id.toLowerCase();
      const n = (s.notes ?? "").toLowerCase();
      return rn.includes(q) || id.includes(q) || n.includes(q);
    });
  }, [settlements, search]);

  const pageInfo = useMemo(() => {
    const from = skip + 1;
    const to = Math.min(skip + take, total);
    return { from, to };
  }, [skip, take, total]);

  const loadRestaurants = useCallback(async () => {
    const token = getTokenOrKick();
    if (!token) return;
    try {
      const res = await fetch(API_BASE + "/api/admin/restaurants?take=200", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      const rows = (json.data || []) as any[];
      const opts = rows
        .map((r) => ({ id: String(r.id), name: String(r.name ?? r.restaurantName ?? "Restaurante") }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
      setRestaurants(opts);
    } catch {
      // non-blocking
    }
  }, []);

  const load = useCallback(async () => {
    const token = getTokenOrKick();
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("take", String(take));
      params.set("skip", String(skip));
      if (statusFilter) params.set("status", statusFilter);
      if (restaurantFilter) params.set("restaurantId", restaurantFilter);

      const res = await fetch(API_BASE + "/api/admin/settlements?" + params.toString(), {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }
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
  }, [skip, statusFilter, restaurantFilter, take]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    // When filters change, reset pagination
    setSkip(0);
  }, [statusFilter, restaurantFilter]);

  async function generate() {
    const token = getTokenOrKick();
    if (!token) return;

    // basic validation
    const start = parseLocalStartOfDay(genStart);
    const endIncl = parseLocalStartOfDay(genEnd);
    if (isNaN(start.getTime()) || isNaN(endIncl.getTime())) {
      setMsg({ type: "error", text: "Fechas invalidas" });
      return;
    }
    if (endIncl < start) {
      setMsg({ type: "error", text: "El campo Hasta debe ser igual o posterior a Desde" });
      return;
    }

    setGenerating(true);
    setMsg(null);

    try {
      const res = await fetch(API_BASE + "/api/admin/settlements/generate", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: toIsoLocalStart(genStart),
          periodEnd: toIsoLocalEndExclusive(genEnd), // inclusive end -> exclusive boundary
        }),
      });
      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setMsg({
        type: "ok",
        text: json.created > 0 ? json.created + " liquidaciones generadas" : "No hay pedidos pendientes en este periodo",
      });
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
      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }
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

    setDetailLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/admin/settlements/" + s.id, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setDetail(json.data);
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setDetailLoading(false);
    }
  }

  function exportDetailCsv() {
    if (!detail) return;

    const restName = detail.restaurant?.name ?? "";
    const endIncl = periodEndInclusive(detail.periodEnd);
    const periodStartStr = formatDate(detail.periodStart);
    const periodEndStr = formatDateFromDate(endIncl);

    const header = [
      "settlementId",
      "restaurant",
      "periodStart",
      "periodEndInclusive",
      "orderId",
      "code",
      "offer",
      "customer",
      "totalEUR",
      "platformFeeEUR",
      "deliveredAt",
    ];

    const rows = (detail.orders || []).map((o: any) => {
      const total = (o.totalCents ?? 0) / 100;
      const fee = (o.platformFeeCents ?? 0) / 100;
      return [
        detail.id,
        restName,
        periodStartStr,
        periodEndStr,
        o.id,
        o.code,
        o.menu?.title ?? "",
        o.customerName ?? "",
        total.toFixed(2),
        fee.toFixed(2),
        o.deliveredAt ? formatDate(o.deliveredAt) : "",
      ].map(escapeCsv).join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const safeName = (restName || "restaurante").replace(/[^a-zA-Z0-9_-]+/g, "_");
    downloadTextFile(`settlement_${safeName}_${detail.id}.csv`, csv, "text/csv;charset=utf-8");
  }

  const totalsForShown = useMemo(() => {
    const totalSales = filteredSettlements.reduce((acc, s) => acc + (s.totalOrdersCents ?? 0), 0);
    const totalFee = filteredSettlements.reduce((acc, s) => acc + (s.platformFeeCents ?? 0), 0);
    const totalNet = filteredSettlements.reduce((acc, s) => acc + (s.netToRestaurantCents ?? 0), 0);
    return { totalSales, totalFee, totalNet };
  }, [filteredSettlements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Liquidaciones</h1>
        <p className="text-sm text-zinc-500">Genera y gestiona liquidaciones por periodo</p>
      </div>

      {/* Generate form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Desde</span>
            <input
              type="date"
              value={genStart}
              onChange={(e) => setGenStart(e.target.value)}
              className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Hasta (incl.)</span>
            <input
              type="date"
              value={genEnd}
              onChange={(e) => setGenEnd(e.target.value)}
              className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar liquidaciones"}
          </button>
          <span className="text-xs text-zinc-500">
            Se incluyen pedidos entregados hasta el final del dia seleccionado.
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Estado</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-44 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="PAID">Pagada</option>
              <option value="DISPUTED">Disputada</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Restaurante</span>
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="mt-1 w-72 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block flex-1 min-w-[220px]">
            <span className="text-xs font-semibold text-zinc-700">Buscar</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, ID, notas..."
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <button
            onClick={() => load()}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Recargar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
          <div>
            Mostrando {pageInfo.from}-{pageInfo.to} de {total} (pagina {Math.floor(skip / take) + 1})
          </div>
          <div className="flex flex-wrap gap-3">
            <span>Total ventas: <b>{formatMoney(totalsForShown.totalSales)}</b></span>
            <span>Comision: <b>{formatMoney(totalsForShown.totalFee)}</b></span>
            <span>Neto: <b>{formatMoney(totalsForShown.totalNet)}</b></span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setSkip((s) => Math.max(0, s - take))}
            disabled={skip === 0}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-50 hover:bg-zinc-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setSkip((s) => (skip + take < total ? s + take : s))}
            disabled={skip + take >= total}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-50 hover:bg-zinc-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={
            "rounded-xl px-3 py-2 text-sm font-medium " +
            (msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
          }
        >
          {msg.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : filteredSettlements.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay liquidaciones con estos filtros.</p>
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
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Comision</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Neto restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.map((s) => {
                const eff = effectiveCommissionPct(s.totalOrdersCents, s.platformFeeCents);
                const cfg = (s.commissionBps ?? 0) / 100;
                const showCfg = Math.abs(eff - cfg) >= 0.2; // show if meaningful delta
                return (
                  <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + (STATUS_COLORS[s.status] || "")
                        }
                      >
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{s.restaurant?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{formatPeriod(s.periodStart, s.periodEnd)}</td>
                    <td className="px-3 py-2 text-xs font-semibold">{s.totalOrders}</td>
                    <td className="px-3 py-2 text-xs">{formatMoney(s.totalOrdersCents)}</td>
                    <td className="px-3 py-2 text-xs">
                      <div>{formatMoney(s.platformFeeCents)} ({percent(eff)})</div>
                      {showCfg && <div className="text-[11px] text-zinc-500">config {percent(cfg)}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold">{formatMoney(s.netToRestaurantCents)}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button
                        onClick={() => viewDetail(s)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => {
                          setChanging(s);
                          setNewStatus("");
                          setNotes("");
                        }}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Estado
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-3xl max-h-[80vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Detalle de liquidacion</h2>
                <p className="text-sm text-zinc-500">
                  {detail.restaurant?.name} · {formatPeriod(detail.periodStart, detail.periodEnd)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportDetailCsv}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => setDetail(null)}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {detailLoading ? (
              <p className="mt-4 text-sm text-zinc-500">Cargando detalle...</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Total ventas</p>
                    <p className="text-lg font-bold">{formatMoney(detail.totalOrdersCents)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Comision BuenBocado</p>
                    <p className="text-lg font-bold">
                      {formatMoney(detail.platformFeeCents)} ({percent(effectiveCommissionPct(detail.totalOrdersCents, detail.platformFeeCents))})
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-zinc-500">Neto restaurante</p>
                    <p className="text-lg font-bold text-emerald-700">{formatMoney(detail.netToRestaurantCents)}</p>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-zinc-900">Pedidos ({detail.orders?.length ?? 0})</h3>
                <div className="mt-2 max-h-72 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-2 py-1">Codigo</th>
                        <th className="px-2 py-1">Oferta</th>
                        <th className="px-2 py-1">Cliente</th>
                        <th className="px-2 py-1">Total</th>
                        <th className="px-2 py-1">Comision</th>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Change status modal */}
      {changing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setChanging(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900">Cambiar estado</h2>
            <p className="text-sm text-zinc-500">
              {changing.restaurant?.name} · Estado actual: {STATUS_LABELS[changing.status] || changing.status}
            </p>

            {allowedNextStatuses(changing.status).length === 0 ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                Esta liquidacion ya esta en un estado final (PAID) desde la UI.
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-zinc-700">Nuevo estado</span>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona...</option>
                      {allowedNextStatuses(changing.status).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s] || s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-zinc-700">Notas</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                      rows={2}
                    />
                  </label>

                  {newStatus === "PAID" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Aviso: Marca como PAID solo si ya has realizado el pago al restaurante.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setChanging(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={changeStatus}
                    disabled={!newStatus}
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
