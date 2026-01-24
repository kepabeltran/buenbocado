import Link from "next/link";
import { restaurants } from "../_data/restaurants";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
      {children}
    </span>
  );
}

export default function RestaurantEntryPage() {
  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-white text-xs font-bold">
                BB
              </span>
              Acceso restaurante (demo)
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
              Panel del restaurante
            </h1>
            <p className="mt-1 text-sm text-zinc-700">
              En demo eliges restaurante aquí. En producción entrarás identificado (sin selector).
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/portal"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Portal
            </Link>
            <Link
              href="/offers"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ofertas
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Home
            </Link>
          </nav>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {restaurants.map((r) => {
            const zone =
              (r.neighborhood ? r.neighborhood + (r.city ? " · " : "") : "") +
              (r.city ?? "");

            return (
              <Link
                key={r.id}
                href={`/r/${encodeURIComponent(r.id)}`}
                className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-75" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.92),transparent_55%)]" />
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-black/5" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {r.priceLevel ? (
                      <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                        {r.priceLevel}
                      </span>
                    ) : null}
                    {zone ? (
                      <span className="rounded-full border border-white/30 bg-white/75 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                        {zone}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xl font-black tracking-tight text-zinc-900">
                      {r.name}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">{r.tagline}</div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {r.address ? <Chip>{r.address}</Chip> : null}
                    <Chip>Entrar al panel →</Chip>
                  </div>

                  <div className="mt-4 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                    Abrir /r/{r.id} →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
