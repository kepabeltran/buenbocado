"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import CartPill from "../_components/CartPill";

type ApiMenu = {
  id: string;
  restaurant: string;
  type: "TAKEAWAY" | "DINEIN" | "DINE_IN";
  title: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  timeRemaining: string;
  distanceKm: number;
  badge?: string | null;
  imageUrl?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function parseRemainingMinutes(s: string): number {
  const v = (s ?? "").trim().toLowerCase();
  const hhmm = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
  const h = v.match(/(\d+)\s*h/);
  const m = v.match(/(\d+)\s*m/);
  if (h || m) return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  const n = v.match(/(\d+)/);
  return n ? Number(n[1]) : 10_000;
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

function fixImageUrl(u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u
    .replace("http://127.0.0.1:4000", API_BASE)
    .replace("http://localhost:4000", API_BASE);
}

// ─── Componentes de filtro ──────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold transition " +
        (active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
      }
    >
      {children}
    </button>
  );
}

function OfferRow({ m }: { m: ApiMenu }) {
  const img = fixImageUrl(m.imageUrl);
  const dineIn = isDineIn(m.type);
  const mins = parseRemainingMinutes(m.timeRemaining);

  const isHot = mins <= 60;
  const isCritical = mins <= 30;

  const timeLabel = isHot ? `Últimos ${m.timeRemaining}` : `Caduca en ${m.timeRemaining}`;

  const urgencyPill =
    isCritical ? "bg-rose-100 text-rose-800" :
    isHot ? "bg-amber-100 text-amber-800" :
    "bg-slate-100 text-slate-700";

  const urgencyRing =
    isCritical ? "ring-2 ring-rose-200" :
    isHot ? "ring-2 ring-amber-200" :
    "ring-1 ring-slate-200";

  return (
    <Link
      href={`/offers/${m.id}`}
      className={[
        "group flex items-stretch gap-3 rounded-2xl bg-white p-3 shadow-sm transition",
        "hover:-translate-y-[1px] hover:shadow-md",
        urgencyRing,
      ].join(" ")}
    >
      <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        {img ? (
          <img
            src={img}
            alt={m.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-200 via-white to-slate-200">
            <span className="text-xs font-black text-slate-600">BB</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-500">{m.restaurant}</div>
            <div className="truncate text-sm font-black text-slate-900">{m.title}</div>
            {m.description ? (
              <div className="mt-1 line-clamp-1 text-xs text-slate-600">{m.description}</div>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-black text-slate-900">{formatEuros(m.priceCents)}</div>
            <div className="text-xs font-semibold text-slate-500">
              {m.distanceKm != null ? `${m.distanceKm.toFixed(1)} km` : ""}
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {dineIn ? "En local" : "Para llevar"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyPill}`}>
            {timeLabel}
          </span>
          {m.badge ? (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              {m.badge}
            </span>
          ) : null}
          <span className="ml-auto inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-800">
            Reservar
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Página principal ───────────────────────────────────

export default function OffersPage() {
  const [items, setItems] = useState<ApiMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<"asking" | "granted" | "denied" | "unavailable">("asking");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filtros (client-side en vez de query params)
  const [sort, setSort] = useState<"near" | "soon">("near");
  const [typeFilter, setTypeFilter] = useState<"TAKEAWAY" | "DINEIN" | null>(null);
  const [under10, setUnder10] = useState(false);

  // Pedir GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      setCoords({ lat: 36.7213, lng: -4.4214 }); // Málaga por defecto
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("granted");
      },
      () => {
        setGpsStatus("denied");
        setCoords({ lat: 36.7213, lng: -4.4214 }); // Málaga por defecto
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Cargar ofertas cuando tengamos coordenadas
  const loadOffers = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/menus/active?lat=${coords.lat}&lng=${coords.lng}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!coords) return;
    const id = setInterval(loadOffers, 30000);
    return () => clearInterval(id);
  }, [coords, loadOffers]);

  // Filtrar y ordenar
  const filtered = useMemo(() => {
    let result = items.slice();
    if (typeFilter === "TAKEAWAY") result = result.filter((m) => !isDineIn(m.type));
    if (typeFilter === "DINEIN") result = result.filter((m) => isDineIn(m.type));
    if (under10) result = result.filter((m) => (m.priceCents ?? 0) <= 1000);

    result.sort((a, b) => {
      if (sort === "soon")
        return parseRemainingMinutes(a.timeRemaining) - parseRemainingMinutes(b.timeRemaining);
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });
    return result;
  }, [items, sort, typeFilter, under10]);

  const countLabel = filtered.length === 1 ? "1 oferta" : `${filtered.length} ofertas`;

  return (
    <main className="min-h-[100svh] bg-slate-50 md:bg-slate-100 md:bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(15,23,42,0.08),transparent_60%)]">
      <div className="mx-auto w-full md:flex md:justify-center md:px-6 md:py-10">
        <div className="w-full bg-[#F3F7FF] md:max-w-[440px] md:overflow-hidden md:rounded-[32px] md:border md:border-slate-200 md:shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur md:static">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <button onClick={loadOffers} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-black text-white">
                  BB
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">BuenBocado</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Última hora · precio cerrado
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <a
                  href="http://localhost:3001/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Soy restaurante
                </a>
                <CartPill />
              </div>
            </div>

            <div className="px-4 pb-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Ofertas cerca de ti
                </h1>
                {!loading && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {countLabel}
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ● En vivo
                </span>
              </div>

              {gpsStatus === "denied" && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    📍 Sin acceso a tu ubicación. Mostrando ofertas cerca de Málaga.{" "}
                    <button
                      onClick={() => window.location.reload()}
                      className="font-semibold underline"
                    >
                      Reintentar
                    </button>
                  </p>
                </div>
              )}

              {gpsStatus !== "denied" && (
                <p className="mt-2 text-sm text-slate-600">
                  Reserva en segundos. Recoge con código.
                </p>
              )}

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Chip active={sort === "near"} onClick={() => setSort("near")}>Cerca</Chip>
                <Chip active={sort === "soon"} onClick={() => setSort("soon")}>Caduca pronto</Chip>
                <Chip active={under10} onClick={() => setUnder10(!under10)}>&lt; 10 €</Chip>
                <Chip
                  active={typeFilter === "TAKEAWAY"}
                  onClick={() => setTypeFilter(typeFilter === "TAKEAWAY" ? null : "TAKEAWAY")}
                >
                  Para llevar
                </Chip>
                <Chip
                  active={typeFilter === "DINEIN"}
                  onClick={() => setTypeFilter(typeFilter === "DINEIN" ? null : "DINEIN")}
                >
                  En local
                </Chip>
                {(typeFilter || under10 || sort !== "near") && (
                  <Chip active={false} onClick={() => { setSort("near"); setTypeFilter(null); setUnder10(false); }}>
                    Quitar filtros
                  </Chip>
                )}
              </div>
            </div>
          </header>

          <section className="px-4 pb-24 pt-6">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm text-slate-500">
                  {gpsStatus === "asking" ? "📍 Obteniendo tu ubicación…" : "Cargando ofertas…"}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-black">Sin ofertas ahora</div>
                <p className="mt-2 text-sm text-slate-600">
                  Esto cambia rápido. Vuelve en unos minutos o quita filtros.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => { setSort("near"); setTypeFilter(null); setUnder10(false); loadOffers(); }}
                    className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((m) => (
                  <OfferRow key={m.id} m={m} />
                ))}
              </div>
            )}
          </section>

          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-[520px] px-2 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={loadOffers}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-900"
              >
                <span className="h-1 w-10 rounded-full bg-slate-900" />
                Ofertas
              </button>
              <Link
                href="/account"
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500"
              >
                <span className="h-1 w-10 rounded-full bg-transparent" />
                Cuenta
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}
