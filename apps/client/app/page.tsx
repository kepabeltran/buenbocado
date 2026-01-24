import Link from "next/link";

export const dynamic = "force-dynamic";

type ApiMenu = {
  id: string;
  restaurant: string;
  type: "TAKEAWAY" | "DINEIN";
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  timeRemaining?: string | null;
  distanceKm?: number | null;
  badge?: string | null;
};

function getApiBase(): string {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000";

  return rawBase
    .replace("0.0.0.0", "127.0.0.1")
    .replace(/\/$/, "")
    .replace(/\/api\/?$/, "");
}

async function fetchActiveMenus(timeoutMs = 1500): Promise<ApiMenu[]> {
  const base = getApiBase();
  const url = `${base}/api/menus/active`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: ApiMenu[] };
    return json.data ?? [];
  } finally {
    clearTimeout(t);
  }
}

function eurosFromCents(priceCents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(priceCents / 100);
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700">
      {children}
    </span>
  );
}

export default async function HomePage() {
  let modeLabel: "api" | "offline" = "api";
  let menus: ApiMenu[] = [];

  try {
    menus = await fetchActiveMenus(1500);
  } catch {
    modeLabel = "offline";
    menus = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      {/* Top bar (estilo app) */}
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
                  <span
                    className={
                      modeLabel === "api"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700"
                    }
                  >
                    {modeLabel}
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

      {/* Hero */}
      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
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
                Entrar al portal
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">Rápido</div>
                <div className="mt-1 text-xs text-zinc-600">Reservas en segundos.</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">Ticket</div>
                <div className="mt-1 text-xs text-zinc-600">Código de recogida.</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {modeLabel === "api" ? "Conectado a API" : "API no disponible"}
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  {modeLabel === "api" ? "Feed real desde /api/menus/active." : "Arranca la API y recarga (F5)."}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
            <div className="text-sm font-semibold text-zinc-900">Listo para MVP</div>
            <p className="mt-1 text-sm text-zinc-600">
              Siguiente: publicar ofertas desde el portal + pedidos + liquidaciones.
            </p>

            <div className="mt-4">
              <Link
                href="/offers"
                className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver ofertas ahora
              </Link>
              <div className="mt-2 text-xs text-zinc-500">
                Sin modo demo: si la API cae, verás &quot;offline&quot;.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="mt-8 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Ofertas disponibles</h2>
            <p className="mt-1 text-sm text-zinc-600">Directo desde la API.</p>
          </div>

          <Link
            href="/offers"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ver todas
          </Link>
        </div>

        {menus.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
            No hay ofertas (o la API está offline). Prueba a arrancar la API y recargar.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {menus.slice(0, 4).map((m) => (
              <Link
                key={m.id}
                href={`/offers/${m.id}`}
                className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-70" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                      {m.type === "DINEIN" ? "Mesa" : "Takeaway"}
                    </span>
                    {m.badge ? (
                      <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                        {m.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute right-4 top-4">
                    <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                      {m.timeRemaining ? `Caduca en ${m.timeRemaining}` : "Disponible"}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                        <span className="truncate">{m.restaurant}</span>
                        {typeof m.distanceKm === "number" ? (
                          <span className="shrink-0 text-zinc-600">· {m.distanceKm.toFixed(1)} km</span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm">
                        {m.title}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                      <div className="text-sm font-semibold text-zinc-900">
                        {eurosFromCents(m.priceCents, m.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-zinc-600">{m.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>Confirmación rápida</Pill>
                    <Pill>Ticket</Pill>
                    <Pill>Entrega en portal</Pill>
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
    </main>
  );
}
