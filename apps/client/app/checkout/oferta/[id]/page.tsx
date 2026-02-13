"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Genera QR como SVG usando API pública (sin dependencias)
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
  const { user, isLoggedIn, loading: authLoading, getToken } = useAuth();

  const [menu, setMenu] = useState<MenuInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Para usuarios no logueados (fallback)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Resultado
  const [orderResult, setOrderResult] = useState<{
    code: string;
    restaurant: string;
    menuTitle: string;
    total: string;
  } | null>(null);

  // Cargar info del menú
  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + "/api/menus/active?lat=37.176&lng=-3.600", {
        cache: "no-store",
      });
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

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Recuperar datos guardados para invitados
  useEffect(() => {
    if (typeof window === "undefined" || isLoggedIn) return;
    const saved = localStorage.getItem("bb_customer");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setGuestName(parsed.name);
        if (parsed.email) setGuestEmail(parsed.email);
      } catch { /* ignorar */ }
    }
  }, [isLoggedIn]);

  async function handleSubmit() {
    if (!menu) return;
    setError(null);
    setSubmitting(true);

    try {
      let customerName: string;
      let customerEmail: string;

      if (isLoggedIn && user) {
        customerName = user.name || user.email.split("@")[0];
        customerEmail = user.email;
      } else {
        customerName = guestName.trim();
        customerEmail = guestEmail.trim().toLowerCase();
        if (!customerName || customerName.length < 2) throw new Error("Escribe tu nombre");
        if (!customerEmail || !customerEmail.includes("@")) throw new Error("Escribe un email válido");
        localStorage.setItem("bb_customer", JSON.stringify({ name: customerName, email: customerEmail }));
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers["Authorization"] = "Bearer " + token;

      const res = await fetch(API_BASE + "/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          menuId: menu.id,
          customerName,
          customerEmail,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json?.error === "OUT_OF_STOCK") throw new Error("¡Vaya! Se han agotado justo ahora. Prueba con otra oferta.");
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

  // ─── PANTALLA DE CONFIRMACIÓN CON QR ─────────────────
  if (orderResult) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>

          <h1 className="mt-4 text-2xl font-bold text-zinc-900">¡Reserva confirmada!</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Muestra este código en {orderResult.restaurant} para recoger tu pedido.
          </p>

          {/* QR */}
          <div className="mt-6">
            <QRCode value={orderResult.code} size={180} />
          </div>

          {/* Código numérico */}
          <div className="mt-4 rounded-2xl bg-zinc-50 border border-zinc-200 py-4 px-4">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Código de recogida</p>
            <p className="mt-1 text-4xl font-black tracking-[0.2em] text-zinc-900 font-mono">
              {orderResult.code}
            </p>
          </div>

          <div className="mt-6 space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Oferta</span>
              <span className="font-semibold">{orderResult.menuTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Restaurante</span>
              <span className="font-semibold">{orderResult.restaurant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total</span>
              <span className="font-bold text-lg">{orderResult.total}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-amber-800">
              📱 También hemos enviado este código a tu email.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/offers"
              className="inline-flex justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver más ofertas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── CARGANDO ────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-zinc-500">Cargando…</p>
        </div>
      </main>
    );
  }

  // ─── OFERTA NO ENCONTRADA ────────────────────────────
  if (!menu) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <Link href="/offers" className="text-sm text-zinc-600 hover:text-zinc-900">← Volver a ofertas</Link>
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold">Oferta no disponible</h1>
          <p className="mt-2 text-sm text-zinc-600">{error || "Esta oferta puede haber caducado o agotado."}</p>
          <div className="mt-4">
            <Link href="/offers" className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Ver ofertas activas</Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── FORMULARIO DE CHECKOUT ──────────────────────────
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Link href="/offers" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← Volver a ofertas
      </Link>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Confirmar reserva</h1>

        {/* Resumen oferta */}
        <div className="mt-4 flex items-start gap-4 rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
          {menu.imageUrl && (
            <img src={menu.imageUrl} alt="" className="h-16 w-20 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">{menu.title}</p>
            <p className="text-xs text-zinc-500">{menu.restaurant}</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">{formatMoney(menu.priceCents, menu.currency)}</p>
          </div>
        </div>

        {/* Info usuario logueado */}
        {isLoggedIn && user ? (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-xs text-emerald-700">
              Reservando como <strong>{user.name || user.email}</strong> ({user.email})
            </p>
          </div>
        ) : (
          /* Formulario para invitados */
          <div className="mt-6 space-y-4">

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Tu nombre</span>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej: María García"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Tu email</span>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Ej: maria@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
              <p className="mt-1 text-xs text-zinc-400">Te enviaremos el código de recogida aquí.</p>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "Reservando…" : `Reservar por ${formatMoney(menu.priceCents, menu.currency)}`}
          </button>

          <p className="text-center text-xs text-zinc-400">
            El pago se realiza directamente en el restaurante al recoger.
          </p>
        </div>
      </div>
    </main>
  );
}
