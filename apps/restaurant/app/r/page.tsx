"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Stats = {
  activeMenus: number;
  pendingOrders: number;
  deliveredToday: number;
  salesTodayCents: number;
  totalOrders: number;
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function RestaurantDashboardPage() {
  const { user, getToken, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(API_BASE + "/api/restaurant/me/stats", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Error cargando stats");
        setStats(json.data);
        setError(null);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  return (
    <section className="space-y-6">
      {/* Header con info del restaurante y logout */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
              Restaurante
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              {user?.restaurantName || "Panel"}
            </h1>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
          >
            Cerrar sesión
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          {user?.email} · {user?.restaurantRole || "Staff"}
        </p>
      </header>

      {/* Stats cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-20 rounded bg-zinc-100" />
              <div className="h-7 w-10 rounded bg-zinc-100" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-rose-50 text-sm text-rose-700">{error}</Card>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ofertas activas
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.activeMenus}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pedidos en curso
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
            {stats.pendingOrders > 0 && <Chip>Pendientes</Chip>}
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Entregados hoy
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.deliveredToday}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ventas hoy
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatMoney(stats.salesTodayCents)}
            </p>
          </Card>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          href="/r/new"
        >
          Crear oferta
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          href="/r/offers"
        >
          Mis ofertas
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          href="/r/orders"
        >
          Pedidos
        </Link>
      </div>
    </section>
  );
}
