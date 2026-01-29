import Link from "next/link";

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

function getApiBase(): string {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:4000";

  // Normaliza: si viene con /api al final, lo quitamos
  return rawBase.replace(/\/api\/?$/, "");
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

async function getActiveMenus(base: string): Promise<ApiMenu[]> {
  // DEV: hardcode para distancia "real" mientras no usamos geolocalización
  const lat = "37.176";
  const lng = "-3.600";

  const res = await fetch(
    `${base}/api/menus/active?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    { cache: "no-store" },
  );

  // Si la API falla, mostramos pantalla de error (error.tsx)
  if (!res.ok) {
    throw new Error(`MENUS_ACTIVE_${res.status}`);
  }

  const json = (await res.json().catch(() => null)) as { data?: ApiMenu[] } | null;
  return Array.isArray(json?.data) ? json.data : [];
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

function fixImageUrl(apiBase: string, u: string | null | undefined) {
  if (!u) return u as any;
  if (u.startsWith("/uploads/")) return `${apiBase}${u}`;

  return u
    .replace("http://127.0.0.1:4000", apiBase)
    .replace("http://localhost:4000", apiBase);
}

export default async function OffersPage() {
  const apiBase = getApiBase();
  const items = await getActiveMenus(apiBase);
  const sorted = items.slice().sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/offers" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white text-sm font-black">
              BB
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">ofertas de última hora</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/restaurants"
              className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:inline-flex"
            >
              Restaurantes
            </Link>
            <Link
              href="/orders"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Mis pedidos
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            En vivo
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
            Ofertas cerca de ti
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            Reserva en segundos. Sin historias.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="min-h-[60svh] flex items-start sm:items-center">
            <div className="w-full rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  Sin ofertas ahora
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">
                  Ahora mismo no hay ofertas activas
                </h2>
                <p className="mt-2 max-w-xl text-sm text-zinc-700">
                  Esto cambia rápido. Vuelve en unos minutos y aparecerán nuevas
                  oportunidades.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:w-60">
                <Link
                  href="/offers"
                  className="rounded-2xl bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Reintentar
                </Link>
                <Link
                  href="/restaurants"
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Ver restaurantes
                </Link>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">Cómo funciona</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-500">1 · Elige</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">Una oferta cerca</div>
                  <div className="mt-1 text-xs text-zinc-600">Precio cerrado y tiempo limitado.</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-500">2 · Reserva</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">En segundos</div>
                  <div className="mt-1 text-xs text-zinc-600">Sin llamadas. Sin líos.</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-500">3 · Disfruta</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">Muestra tu código</div>
                  <div className="mt-1 text-xs text-zinc-600">Buen precio, mejor bocado.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {sorted.map((m) => {
              const hasImg = !!m.imageUrl;

              return (
                <div
                  key={m.id}
                  className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
                >
                  <Link
                    href={`/offers/${m.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Ver oferta: ${m.title}`}
                  >
                    <span className="sr-only">Ver oferta</span>
                  </Link>

                  <div className="relative z-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      {hasImg ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fixImageUrl(apiBase, m.imageUrl as string)}
                            alt={m.title}
                            className="absolute inset-0 h-full w-full object-cover object-center"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-75" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
                        </>
                      )}

                      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-black/5" />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                          {isDineIn(m.type) ? "En mesa" : "Para llevar"}
                        </span>
                        {m.badge && (
                          <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                            {m.badge}
                          </span>
                        )}
                      </div>

                      <div className="absolute right-4 top-4">
                        <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                          Caduca en: {m.timeRemaining}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                            <span className="truncate">{m.restaurant}</span>
                          </div>

                          <div
                            className={
                              hasImg
                                ? "mt-2 text-lg font-semibold text-white drop-shadow"
                                : "mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm"
                            }
                          >
                            {m.title}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                          <div className="text-sm font-semibold text-zinc-900">
                            {formatEuros(m.priceCents)}
                          </div>
                          <div className="text-xs text-zinc-700">
                            {m.distanceKm.toFixed(1)} km
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <p className="text-sm text-zinc-700 line-clamp-3">
                        {m.description ?? "Oferta disponible por tiempo limitado."}
                      </p>

                      <div className="flex items-center justify-end">
                        <span className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50">
                          Ver detalle
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}