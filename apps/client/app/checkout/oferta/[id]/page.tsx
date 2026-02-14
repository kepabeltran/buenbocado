"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type MenuInfo = {
  id: string;
  title: string;
  description: string | null;
  restaurant: string;
  type: string;
  priceCents: number;
  currency: string;
  timeRemaining: string;
  distanceKm: number;
  imageUrl: string | null;
};

function formatMoney(cents: number, currency = "EUR") {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function fixImg(u: string | null) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=8`}
      alt={`Código QR: ${value}`}
      width={size}
      height={size}
      className="mx-auto rounded-xl"
    />
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const menuId = String(params?.id ?? "");
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading, getToken } = useAuth();

  const [menu, setMenu] = useState<MenuInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [orderResult, setOrderResult] = useState<{
    code: string;
    restaurant: string;
    menuTitle: string;
    total: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push(`/auth?redirect=/checkout/oferta/${menuId}`);
    }
  }, [authLoading, isLoggedIn, router, menuId]);

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + "/api/menus/active?lat=37.176&lng=-3.600", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Error cargando ofertas");
      const found = (json.data || []).find((m: any) => m.id === menuId);
      if (!found) throw new Error("Oferta no disponible");
      setMenu(found);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => { if (isLoggedIn) loadMenu(); }, [loadMenu, isLoggedIn]);

  async function handleSubmit() {
    if (!menu || !user) return;
    setError(null);
    setSubmitting(true);
    try {
      const customerName = user.name || user.email.split("@")[0];
      const customerEmail = user.email;
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;

      const res = await fetch(API_BASE + "/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ menuId: menu.id, customerName, customerEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === "OUT_OF_STOCK") throw new Error("Se han agotado justo ahora. Prueba con otra oferta.");
        throw new Error(json?.message || "Error al reservar");
      }
      setOrderResult({
        code: json.order?.code || "------",
        restaurant: json.menu?.restaurant || menu.restaurant,
        menuTitle: json.menu?.title || menu.title,
        total: formatMoney(json.menu?.priceCents || menu.priceCents, json.menu?.currency || menu.currency),
      });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  // ── CONFIRMACIÓN CON QR ───────────────────────
  if (orderResult) {
    return (
      <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
        <div className="mx-auto max-w-[480px] px-4 py-10">
          <div className="rounded-2xl bg-white border border-slate-100 p-6 text-center shadow-sm">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>

            <h1 className="mt-4 text-xl font-extrabold text-slate-900">Reserva confirmada</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Muestra este código en {orderResult.restaurant} para recoger tu pedido.
            </p>

            <div className="mt-5">
              <QRCode value={orderResult.code} size={160} />
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 py-4 px-4">
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Código de recogida</p>
              <p className="mt-1 text-3xl font-extrabold tracking-[0.2em] text-slate-900 font-mono">
                {orderResult.code}
              </p>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Oferta</span>
                <span className="font-bold text-slate-900">{orderResult.menuTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restaurante</span>
                <span className="font-bold text-slate-900">{orderResult.restaurant}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="font-extrabold text-lg text-emerald-600">{orderResult.total}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-left">
              <p className="text-xs text-amber-700">
                También hemos enviado este código a tu email.
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-left">
              <p className="text-xs text-slate-500">
                Pago seguro a través de nuestra plataforma.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/offers"
                className="block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                Ver más ofertas
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── CARGANDO / REDIRIGIENDO ───────────────────
  if (authLoading || !isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#fafdf7] grid place-items-center" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <p className="text-sm text-slate-400">Redirigiendo…</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="mx-auto max-w-[480px] px-4 py-10">
          <div className="rounded-2xl bg-white border border-slate-100 p-6 animate-pulse">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="mt-4 h-20 bg-slate-100 rounded-xl" />
            <div className="mt-4 h-12 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  // ── OFERTA NO ENCONTRADA ──────────────────────
  if (!menu) {
    return (
      <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="mx-auto max-w-[480px] px-4 py-10">
          <Link href="/offers" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 transition shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Ofertas
          </Link>
          <div className="mt-6 rounded-2xl bg-white border border-slate-100 p-8 text-center">
            <p className="text-base font-extrabold text-slate-900">Oferta no disponible</p>
            <p className="mt-1.5 text-sm text-slate-400">{error || "Puede haber caducado o agotado."}</p>
            <Link href="/offers" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
              Ver ofertas activas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const img = fixImg(menu.imageUrl);

  // ── CONFIRMAR RESERVA ─────────────────────────
  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
      <div className="mx-auto max-w-[480px] px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/offers/${menuId}`} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 transition shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">

          {/* Resumen oferta con imagen */}
          <div className="flex items-stretch gap-0">
            {img && (
              <div className="w-28 shrink-0">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-4 flex flex-col justify-center">
              <p className="text-xs font-bold text-emerald-600">{menu.restaurant}</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">{menu.title}</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatMoney(menu.priceCents, menu.currency)}</p>
            </div>
          </div>

          <div className="px-4 pb-5">
            {/* Info usuario logueado */}
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-200 grid place-items-center">
                <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700">{user?.name || user?.email}</p>
                <p className="text-[11px] text-emerald-600">{user?.email}</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Botón reservar */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20"
            >
              {submitting ? "Reservando…" : `Reservar por ${formatMoney(menu.priceCents, menu.currency)}`}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Pago seguro a través de nuestra plataforma.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
