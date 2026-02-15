"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Order = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  menu: {
    id: string;
    title: string;
    type: string;
    priceCents: number;
    currency: string;
    imageUrl?: string | null;
    restaurant: {
      id: string;
      name: string;
      address?: string | null;
    };
  } | null;
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fixImg(u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function statusLabel(s: string) {
  switch (s) {
    case "PENDING": return { text: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "CONFIRMED": return { text: "Confirmado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "DELIVERED": return { text: "Entregado", color: "bg-slate-100 text-slate-600 border-slate-200" };
    case "CANCELLED": return { text: "Cancelado", color: "bg-rose-50 text-rose-600 border-rose-200" };
    case "NO_SHOW": return { text: "No recogido", color: "bg-rose-50 text-rose-600 border-rose-200" };
    default: return { text: s, color: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

export default function OrdersPage() {
  const { isLoggedIn, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth?redirect=/orders");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    async function load() {
      try {
        const token = getToken();
        const res = await fetch(API_BASE + "/api/customer/me/orders", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Error cargando pedidos");
        setOrders(json.data || []);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLoggedIn, getToken]);

  if (authLoading || !isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#fafdf7] grid place-items-center" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <p className="text-sm text-slate-400">Redirigiendo…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
      <div className="mx-auto max-w-[480px] px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Mi cuenta
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Mis pedidos</h1>
        <p className="text-xs text-slate-400 mb-5">Historial de tus reservas</p>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-14 w-14 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="rounded-2xl bg-white border border-slate-100 p-8 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 grid place-items-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="mt-3 text-base font-extrabold text-slate-900">Sin pedidos aún</p>
            <p className="mt-1 text-xs text-slate-400">Cuando reserves una oferta, aparecerá aquí.</p>
            <Link href="/offers" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
              Explorar ofertas
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const img = fixImg(order.menu?.imageUrl);
              const status = statusLabel(order.status);
              return (
                <div key={order.id} className="rounded-2xl bg-white border border-slate-100 p-3.5 shadow-sm">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center">
                          <span className="text-xs font-bold text-emerald-300">BB</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-600">{order.menu?.restaurant?.name || "Restaurante"}</p>
                          <p className="text-sm font-extrabold text-slate-900 truncate">{order.menu?.title || "Oferta"}</p>
                        </div>
                        <span className={"shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold " + status.color}>
                          {status.text}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-sm font-extrabold text-emerald-600">
                          {order.menu ? formatMoney(order.menu.priceCents) : "—"}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(order.createdAt)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-600 tracking-wider">
                          {order.code}
                        </span>
                        {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(order.code)}&margin=4`}
                            alt="QR"
                            className="h-8 w-8 rounded"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
