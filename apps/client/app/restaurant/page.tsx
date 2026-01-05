import Link from "next/link";
import { notFound } from "next/navigation";

import { restaurants } from "../../_data/restaurants";
import { offers } from "../../_data/offers";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function asString(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default function RestaurantPage({ params, searchParams }: PageProps) {
  const id = params.id;

  const restaurant = restaurants.find((r: any) => r.id === id);
  if (!restaurant) return notFound();

  const highlightOfferId = asString(searchParams?.offer);

  const restaurantOffers = offers
    .filter((o: any) => o.restaurantId === restaurant.id)
    .sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  const highlightOffer =
    highlightOfferId && restaurantOffers.find((o: any) => o.id === highlightOfferId);

  const name = restaurant.name ?? restaurant.title ?? restaurant.id;
  const subtitle =
    restaurant.tagline ??
    restaurant.subtitle ??
    restaurant.category ??
    "Última hora + excedentes con descuento";

  const address = restaurant.address ?? restaurant.location ?? restaurant.city ?? "";
  const phone = restaurant.phone ?? restaurant.tel ?? "";
  const hours = restaurant.hours ?? restaurant.openingHours ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 pt-6">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/offers"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            ← Volver a ofertas
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Home
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/portal"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Portal
          </Link>
          <Link
            href="/orders"
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Mis pedidos
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="relative">
          {/* “Foto” placeholder elegante */}
          <div className="relative h-44 w-full md:h-56">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-75" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.85),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_60%,rgba(255,255,255,0.55),transparent_60%)]" />

            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-zinc-900 backdrop-blur">
                Restaurante
              </span>
              <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                Demo
              </span>
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-zinc-700">
              (foto real en producción)
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                {name}
              </h1>
              <p className="text-sm text-zinc-600">{subtitle}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold text-zinc-500">Ofertas activas</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-900">
                    {restaurantOffers.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold text-zinc-500">Ubicación</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {address || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold text-zinc-500">Recogida</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    En franja
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">Información</div>

              <div className="space-y-2 text-sm text-zinc-700">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500">Dirección</span>
                  <span className="text-right font-medium text-zinc-900">
                    {address || "—"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500">Teléfono</span>
                  <span className="text-right font-medium text-zinc-900">
                    {phone || "—"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500">Horario</span>
                  <span className="text-right font-medium text-zinc-900">
                    {hours || "—"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  onClick={() => alert("En producción: abrir mapa / llamar / ver perfil completo")}
                >
                  Acciones (demo)
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                En producción: mapa, reseñas, fotos reales, “seguir”, y datos completos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight offer (if coming from an offer) */}
      {highlightOffer ? (
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-500">Vienes desde</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">
                {highlightOffer.title ?? highlightOffer.name ?? highlightOffer.id}
              </div>
            </div>

            <Link
              href={`/offers/${highlightOffer.id}`}
              className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Ver oferta
            </Link>
          </div>
        </section>
      ) : null}

      {/* Offers list */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Ofertas de {name}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Tarjetas clicables con foto (placeholder ahora, real en producción).
            </p>
          </div>
        </div>

        {restaurantOffers.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No hay ofertas activas ahora mismo.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {restaurantOffers.map((o: any) => {
              const title = o.title ?? o.name ?? o.id;
              const desc = o.description ?? o.shortDescription ?? "Oferta disponible.";
              const pct = o.discountPct ?? o.discount ?? o.off ?? null;
              const fromPrice = o.price ?? o.fromPrice ?? o.amount ?? null;
              const oldPrice = o.oldPrice ?? o.originalPrice ?? null;

              return (
                <Link
                  key={o.id}
                  href={`/offers/${o.id}`}
                  className="group block overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-70" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {pct ? (
                        <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                          -{String(pct).replace("-", "")}%
                        </span>
                      ) : null}
                      <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-zinc-900 backdrop-blur">
                        {o.kind ?? o.type ?? "Oferta"}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="rounded-2xl bg-white/85 px-3 py-2 backdrop-blur">
                        <div className="text-[11px] font-semibold text-zinc-500">Restaurante</div>
                        <div className="text-sm font-semibold text-zinc-900">{name}</div>
                      </div>

                      <div className="rounded-2xl bg-white/85 px-3 py-2 text-right backdrop-blur">
                        <div className="text-[11px] font-semibold text-zinc-500">Desde</div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {fromPrice ? `${fromPrice} €` : "—"}
                        </div>
                        {oldPrice ? (
                          <div className="text-[11px] text-zinc-500 line-through">
                            {oldPrice} €
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-4 text-xs text-zinc-700">
                      (foto real en producción)
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-lg font-semibold text-zinc-900">{title}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{desc}</p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900">
                      Ver oferta →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
