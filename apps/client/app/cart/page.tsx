"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../_state/cart";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fixImg(u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function QRCode({ value, size = 160 }: { value: string; size?: number }) {
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

type OrderResult = { code: string; menuTitle: string; total: string };

export default function CartPage() {
  const { list, count, setQty, clear } = useCart();
  const { user, isLoggedIn, loading: authLoading, getToken } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OrderResult[]>([]);

  const totalCents = list.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const restaurant = list.length > 0 ? list[0].restaurant : null;

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push("/auth?redirect=/cart");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;
      const customerName = user?.name || user?.email?.split("@")[0] || "";
      const customerEmail = user?.email || "";
      const orderResults: OrderResult[] = [];

      for (const item of list) {
        for (let q = 0; q < item.qty; q++) {
          const res = await fetch(API_BASE + "/api/orders", {
            method: "POST",
            headers,
            body: JSON.stringify({ menuId: item.menuId, customerName, customerEmail }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (json?.error === "OUT_OF_STOCK") throw new Error(`"${item.title}" se ha agotado. Elimínalo del carrito.`);
            throw new Error(json?.message || "Error al reservar");
          }
          orderResults.push({
            code: json.order?.code || "------",
            menuTitle: json.menu?.title || item.title,
            total: formatMoney(json.menu?.priceCents || item.priceCents),
          });
        }
      }
      setResults(orderResults);
      clear();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  // ── CONFIRMACIÓN ──────────────────────────────
  if (results.length > 0) {
    return (
      <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
        <div className="mx-auto max-w-[480px] px-4 py-8">
          <div className="rounded-2xl bg-white border border-slate-100 p-6 text-center shadow-sm">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-slate-900">
              {results.length === 1 ? "Reserva confirmada" : `${results.length} reservas confirmadas`}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">Muestra estos códigos en el restaurante para recoger.</p>
            <div className="mt-5 space-y-4">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-bold text-emerald-700">{r.menuTitle}</p>
                  <div className="mt-2"><QRCode value={r.code} size={120} /></div>
                  <p className="mt-2 text-2xl font-extrabold tracking-[0.15em] text-slate-900 font-mono">{r.code}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">{r.total}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-left">
              <p className="text-xs text-amber-700">También hemos enviado los códigos a tu email.</p>
            </div>
            <div className="mt-5">
              <Link href="/offers" className="block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition">Ver más ofertas</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── CARRITO VACÍO ─────────────────────────────
  if (list.length === 0) {
    return (
      <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
        <div className="mx-auto max-w-[480px] px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/offers" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 transition shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Ofertas
            </Link>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-8 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 grid place-items-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </div>
            <p className="mt-3 text-base font-extrabold text-slate-900">Tu carrito está vacío</p>
            <p className="mt-1 text-xs text-slate-400">Añade ofertas para empezar.</p>
            <Link href="/offers" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">Explorar ofertas</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── CARRITO CON ITEMS ─────────────────────────
  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
      <div className="mx-auto max-w-[480px] px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/offers" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 transition shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Ofertas
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Tu carrito</h1>
        <p className="text-xs text-slate-400 mb-5">{restaurant} — {count} {count === 1 ? "artículo" : "artículos"}</p>

        <div className="space-y-3">
          {list.map((item) => {
            const img = fixImg(item.imageUrl);
            return (
              <div key={item.menuId} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {img ? (
                    <img src={img} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center"><span className="text-xs font-bold text-emerald-300">BB</span></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{item.title}</p>
                  <p className="text-sm font-bold text-emerald-600">{formatMoney(item.priceCents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(item.menuId, item.qty - 1)} className="h-8 w-8 rounded-lg bg-slate-100 grid place-items-center text-slate-600 hover:bg-slate-200 transition font-bold text-sm">-</button>
                  <span className="text-sm font-extrabold w-5 text-center">{item.qty}</span>
                  <button onClick={() => setQty(item.menuId, item.qty + 1)} className="h-8 w-8 rounded-lg bg-emerald-100 grid place-items-center text-emerald-700 hover:bg-emerald-200 transition font-bold text-sm">+</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-extrabold text-emerald-600">{formatMoney(totalCents)}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700 font-medium">{error}</div>
        )}

        <div className="mt-5 space-y-2.5">
          <button onClick={handleCheckout} disabled={submitting} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20">
            {submitting ? "Reservando…" : `Pagar ${formatMoney(totalCents)}`}
          </button>
          <button onClick={clear} className="w-full rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-500 hover:border-rose-200 hover:text-rose-600 transition">Vaciar carrito</button>
          <p className="text-center text-xs text-slate-400">Pago seguro a través de nuestra plataforma.</p>
        </div>
      </div>
    </main>
  );
}
