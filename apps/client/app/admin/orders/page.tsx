"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type OrderDto = {
  id: string;
  status: string;
  code: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  totalCents: number | null;
  platformFeeCents: number | null;
  commissionBpsAtPurchase: number | null;
  customerId: string | null;
  menu: {
    id: string;
    title: string;
    type: string;
    priceCents: number;
    currency: string;
    restaurant: { id: string; name: string } | null;
  } | null;
  customer: { id: string; name: string; email: string } | null;
  deliveredBy: { id: string; email: string } | null;
};

const STATUSES = ["ALL", "CREATED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "NOSHOW"];
const STATUS_LABELS: Record<string,string> = { ALL:"Todos", CREATED:"Creado", PREPARING:"Preparando", READY:"Listo", DELIVERED:"Entregado", CANCELLED:"Cancelado", NOSHOW:"No recogido" };
const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-amber-50 text-amber-700 border-amber-200",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  NOSHOW: "bg-red-50 text-red-700 border-red-200",
};

function formatMoney(cents: number | null, currency = "EUR") {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  // Modal para cambiar estado
  const [changing, setChanging] = useState<OrderDto | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [changeMsg, setChangeMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const token = getTokenOrKick();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("take", String(PAGE_SIZE));
      params.set("skip", String(page * PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(API_BASE + "/api/admin/orders?" + params.toString(), {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setOrders(json.data || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus() {
    if (!changing || !newStatus) return;
    const token = getTokenOrKick();
    if (!token) return;
    setChangeMsg(null);

    try {
      const res = await fetch(API_BASE + "/api/admin/orders/" + changing.id + "/status", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setChangeMsg({ type: "ok", text: json.data.oldStatus + " → " + json.data.newStatus });
      setChanging(null);
      setNewStatus("");
      setReason("");
      await load();
    } catch (e: any) {
      setChangeMsg({ type: "error", text: String(e?.message || e) });
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <p className="text-sm text-zinc-500">Supervisión global · {total} pedidos</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por código, nombre, email, ID…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-64 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className={
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                (statusFilter === s ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50")
              }
            >
              {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {changeMsg && (
        <div className={"rounded-xl px-3 py-2 text-sm font-medium " + (changeMsg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
          {changeMsg.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay pedidos con estos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Código</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Estado</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Oferta</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Cliente</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Total</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Fecha</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2 font-mono text-xs font-bold">{o.code}</td>
                  <td className="px-3 py-2">
                    <span className={"inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + (STATUS_COLORS[o.status] || "")}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{o.menu?.title ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{o.menu?.restaurant?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    <div>{o.customerName}</div>
                    <div className="text-zinc-400">{o.customerEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold">{formatMoney(o.totalCents, o.menu?.currency)}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{formatDate(o.createdAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => { setChanging(o); setNewStatus(""); setReason(""); setChangeMsg(null); }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Cambiar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-zinc-500">Pág. {page + 1} de {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal cambiar estado */}
      {changing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setChanging(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900">Cambiar estado</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pedido <span className="font-mono font-bold">{changing.code}</span> · {changing.menu?.title}
            </p>
            <p className="text-xs text-zinc-400">Estado actual: {changing.status}</p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-zinc-700">Nuevo estado</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona…</option>
                  {["CREATED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "NOSHOW"]
                    .filter((s) => s !== changing.status)
                    .map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-700">Motivo (auditoría)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Cliente solicitó cancelación por teléfono"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  rows={2}
                />
              </label>
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
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
