"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white">BB</span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{user?.restaurantName || "Panel"}</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/r/settings"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:border-emerald-200 hover:text-emerald-700 transition"
          >
            Ajustes
          </Link>
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:border-rose-200 hover:text-rose-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 p-5 animate-pulse">
              <div className="h-3 w-20 rounded bg-slate-100 mb-3" />
              <div className="h-7 w-12 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700 mb-8">{error}</div>
      ) : stats ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 grid place-items-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ofertas activas</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.activeMenus}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-amber-50 grid place-items-center mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En curso</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.pendingOrders}</p>
            {stats.pendingOrders > 0 && <span className="inline-block mt-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pendientes</span>}
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 grid place-items-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entregados hoy</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.deliveredToday}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 grid place-items-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas hoy</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatMoney(stats.salesTodayCents)}</p>
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Link href="/r/new" className="group rounded-2xl bg-emerald-600 p-5 text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
          <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <p className="text-sm font-extrabold">Crear oferta</p>
          <p className="text-xs text-emerald-200 mt-0.5">Publicar nuevo plato</p>
        </Link>

        <Link href="/r/offers" className="group rounded-2xl bg-white border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-md transition shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </div>
          <p className="text-sm font-extrabold text-slate-900">Mis ofertas</p>
          <p className="text-xs text-slate-400 mt-0.5">Gestionar publicaciones</p>
        </Link>

        <Link href="/r/orders" className="group rounded-2xl bg-white border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-md transition shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <p className="text-sm font-extrabold text-slate-900">Pedidos</p>
          <p className="text-xs text-slate-400 mt-0.5">Estados en tiempo real</p>
        </Link>

        <Link href="/r/settlements" className="group rounded-2xl bg-white border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-md transition shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-extrabold text-slate-900">Liquidaciones</p>
          <p className="text-xs text-slate-400 mt-0.5">Cobros y comisiones</p>
        </Link>
      </div>
    </div>
  );
}
