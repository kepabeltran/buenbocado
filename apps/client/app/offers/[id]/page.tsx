import Link from "next/link";
import { notFound } from "next/navigation";
import { offers, euros } from "../../_data/offers";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
      {children}
    </span>
  );
}

export default function OfferDetailPage({ params }: { params: { id: string } }) {
  const offer = offers.find((o) => o.id === params.id);
  if (!offer) return notFound();

  const kindLabel = offer.kind === "planned" ? "Excedente" : "Última hora";
  const timeLabel =
    offer.kind === "planned"
      ? `Disponible ${offer.durationDays ?? 1} días`
      : `Caduca en ${offer.expiresInMin ?? 0} min`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-56 md:h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-200 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_55%)]" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              -{offer.discountPct}%
            </span>
            <Pill>{kindLabel}</Pill>
            <Pill>{timeLabel}</Pill>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
              <span className="truncate">{offer.restaurantName}</span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-zinc-900 md:text-3xl">
              {offer.title}
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-zinc-700">
              {offer.description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">Recogida</div>
              <div className="mt-1 text-sm text-zinc-700">{offer.pickupLabel}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200">
                  Stock: {offer.stock}
                </span>
                {(offer.tags || []).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">En producción</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                <li>Foto real subida por el restaurante.</li>
                <li>Franja horaria exacta + cupos por franja.</li>
                <li>Ticket con código + estados en tiempo real.</li>
              </ul>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 lg:sticky lg:top-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs text-zinc-500">Desde</div>
                <div className="text-2xl font-semibold text-zinc-900">
                  {euros(offer.price)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 line-through">
                  {euros(offer.originalPrice)}
                </div>
                <div className="text-xs font-semibold text-amber-700">
                  Ahorro {offer.discountPct}%
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                href={`/restaurants/${offer.restaurantId}?offer=${offer.id}`}
                className="rounded-2xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-amber-700"
              >
                Ver restaurante
              </Link>

              <Link
                href={`/checkout/oferta/${offer.id}`}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Reservar (demo)
              </Link>
            </div>

            <p className="mt-3 text-xs text-zinc-600">
              En MVP es demo. En producción: pago/reserva + ticket.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}