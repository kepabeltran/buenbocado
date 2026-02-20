"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
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


type OrderResult = { orderId?: string; code: string; menuTitle: string; total: string };
type RestaurantInfo = { name: string; address: string | null };

export default function CartPage() {
  const { list, count, setQty, clear } = useCart();
  const { user, isLoggedIn, loading: authLoading, getToken } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (list.length === 0) { setUrgent(false); return; }
    function check() {
      const oldest = list.reduce((min, i) => {
        const t = new Date(i.addedAt).getTime();
        return t < min ? t : min;
      }, Infinity);
      setUrgent(Date.now() - oldest > 10 * 60 * 1000);
    }
    check();
    const timer = setInterval(check, 15000);
    return () => clearTimeout(timer);
  }, [list]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OrderResult[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);

  const totalCents = list.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const restaurant = list.length > 0 ? list[0].restaurant : null;

  // Fetch restaurant address when cart has items
  useEffect(() => {
    if (list.length === 0) return;
    const menuId = list[0].menuId;
    async function fetchAddress() {
      try {
        const res = await fetch(`${API_BASE}/api/menus/active?lat=0&lng=0`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const menu = (json?.data || []).find((m: any) => m.id === menuId);
        if (menu?.restaurantAddress) {
          setRestaurantInfo({ name: menu.restaurant, address: menu.restaurantAddress });
        }
      } catch {}
    }
    fetchAddress();
  }, [list]);

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
            orderId: json.order?.id,
            code: json.order?.code || "------",
            menuTitle: json.menu?.title || item.title,
            total: formatMoney(json.menu?.priceCents || item.priceCents),
          });
        }
      }
      clear();

      // Si solo se ha generado 1 pedido, vamos directos al ticket (flujo principal)
      if (orderResults.length === 1 && orderResults[0]?.orderId) {
        router.push(`/ticket/${orderResults[0].orderId}`);
        return;
      }

      // Si hay varios, mostramos la pantalla de confirmación con enlaces a cada ticket
      setResults(orderResults);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  // ── CONFIRMACIÓN ──────────────────────────────
  if (results.length > 0) {
    const mapsUrl = restaurantInfo?.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurantInfo.address)}`
      : null;

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
            <p className="mt-1.5 text-sm text-slate-400">{results.length === 1 ? "Muestra este código" : "Muestra estos códigos"} en el restaurante para recoger.</p>

            {/* Dirección del restaurante */}
            {restaurantInfo?.address && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Recoge en</p>
                    <p className="text-sm font-bold text-slate-700">{restaurantInfo.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{restaurantInfo.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QR codes */}
            <div className="mt-5 space-y-4">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-bold text-emerald-700">{r.menuTitle}</p>
                  <div className="mt-2 inline-block rounded-xl bg-white p-2 border border-emerald-100"><QRCode value={String(r.code).replace(/\s+/g, "")} size={120} /></div>
                  <p className="mt-2 text-2xl font-extrabold tracking-[0.15em] text-slate-900 font-mono">{r.code}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">{r.total}</p>
                  {r.orderId && (
                    <div className="mt-3">
                      <Link href={`/ticket/${r.orderId}`} className="inline-flex items-center justify-center rounded-lg bg-white border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition">Ver ticket</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cómo llegar */}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Cómo llegar al restaurante
              </a>
            )}

            <p className="mt-4 text-xs text-slate-400">Tip: lo tienes guardado en <Link href="/orders" className="font-semibold text-emerald-700 hover:text-emerald-800">Mis pedidos</Link>.</p>
            <div className="mt-5">
              <Link href="/offers" className="block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition">Ver más ofertas</Link>
              <Link href="/orders" className="mt-3 block w-full rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-800 hover:border-emerald-300 transition">Mis pedidos</Link>
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
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </Link>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Tu carrito</h1>
        <p className="text-xs text-slate-400 mb-3">{restaurant} — {count} {count === 1 ? "artículo" : "artículos"}</p>

        {/* Dirección del restaurante en el carrito */}
        {restaurantInfo?.address && (
          <div className="mb-4 rounded-xl bg-white border border-slate-100 px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div>
              <p className="text-xs text-slate-400 font-medium">Recoger en</p>
              <p className="text-sm font-bold text-slate-700">{restaurantInfo.address}</p>
            </div>
          </div>
        )}

        {urgent && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="text-sm font-bold text-amber-800">Tus ofertas pueden agotarse</p>
              <p className="text-xs text-amber-600">Llevas más de 10 minutos sin finalizar la compra.</p>
            </div>
          </div>
        )}

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