import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type Menu = {
  id: string;
  restaurant: string;
  type: "TAKEAWAY" | "DINEIN";
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  timeRemaining?: string;
  distanceKm?: number;
  badge?: string | null;
  remaining?: number;
  imageUrl?: string | null;
}
function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
;

function eurosCents(cents: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
      {children}
    </span>
  );
}

async function getActiveMenus(): Promise<Menu[]> {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000";

  const base = rawBase
    .replace("0.0.0.0", "127.0.0.1")
    .replace(/\/$/, "")
    .replace(/\/api\/?$/, "");

  const url = `${base}/api/menus/active?lat=37.176&lng=-3.600`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    clearTimeout(t);
    return [];
  }
}

export default async function HomePage() {
  const menus = await getActiveMenus();

  return (
    <div className="space-y-10">
      <div className="sticky top-4 z-10">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                BB
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">BuenBocado</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    api
                  </span>
                </div>
                <div className="text-xs text-zinc-500">última hora + excedentes</div>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <Link
                href="/portal"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Portal
              </Link>
              <Link
                href="/orders"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Mis pedidos
              </Link>
              <Link
                href="/offers"
                className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Ver ofertas
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
              Drops que caducan · stock limitado · recogida rápida
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              Ahorra comiendo bien con ofertas de última hora
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
              Restaurantes publican excedentes y huecos de reservas caídas. Tú reservas, recibes tu ticket y recoges en tu franja.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/offers"
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Ver ofertas cerca
              </Link>
              <Link
                href="/portal"
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Abrir portal (restaurante)
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
            <div className="text-sm font-semibold text-zinc-900">Conectado a BD</div>
            <p className="mt-1 text-sm text-zinc-600">
              El feed del Home ya viene de Postgres vía API (/api/menus/active?lat=37.176&lng=-3.600). Siguiente: portal real + pedidos + liquidaciones.
            </p>

            <div className="mt-4">
              <Link
                href="/offers"
                className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver ofertas ahora
              </Link>
              <div className="mt-2 text-xs text-zinc-500">(dev) datos sembrados por seed</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Ofertas activas</h2>
            <p className="mt-1 text-sm text-zinc-600">Esto viene de la API / Postgres.</p>
          </div>

          <Link
            href="/offers"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ver todas
          </Link>
        </div>

        {menus.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No hay ofertas activas ahora mismo. (En dev: vuelve a ejecutar el seed)
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {menus.map((m) => (
              <Link
                key={m.id}
                href={`/offers/${m.id}`}
                className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  {m.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="absolute inset-0">
  <img
    src={m.imageUrl}
    alt={m.title}
    className="absolute inset-0 h-full w-full object-cover"
  />
  <div
    className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
    aria-hidden="true"
  />
</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-70" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
                    </>
                  )}

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                      {m.type === "TAKEAWAY" ? "Takeaway" : "En sala"}
                    </span>
                    {m.badge ? (
                      <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                        {m.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute right-4 top-4">
                    <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                      {m.timeRemaining ?? "Activa"}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                        <span className="truncate">{m.restaurant}</span>
                      </div>
                      <div className="mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm">
                        {m.title}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                      <div className="text-sm font-semibold text-zinc-900">{eurosCents(m.priceCents)}</div>
                      <div className="text-xs text-zinc-500">
                        {typeof m.distanceKm === "number" ? `${formatDistance(m.distanceKm)}` : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-zinc-600">{m.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {typeof m.remaining === "number" ? <Badge>Stock: {m.remaining}</Badge> : null}
</div>

                  <div className="mt-4 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                    Ver oferta →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">¿Eres restaurante?</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Publica excedentes o huecos de reservas caídas en segundos. Vende lo que se iba a perder.
        </p>
        <div className="mt-5">
          <Link
            href="/portal"
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Entrar al portal (restaurante)
          </Link>
        </div>
      </section>
    </div>
  );
}