"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type OfferDto = {
  id: string;
  title: string;
  description: string;
  type: string;
  priceCents: number;
  currency: string;
  quantity: number;
  availableFrom: string;
  availableTo: string;
  expiresAt: string;
  imageUrl: string | null;
  isActive: boolean;
  isExpired: boolean;
  orderCount: number;
  createdAt: string;
  restaurant: { id: string; name: string } | null;
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "paused", label: "Pausadas" },
  { key: "expired", label: "Expiradas" },
];

function formatMoney(cents: number, currency = "EUR") {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bb_access_token");
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("take", String(PAGE_SIZE));
      params.set("skip", String(page * PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(API_BASE + "/api/admin/offers?" + params.toString(), {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setOffers(json.data || []);
      setTotal(json.total || 0);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  function statusBadge(o: OfferDto) {
    if (o.isExpired) return { label: "Expirada", cls: "bg-zinc-100 text-zinc-500" };
    if (o.quantity === 0) return { label: "Pausada", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    if (o.isActive) return { label: "Activa", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { label: "Programada", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ofertas</h1>
        <p className="text-sm text-zinc-500">Supervisión global · {total} ofertas</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por título o ID…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-64 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(0); }}
              className={
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                (statusFilter === f.key ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : offers.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay ofertas con estos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Estado</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Título</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Precio</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Stock</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Pedidos</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Disponible</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Creada</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => {
                const badge = statusBadge(o);
                return (
                  <tr key={o.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <span className={"inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + badge.cls}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs font-semibold">{o.title}</div>
                      <div className="text-xs text-zinc-400">{o.type}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{o.restaurant?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs font-semibold">{formatMoney(o.priceCents, o.currency)}</td>
                    <td className="px-3 py-2 text-xs">{o.quantity}</td>
                    <td className="px-3 py-2 text-xs font-semibold">{o.orderCount}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {formatDate(o.availableFrom)} → {formatDate(o.availableTo)}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{formatDate(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40">← Anterior</button>
          <span className="text-xs text-zinc-500">Pág. {page + 1} de {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
