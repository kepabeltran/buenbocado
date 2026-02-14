"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Offer = {
  id: string;
  restaurant: string;
  title: string;
  description?: string | null;
  priceCents: number;
  timeRemaining: string;
  distanceKm: number;
  imageUrl?: string | null;
};

function fixImg(u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

/* ─── Carrusel de ofertas reales ─────────────────── */
function OfferCarousel({ offers }: { offers: Offer[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % offers.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [offers.length]);

  const o = offers[idx];
  if (!o) return null;
  const img = fixImg(o.imageUrl);

  return (
    <div className="relative mx-auto max-w-[320px]">
      <Link href={`/offers/${o.id}`}>
        <div
          className={
            "rounded-3xl bg-white p-4 shadow-2xl shadow-slate-900/8 border border-slate-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer " +
            (fade ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4")
          }
        >
          <div className="h-44 rounded-2xl overflow-hidden bg-slate-100">
            {img ? (
              <img src={img} alt={o.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-gradient-to-br from-emerald-50 to-lime-50">
                <span className="text-emerald-600 font-extrabold">BB</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="text-xs font-bold text-emerald-600">{o.restaurant}</p>
            <p className="text-base font-extrabold mt-0.5">{o.title}</p>
            {o.description && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{o.description}</p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                {o.timeRemaining}
              </span>
            </div>
            <span className="text-lg font-extrabold text-emerald-600">{formatEuros(o.priceCents)}</span>
          </div>

          <div className="mt-3 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-bold text-white">
            Reservar
          </div>
        </div>
      </Link>

      {/* Dots indicator */}
      {offers.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true); }, 200); }}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (i === idx ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-300 hover:bg-slate-400")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────── */
export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/menus/active?lat=36.72&lng=-4.42`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json?.data)) setOffers(json.data.slice(0, 4));
    } catch {}
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  return (
    <div className="min-h-screen bg-[#fafdf7] text-slate-900 overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      {/* ─── NAV ──────────────────────────────────── */}
      <nav
        className={
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 " +
          (scrollY > 40
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100"
            : "bg-transparent")
        }
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white">BB</span>
            <span className="text-lg font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#como-funciona" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Cómo funciona</a>
            <a href="#restaurantes" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Restaurantes</a>
            <Link href="/offers" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">Ver ofertas</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full bg-lime-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className={"transition-all duration-700 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-700 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {offers.length > 0 ? `${offers.length} ofertas disponibles ahora` : "Ofertas en tiempo real"}
              </span>
            </div>

            <h1 className={"text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight transition-all duration-700 delay-100 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              Comida de{" "}<span className="text-emerald-600">restaurante</span>{" "}a precio reducido
            </h1>

            <p className={"mt-5 text-base md:text-lg text-slate-500 max-w-md leading-relaxed transition-all duration-700 delay-200 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              Reserva platos con descuento de restaurantes cerca de ti. Recoge en minutos con tu código QR.
            </p>

            <div className={"mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-300 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <Link href="/offers" className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:-translate-y-0.5">
                Explorar ofertas
              </Link>
              <a href="#como-funciona" className="rounded-full border-2 border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                Cómo funciona
              </a>
            </div>
          </div>

          {/* Carrusel de ofertas reales */}
          <div className={"hidden md:block transition-all duration-1000 delay-300 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {offers.length > 0 ? (
              <OfferCarousel offers={offers} />
            ) : (
              <div className="mx-auto max-w-[320px] rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/8 border border-slate-100/80">
                <div className="h-44 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 grid place-items-center">
                  <div className="text-center">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cargando ofertas</span>
                    <div className="mt-3 h-6 w-32 mx-auto rounded bg-emerald-100 animate-pulse" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────── */}
      <section id="como-funciona" className="py-20 md:py-28 px-5 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Cómo funciona</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">En 3 pasos tienes tu comida</h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01", title: "Elige tu oferta",
                desc: "Explora los platos disponibles cerca de ti con descuentos exclusivos de última hora.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
              },
              {
                step: "02", title: "Reserva al instante",
                desc: "Confirma en segundos. Recibirás un código QR y un código de recogida único.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
              },
              {
                step: "03", title: "Recoge y disfruta",
                desc: "Ve al restaurante, muestra tu código y llévate tu comida. Sin esperas.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl bg-[#fafdf7] border border-emerald-100/60 p-7 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-0.5">
                <span className="absolute top-5 right-6 text-5xl font-extrabold text-emerald-100">{item.step}</span>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 grid place-items-center">{item.icon}</div>
                <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFICIOS ───────────────────────────── */}
      <section className="py-20 md:py-28 px-5 bg-[#fafdf7]">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Ventajas</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Ahorra sin renunciar a la calidad</h2>
            <div className="mt-8 space-y-5">
              {[
                { title: "Hasta 50% de descuento", desc: "Platos de restaurante a precios que no encontrarás en ningún otro sitio." },
                { title: "Ofertas cerca de ti", desc: "Ordenadas por distancia real gracias al GPS de tu dispositivo." },
                { title: "Reserva en 10 segundos", desc: "Selecciona, confirma y recibe tu código QR al instante." },
                { title: "Menos desperdicio", desc: "Cada reserva es comida que no se tira. Bueno para ti, bueno para todos." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-emerald-100 grid place-items-center">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 md:p-10 text-white">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Ahorro medio por pedido</p>
              <p className="mt-2 text-5xl font-extrabold">35%</p>
              <p className="mt-1 text-emerald-200 text-sm">respecto al precio original del plato</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xl font-extrabold">2 min</p>
                  <p className="text-xs text-emerald-200 mt-0.5">tiempo medio de reserva</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xl font-extrabold">0 €</p>
                  <p className="text-xs text-emerald-200 mt-0.5">comisión al cliente</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-full h-full rounded-3xl bg-emerald-200/20 -z-10" />
          </div>
        </div>
      </section>

      {/* ─── PARA RESTAURANTES ────────────────────── */}
      <section id="restaurantes" className="py-20 md:py-28 px-5 bg-white">
        <div className="mx-auto max-w-6xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Para restaurantes</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Llena tus horas valle sin esfuerzo</h2>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-sm">Publica ofertas de última hora y llega a nuevos clientes al instante.</p>

          <div className="mt-12 grid gap-5 md:grid-cols-3 text-left">
            {[
              {
                title: "Panel en tiempo real",
                desc: "Gestiona ofertas, pedidos y liquidaciones desde un solo lugar.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              },
              {
                title: "Alertas instantáneas",
                desc: "Notificación sonora y visual cuando llega un pedido nuevo.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
              },
              {
                title: "Liquidaciones claras",
                desc: "Transparencia total. Comisiones y cobros detallados cada semana.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 p-6 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center">{item.icon}</div>
                <h3 className="mt-3 text-sm font-extrabold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a href="http://localhost:3001/login" className="inline-flex rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white hover:bg-slate-800 transition">
              Acceder como restaurante
            </a>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────── */}
      <section className="py-20 md:py-24 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-10 md:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Tu próxima comida te espera</h2>
              <p className="mt-3 text-emerald-100 text-sm md:text-base max-w-md mx-auto">Descubre las ofertas de los restaurantes cerca de ti.</p>
              <div className="mt-7">
                <Link href="/offers" className="inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-xl shadow-black/15 hover:-translate-y-0.5">
                  Ver ofertas ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────── */}
      <footer className="py-8 px-5 border-t border-slate-100">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-[10px] font-extrabold text-white">BB</span>
            <span className="text-sm font-bold">BuenBocado</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <Link href="/offers" className="hover:text-emerald-600 transition">Ofertas</Link>
            <a href="http://localhost:3001/login" className="hover:text-emerald-600 transition">Restaurantes</a>
            <Link href="/auth" className="hover:text-emerald-600 transition">Mi cuenta</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 BuenBocado</p>
        </div>
      </footer>
    </div>
  );
}
