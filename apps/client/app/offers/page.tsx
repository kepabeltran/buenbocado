"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import type { ReactNode } from "react";

type ApiMenu = {
  id: string;
  restaurant: string;
  restaurantAddress?: string | null;
  type: "TAKEAWAY" | "DINEIN" | "DINE_IN";
  title: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  timeRemaining: string;
  distanceKm: number;
  badge?: string | null;
  imageUrl?: string | null;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
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
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-bold transition " +
        (active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300")
      }
    >
      {children}
    </button>
  );
}

function OfferCard({ m }: { m: ApiMenu }) {
  const img = fixImageUrl(m.imageUrl);
  const dineIn = isDineIn(m.type);
  const mins = parseRemainingMinutes(m.timeRemaining);
  const isCritical = mins <= 30;
  const isHot = mins <= 60;

  const timeBg = isCritical ? "bg-rose-500" : isHot ? "bg-amber-500" : "bg-slate-600";

  return (
    <Link href={`/offers/${m.id}`} className="block group">
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-0.5 active:scale-[0.98]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {img ? (
            <img src={img} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-emerald-50 to-lime-50">
              <span className="text-lg font-extrabold text-emerald-300">BB</span>
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm">
              {dineIn ? "En local" : "Para llevar"}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className={`rounded-full ${timeBg} px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm`}>
              {m.timeRemaining}
            </span>
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-600">{m.restaurant}</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5 truncate">{m.title}</p>
              {m.description && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{m.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-extrabold text-emerald-600">{formatEuros(m.priceCents)}</p>
              {m.distanceKm != null && (
                <p className="text-[11px] text-slate-400 font-medium">{m.distanceKm.toFixed(1)} km</p>
              )}
            </div>
          </div>

          {/* Dirección del restaurante */}
          {m.restaurantAddress && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{m.restaurantAddress}</span>
            </div>
          )}

          {/* CTA sutil - invita a ver detalle */}
          <div className="mt-3 w-full rounded-xl bg-emerald-50 border border-emerald-100 py-2.5 text-center text-sm font-bold text-emerald-700 group-hover:bg-emerald-100 transition">
            Ver oferta
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OffersPage() {
  const [items, setItems] = useState<ApiMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<"asking" | "granted" | "denied" | "unavailable">("asking");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [sort, setSort] = useState<"near" | "soon">("near");
  const [typeFilter, setTypeFilter] = useState<"TAKEAWAY" | "DINEIN" | null>(null);
  const [under10, setUnder10] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<any>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      setCoords({ lat: 36.7213, lng: -4.4214 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus("granted"); },
      () => { setGpsStatus("denied"); setCoords({ lat: 36.7213, lng: -4.4214 }); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const loadOffers = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/menus/active?lat=${coords.lat}&lng=${coords.lng}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [coords]);

  useEffect(() => { loadOffers(); }, [loadOffers]);
  useEffect(() => {
    if (!coords) return;
    const id = setInterval(loadOffers, 30000);
    return () => clearInterval(id);
  }, [coords, loadOffers]);

  const filtered = useMemo(() => {
    let result = items.slice();
    if (typeFilter === "TAKEAWAY") result = result.filter((m) => !isDineIn(m.type));
    if (typeFilter === "DINEIN") result = result.filter((m) => isDineIn(m.type));
    if (under10) result = result.filter((m) => (m.priceCents ?? 0) <= 1000);
    result.sort((a, b) => {
      if (sort === "soon") return parseRemainingMinutes(a.timeRemaining) - parseRemainingMinutes(b.timeRemaining);
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    });
    return result;
  }, [items, sort, typeFilter, under10]);

  // Leaflet map (CDN). Se crea incluso si no hay ofertas (para que el usuario vea el mapa y su posición).
  useEffect(() => {
    if (!showMap) return;
    if (typeof window === "undefined") return;

    const container = mapRef.current;
    if (!container) return;

    // CSS una sola vez
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    type RestaurantGroup = {
      name: string;
      lat: number;
      lng: number;
      offers: { id: string; title: string; price: string }[];
    };

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      // Si ya había un mapa, lo destruimos para recrearlo con datos frescos
      if (leafletMapRef.current) {
        try { leafletMapRef.current.remove(); } catch {}
        leafletMapRef.current = null;
      }

      const center = coords ? [coords.lat, coords.lng] : [36.7213, -4.4214];

      const map = L.map(container, { zoomControl: true }).setView(center, coords ? 14 : 13);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 19,
      }).addTo(map);

      const byRestaurant = new Map<string, RestaurantGroup>();

      for (const m of filtered) {
        const lat = m.restaurantLat ?? null;
        const lng = m.restaurantLng ?? null;
        if (lat == null || lng == null) continue;

        const key = `${m.restaurant}:${lat}:${lng}`;
        const group = byRestaurant.get(key) ?? { name: m.restaurant, lat, lng, offers: [] };
        group.offers.push({
          id: m.id,
          title: m.title,
          price: (m.priceCents / 100).toFixed(2) + " €",
        });
        byRestaurant.set(key, group);
      }

      const greenIcon = L.divIcon({
        className: "",
        html:
          '<div style="width:32px;height:32px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:grid;place-items:center"><span style="color:#fff;font-weight:900;font-size:14px">BB</span></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
      });

      const bounds: [number, number][] = [];

      byRestaurant.forEach((r) => {
        const offersHtml = r.offers
          .map(
            (o) =>
              '<div style="font-size:12px;margin-top:6px">' +
              '<a href="/offers/' +
              o.id +
              '" style="text-decoration:none;color:#0f172a">' +
              "<strong>" +
              o.title +
              "</strong> — " +
              o.price +
              "</a></div>"
          )
          .join("");

        const popup =
          '<div style="font-family:DM Sans,system-ui,sans-serif;min-width:170px">' +
          '<div style="font-size:14px;font-weight:900;color:#10b981;margin-bottom:2px">' +
          r.name +
          "</div>" +
          offersHtml +
          "</div>";

        L.marker([r.lat, r.lng], { icon: greenIcon }).addTo(map).bindPopup(popup);
        bounds.push([r.lat, r.lng]);
      });

      if (coords) {
        const userIcon = L.divIcon({
          className: "",
          html:
            '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([coords.lat, coords.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div style="font-size:12px;font-weight:800">Tú</div>');
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView(center, coords ? 14 : 13);
      }

      // Importantísimo: si se monta en un contenedor que estaba oculto o recién renderizado, forzamos recálculo
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 80);
    };

    if ((window as any).L) {
      initMap();
    } else {
      const scriptId = "leaflet-js";
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", initMap, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (leafletMapRef.current) {
        try { leafletMapRef.current.remove(); } catch {}
        leafletMapRef.current = null;
      }
    };
  }, [showMap, filtered, coords]);


  return (
    <div className="min-h-[100svh] bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      <div className="mx-auto max-w-[480px]">

        {/* Header compacto */}
        <header className="sticky top-0 z-30 bg-[#fafdf7]/95 backdrop-blur-md px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-xs font-extrabold text-white">BB</span>
              <span className="text-base font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {!loading ? `${filtered.length} ofertas` : ""}
              </span>
            </div>
          </div>

          {gpsStatus === "denied" && (
            <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-xs text-amber-700">
                Sin acceso a ubicación. Mostrando Málaga.{" "}
                <button onClick={() => window.location.reload()} className="font-bold underline">Reintentar</button>
              </p>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={!showMap} onClick={() => { setShowMap(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Lista</Chip>
            <Chip active={showMap} onClick={() => { setShowMap(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Mapa</Chip>
            <Chip active={sort === "near"} onClick={() => setSort("near")}>Cerca</Chip>
            <Chip active={sort === "soon"} onClick={() => setSort("soon")}>Caduca pronto</Chip>
            <Chip active={under10} onClick={() => setUnder10(!under10)}>&lt; 10 €</Chip>
            <Chip active={typeFilter === "TAKEAWAY"} onClick={() => setTypeFilter(typeFilter === "TAKEAWAY" ? null : "TAKEAWAY")}>Para llevar</Chip>
            <Chip active={typeFilter === "DINEIN"} onClick={() => setTypeFilter(typeFilter === "DINEIN" ? null : "DINEIN")}>En local</Chip>
            {(typeFilter || under10 || sort !== "near") && (
              <Chip active={false} onClick={() => { setSort("near"); setTypeFilter(null); setUnder10(false); }}>Limpiar</Chip>
            )}
          </div>
        </header>

        {/* Contenido */}
        <section className="px-4 pb-28 pt-2">
          {showMap && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div ref={mapRef} className="h-[320px] w-full" />
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-4 w-40 bg-slate-100 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-100 p-8 text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 grid place-items-center">
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="mt-3 text-sm font-extrabold text-slate-900">Sin ofertas ahora</p>
              <p className="mt-1 text-xs text-slate-400">Esto cambia rápido. Vuelve en unos minutos.</p>
              <button
                onClick={() => { setSort("near"); setTypeFilter(null); setUnder10(false); loadOffers(); }}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((m) => (
                <OfferCard key={m.id} m={m} />
              ))}
            </div>
          )}
        </section>

        {/* Barra inferior */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100">
          <div className="mx-auto max-w-[480px] flex px-2 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={loadOffers}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-bold text-emerald-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Ofertas
            </button>
            <Link
              href="/account"
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-bold text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Mi cuenta
            </Link>
          </div>
        </nav>

      </div>
    </div>
  );
}
