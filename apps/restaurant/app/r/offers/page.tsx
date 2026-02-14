"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";
import { useAuth } from "../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

const EDIT_WINDOW_MS = 10 * 60 * 1000;

type MenuDto = {
  id: string;
  title: string;
  description: string;
  type: "TAKEAWAY" | "DINEIN";
  priceCents: number;
  currency: string;
  quantity: number;
  availableFrom: string;
  availableTo: string;
  expiresAt: string;
  imageUrl: string | null;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
};

type Filter = "all" | "active" | "paused" | "expired";

function formatMoney(cents: number, currency = "EUR") {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(m: MenuDto) {
  if (m.isExpired) return { label: "Expirada", color: "bg-zinc-100 text-zinc-500" };
  if (m.quantity === 0) return { label: "Pausada", color: "bg-amber-50 text-amber-700 border-amber-200" };
  if (m.isActive) return { label: "Activa", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { label: "Programada", color: "bg-blue-50 text-blue-700 border-blue-200" };
}

function isEditable(m: MenuDto) {
  return Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;
}

function editRemainingLabel(m: MenuDto) {
  const remaining = EDIT_WINDOW_MS - (Date.now() - new Date(m.createdAt).getTime());
  if (remaining <= 0) return null;
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

export default function OffersPage() {
  const { getToken } = useAuth();
  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/menus", {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error cargando ofertas");
      setMenus(Array.isArray(json.data) ? json.data : []);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  // Tick every second to update edit countdown
  useEffect(() => {
    const hasEditable = menus.some(isEditable);
    if (!hasEditable) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [menus]);

  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => setActionMsg(null), 2500);
    return () => clearTimeout(t);
  }, [actionMsg]);

  async function doAction(menuId: string, action: "pause" | "activate" | "duplicate") {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/menus/" + menuId + "/" + action, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action === "activate" ? { quantity: 10 } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");

      const labels: Record<string, string> = {
        pause: "Oferta pausada",
        activate: "Oferta activada",
        duplicate: "Oferta duplicada",
      };
      setActionMsg({ type: "ok", text: labels[action] || "Hecho" });
      await load();
    } catch (e: any) {
      setActionMsg({ type: "error", text: String(e?.message || e) });
    }
  }

  const filtered = menus.filter((m) => {
    if (filter === "active") return m.isActive && m.quantity > 0;
    if (filter === "paused") return !m.isExpired && m.quantity === 0;
    if (filter === "expired") return m.isExpired;
    return true;
  });

  const filterBtn = (f: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(f)}
      className={
        "rounded-xl px-3 py-1.5 text-xs font-semibold transition " +
        (filter === f
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50")
      }
    >
      {label}
    </button>
  );

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Ofertas
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Mis ofertas</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterBtn("all", "Todas (" + menus.length + ")")}
        {filterBtn("active", "Activas")}
        {filterBtn("paused", "Pausadas")}
        {filterBtn("expired", "Expiradas")}
      </div>

      {/* Action message */}
      {actionMsg && (
        <div
          className={
            "rounded-xl px-3 py-2 text-sm font-medium " +
            (actionMsg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
          }
        >
          {actionMsg.text}
        </div>
      )}

      {/* List */}
      {loading ? (
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Cargando ofertas…</p>
        </Card>
      ) : error ? (
        <Card className="bg-rose-50 p-4 text-sm text-rose-700">{error}</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            {menus.length === 0
              ? "Aún no has creado ofertas."
              : "No hay ofertas con este filtro."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => {
            const badge = statusBadge(m);
            const canEdit = isEditable(m);
            const editTimer = editRemainingLabel(m);
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {m.title}
                      </h3>
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
                          badge.color
                        }
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {m.type === "TAKEAWAY" ? "Para llevar" : "En local"} ·{" "}
                      {formatMoney(m.priceCents, m.currency)} · Stock: {m.quantity}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(m.availableFrom)} → {formatDate(m.availableTo)}
                    </p>
                  </div>

                  {/* Right: image thumbnail */}
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="h-14 w-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* Editar — solo si quedan menos de 10 min */}
                  {canEdit && (
                    <Link
                      href={"/r/offers/" + m.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Editar
                      {editTimer && (
                        <span className="ml-1 font-mono text-blue-500">({editTimer})</span>
                      )}
                    </Link>
                  )}

                  {!m.isExpired && m.quantity > 0 && (
                    <button
                      type="button"
                      onClick={() => doAction(m.id, "pause")}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Pausar
                    </button>
                  )}
                  {!m.isExpired && m.quantity === 0 && (
                    <button
                      type="button"
                      onClick={() => doAction(m.id, "activate")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Activar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => doAction(m.id, "duplicate")}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Duplicar
                  </button>
                  {m.isExpired && (
                    <button
                      type="button"
                      onClick={() => doAction(m.id, "activate")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
