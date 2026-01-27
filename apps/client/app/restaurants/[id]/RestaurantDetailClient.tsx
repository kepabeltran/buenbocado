"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Restaurant } from "../../_data/restaurants";
import { offers, euros } from "../../_data/offers";

export default function RestaurantDetailClient({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const list = useMemo(
    () => offers.filter((o) => o.restaurantId === restaurant.id),
    [restaurant.id],
  );

  const zone =
    (restaurant.neighborhood
      ? restaurant.neighborhood + (restaurant.city ? " · " : "")
      : "") + (restaurant.city ?? "");

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-56 md:h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-200 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_55%)]" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {restaurant.priceLevel ? (
              <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                {restaurant.priceLevel}
              </span>
            ) : null}

            {zone ? (
              <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                {zone}
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">
              {restaurant.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-700">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {restaurant.address ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Horario</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {restaurant.hours ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Mapa</div>
            <div className="mt-2 flex h-16 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs text-zinc-600">
              (Mapa real en producción)
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Ofertas activas
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {list.length
                ? "Elige una oferta para ver el detalle."
                : "Ahora mismo no hay ofertas activas."}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/offers"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver todas
            </Link>
            <Link
              href="/restaurants"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Restaurantes
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {list.map((o) => (
            <Link
              key={o.id}
              href={`/offers/${o.id}`}
              className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                    -{o.discountPct}% ·{" "}
                    {o.kind === "planned" ? "Excedente" : "Última hora"}
                  </div>
                  <div className="mt-3 text-lg font-semibold text-zinc-900">
                    {o.title}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{o.description}</p>
                </div>

                <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                  <div className="text-sm font-semibold text-zinc-900">
                    {euros(o.price)}
                  </div>
                  <div className="text-xs text-zinc-500 line-through">
                    {euros(o.originalPrice)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                  {o.pickupLabel}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                  Stock: {o.stock}
                </span>
              </div>

              <div className="mt-4 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                Ver detalle →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
