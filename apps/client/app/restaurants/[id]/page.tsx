import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantById } from "../../_data/restaurants";
import { offers, euros } from "../../_data/offers";

export default function RestaurantPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { offer?: string };
}) {
  const r = getRestaurantById(params.id);
  if (!r) return notFound();

  const selectedOffer = (searchParams?.offer || "").toString();
  const list = offers.filter((o) => o.restaurantId === r.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
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

      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-60 md:h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-200 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_55%)]" />
          <div className="absolute inset-0 opacity-15 [background:linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] [background-size:26px_26px]" />

          <div className="absolute bottom-5 left-5 right-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
              <span className="rounded-full bg-zinc-900/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                {r.priceLevel ?? "$$"}
              </span>
              <span className="truncate">
                {(r.neighborhood ? r.neighborhood + " · " : "") +
                  (r.city ?? "")}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
              {r.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-700">{r.tagline}</p>
          </div>
        </div>

        {/* INFO */}
        <div className="grid gap-5 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {r.address ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Horario</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {r.hours ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">Mapa</div>
            <div className="mt-2 h-16 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-600 flex items-center justify-center">
              (Mapa real en producción)
            </div>
          </div>
        </div>
      </section>

      {/* OFERTAS DEL RESTAURANTE */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
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
          <Link
            href="/offers"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ver todas
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {list.map((o) => {
            const highlighted = selectedOffer === o.id;
            return (
              <Link
                key={o.id}
                href={`/offers/${o.id}`}
                className={`block rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md ${
                  highlighted
                    ? "border-amber-400 ring-2 ring-amber-200"
                    : "border-zinc-200"
                }`}
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
                    <p className="mt-1 text-sm text-zinc-600">
                      {o.description}
                    </p>
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

                <div className="mt-4 text-sm font-semibold text-amber-700">
                  Ver detalle →
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
