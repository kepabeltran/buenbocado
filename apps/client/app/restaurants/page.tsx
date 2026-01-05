import Link from "next/link";
import { restaurants } from "../_data/restaurants";
import CartPill from "../_components/CartPill";

export default function RestaurantsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">
              BB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">restaurantes</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Volver
            </Link>
            <CartPill />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Restaurantes</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Lista demo. El próximo salto será que venga de la API.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold">{r.name}</div>
                  <div className="mt-1 text-sm text-zinc-600">{r.tagline}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right text-sm text-zinc-600">
                  <div className="font-semibold text-zinc-900">
                    {r.rating.toFixed(1)} ★
                  </div>
                  <div className="mt-1">{r.minutes} min</div>
                  <div className="mt-1">{r.distanceKm.toFixed(1)} km</div>
                  <div className="mt-1">{r.price}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  href={`/restaurants/${r.id}`}
                  className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium hover:bg-zinc-50"
                >
                  Ver carta
                </Link>
                <Link
                  href={`/restaurants/${r.id}`}
                  className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Pedir
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}