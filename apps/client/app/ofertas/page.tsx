"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ofertas,
  discountPct,
  ofertaLabelCaduca,
  ofertaLabelRecogida,
  formatEuros,
} from "../_data/ofertas";
import { restaurants } from "../_data/restaurants";

export default function OfertasPage() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const knownRestaurantIds = useMemo(() => new Set(restaurants.map((r) => r.id)), []);

  const rows = useMemo(() => {
    return ofertas
      .map((o) => {
        const caduca = ofertaLabelCaduca(o, now);
        const recogida = ofertaLabelRecogida(o, now);
        const pct = discountPct(o);
        return { o, caduca, recogida, pct };
      })
      .sort((a, b) => {
        if (a.o.cadencia !== b.o.cadencia) return a.o.cadencia === "DROP" ? -1 : 1;
        return 0;
      });
  }, [now]);

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-white text-xs font-bold">
                BB
              </span>
              Ofertas (ES)
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
              Ofertas
            </h1>
            <p className="mt-1 text-sm text-zinc-700">
              Drops que caducan rápido + excedentes programados por días.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Home
            </Link>
            <Link
              href="/orders"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Mis pedidos
            </Link>
            <Link
              href="/restaurants"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Restaurantes
            </Link>
          </nav>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {rows.map(({ o, caduca, recogida, pct }) => {
            const agotado = o.qtyAvailable <= 0;

            const hasRestaurant = knownRestaurantIds.has(o.restaurantId);
            const restaurantHref = hasRestaurant
              ? `/restaurants/${o.restaurantId}?offer=${encodeURIComponent(o.id)}`
              : "/restaurants";

            return (
              <div
                key={o.id}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
              >
                {/* overlay: toda la card -> detalle oferta */}
                <Link
                  href={`/ofertas/${o.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={`Ver oferta: ${o.titulo}`}
                >
                  <span className="sr-only">Ver oferta</span>
                </Link>

                <div className="relative z-0">
                  {/* Placeholder imagen */}
                  <div className="relative aspect-[16/10] w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-75" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-black/5" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                        {o.cadencia === "PROGRAMADA" ? "Programada" : "Última hora"}
                      </span>

                      {pct > 0 && (
                        <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                          -{pct}%
                        </span>
                      )}
                    </div>

                    <div className="absolute right-4 top-4">
                      <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                        {o.cadencia === "PROGRAMADA" ? "Disponible" : "Caduca en"}: {caduca}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                          <span className="truncate">{o.restaurantName}</span>
                        </div>
                        <div className="mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm">
                          {o.titulo}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                        <div className="text-sm font-semibold text-zinc-900">{formatEuros(o.priceCents)}</div>
                        {o.originalPriceCents > 0 && (
                          <div className="text-xs text-zinc-500 line-through">{formatEuros(o.originalPriceCents)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-zinc-600 line-clamp-2">{o.descripcion}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {recogida}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                        Stock: {agotado ? "0" : o.qtyAvailable}
                      </span>

                      {o.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                        Ver oferta →
                      </div>

                      {/* botón por encima del overlay */}
                      <Link
                        href={restaurantHref}
                        className="relative z-20 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                        title={knownRestaurantIds.has(o.restaurantId) ? "Ver restaurante" : "Ver lista de restaurantes"}
                      >
                        Ver restaurante
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}