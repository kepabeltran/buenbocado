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

type SearchParams = Record<string, string | string[] | undefined>;

function first(sp: SearchParams | undefined, key: string): string | undefined {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

function buildHref(basePath: string, sp: SearchParams | undefined, next: Record<string, string | undefined>) {
  const merged: Record<string, string> = {};

  // Copy current params
  if (sp) {
    for (const [k, v] of Object.entries(sp)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (typeof val === "string" && val.length) merged[k] = val;
    }
  }

  // Apply overrides (undefined => delete)
  for (const [k, v] of Object.entries(next)) {
    if (typeof v === "string" && v.length) merged[k] = v;
    else delete merged[k];
  }

  const qs = new URLSearchParams(merged);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function getApiBase(): string {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000";

  return rawBase.replace(/\/api\/?$/, "");
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function parseTimeRemainingToMinutes(input: string | null | undefined): number {
  if (!input) return Number.POSITIVE_INFINITY;
  const s = String(input).trim().toLowerCase();

  // Formats we commonly see:
  //  - "37 min" / "37m"
  //  - "2 h" / "2h"
  //  - "1 h 15 min" / "1h 15m"
  //  - "00:45" (mm:ss or hh:mm in some UIs)
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const a = Number(hhmm[1]);
    const b = Number(hhmm[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      // Interpret as mm:ss if under 3 hours, else hh:mm
      return a >= 3 ? a * 60 + b : a;
    }
  }

  const h = s.match(/(\d+(?:[\.,]\d+)?)\s*h/);
  const m = s.match(/(\d+(?:[\.,]\d+)?)\s*m/);
  const hours = h ? Number(h[1].replace(",", ".")) : 0;
  const mins = m ? Number(m[1].replace(",", ".")) : 0;
  const total = hours * 60 + mins;
  if (Number.isFinite(total) && total > 0) return total;

  // Fallback: first number we find, assume minutes.
  const n = s.match(/\d+/);
  return n ? Number(n[0]) : Number.POSITIVE_INFINITY;
}

async function getActiveMenus(): Promise<ApiMenu[]> {
  const base = getApiBase();

  // DEV: hardcode para distancia "real" mientras no usamos geolocalización
  const lat = "37.176";
  const lng = "-3.600";

  const res = await fetch(
    `${base}/api/menus/active?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    { cache: "no-store" },
  );

  if (!res.ok) return [];
  const json = (await res.json()) as { data?: ApiMenu[] };
  return Array.isArray(json?.data) ? json.data : [];
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function fixImageUrl(u: string | null | undefined) {
  if (!u) return u as any;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u
    .replace("http://127.0.0.1:4000", API_BASE)
    .replace("http://localhost:4000", API_BASE);
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const items = await getActiveMenus();

  // ---- filters (server-side, via query params) ----
  const sort = (first(searchParams, "sort") ?? "distance").toLowerCase();
  const type = (first(searchParams, "type") ?? "").toUpperCase();
  const max = first(searchParams, "max");
  const maxCents = max ? Math.round(Number(max) * 100) : undefined;

  const filtered = items
    .filter((m) => {
      if (type === "TAKEAWAY") return !isDineIn(m.type);
      if (type === "DINEIN") return isDineIn(m.type);
      return true;
    })
    .filter((m) => {
      if (!Number.isFinite(maxCents as any)) return true;
      return m.priceCents <= (maxCents as number);
    })
    .sort((a, b) => {
      if (sort === "expiry") {
        return (
          parseTimeRemainingToMinutes(a.timeRemaining) -
          parseTimeRemainingToMinutes(b.timeRemaining)
        );
      }
      // default: distance
      return a.distanceKm - b.distanceKm;
    });

  const isActive = {
    expiry: sort === "expiry",
    distance: sort === "distance",
    under10: typeof maxCents === "number" && maxCents <= 1000,
    takeaway: type === "TAKEAWAY",
    dinein: type === "DINEIN",
  };

  const chipBase = "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition";
  const chipOn = "border-zinc-900 bg-zinc-900 text-white";
  const chipOff = "border-zinc-200 bg-white/70 text-zinc-800 hover:bg-white";

  const needsBottomSpace = "pb-24 sm:pb-8";

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] text-zinc-900">
      {/* Header */}
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
              href="/orders"
              className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:inline-flex"
            >
              Mis pedidos
            </Link>
            <Link
              href="/r/login"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              title="Acceso restaurante"
            >
              Soy restaurante
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className={`mx-auto w-full max-w-6xl space-y-6 px-4 py-8 ${needsBottomSpace}`}>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            En vivo
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">Ofertas cerca de ti</h1>
          <p className="mt-1 text-sm text-zinc-700">Reserva en segundos. Sin historias.</p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref("/offers", searchParams, { sort: isActive.expiry ? undefined : "expiry" })}
            className={`${chipBase} ${isActive.expiry ? chipOn : chipOff}`}
          >
            Caduca pronto
          </Link>

          <Link
            href={buildHref("/offers", searchParams, { sort: isActive.distance ? undefined : "distance" })}
            className={`${chipBase} ${isActive.distance ? chipOn : chipOff}`}
          >
            Cerca
          </Link>

          <Link
            href={buildHref("/offers", searchParams, { max: isActive.under10 ? undefined : "10" })}
            className={`${chipBase} ${isActive.under10 ? chipOn : chipOff}`}
          >
            &lt; 10 €
          </Link>

          <Link
            href={buildHref("/offers", searchParams, { type: isActive.takeaway ? undefined : "TAKEAWAY" })}
            className={`${chipBase} ${isActive.takeaway ? chipOn : chipOff}`}
          >
            Para llevar
          </Link>

          <Link
            href={buildHref("/offers", searchParams, { type: isActive.dinein ? undefined : "DINEIN" })}
            className={`${chipBase} ${isActive.dinein ? chipOn : chipOff}`}
          >
            En local
          </Link>

          {(isActive.expiry || isActive.under10 || isActive.takeaway || isActive.dinein) && (
            <Link
              href="/offers"
              className={`${chipBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`}
              title="Quitar filtros"
            >
              Limpiar
            </Link>
          )}
        </div>

        {/* List / Empty */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  Sin ofertas ahora
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">
                  Ahora mismo no hay ofertas que encajen
                </h2>
                <p className="mt-2 max-w-xl text-sm text-zinc-700">
                  Esto cambia rápido. Prueba a limpiar filtros o vuelve en unos minutos.
                </p>

                <div className="mt-4 text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Tip:</span> en producción usaremos tu ubicación real.
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:w-60">
                <Link
                  href="/offers"
                  className="rounded-2xl bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Reintentar
                </Link>
                <Link
                  href="/offers"
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Limpiar filtros
                </Link>
                <Link
                  href="/r/login"
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Soy restaurante
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">{filtered.length}</span> oferta{filtered.length === 1 ? "" : "s"}
              {items.length !== filtered.length ? (
                <> (de {items.length})</>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => {
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
                              src={fixImageUrl(m.imageUrl as string)}
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
                            {isDineIn(m.type) ? "En local" : "Para llevar"}
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
          </>
        )}
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/80 backdrop-blur sm:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-4 py-3">
          <Link href="/offers" className="text-sm font-semibold text-zinc-900">
            Ofertas
          </Link>
          <Link href="/orders" className="text-sm font-semibold text-zinc-600">
            Pedidos
          </Link>
          <Link href="/r/login" className="text-sm font-semibold text-zinc-600">
            Cuenta
          </Link>
        </div>
      </nav>
    </main>
  );
}
