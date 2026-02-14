import Link from "next/link";
import type { ReactNode } from "react";
import CartPill from "../_components/CartPill";

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

type SearchParams = {
  sort?: "near" | "soon";
  type?: "TAKEAWAY" | "DINEIN";
  under10?: "1";
};

function getApiBase(): string {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:4000";
  return rawBase.replace(/\/api\/?$/, "");
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

// "74 min", "1h 20m", "01:12:33" → minutos (aprox)
function parseRemainingMinutes(s: string): number {
  const v = (s ?? "").trim().toLowerCase();

  const hhmm = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);

  const h = v.match(/(\d+)\s*h/);
  const m = v.match(/(\d+)\s*m/);
  if (h || m) return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);

  const n = v.match(/(\d+)/);
  return n ? Number(n[1]) : 10_000;
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

function fixImageUrl(apiBase: string, u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${apiBase}${u}`;
  return u
    .replace("http://127.0.0.1:4000", apiBase)
    .replace("http://localhost:4000", apiBase);
}

async function getActiveMenus(base: string): Promise<ApiMenu[]> {
  // DEV: hardcode para distancia "real" mientras no usamos geolocalización
  const lat = "37.176";
  const lng = "-3.600";

  const res = await fetch(
    `${base}/api/menus/active?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
      lng,
    )}`,
    { cache: "no-store" },
  );

  if (!res.ok) throw new Error(`MENUS_ACTIVE_${res.status}`);

  const json = (await res.json().catch(() => null)) as { data?: ApiMenu[] } | null;
  return Array.isArray(json?.data) ? json.data : [];
}

function qsHref(base: string, sp: Record<string, string | undefined>) {
  const u = new URL(base, "http://local");
  Object.entries(sp).forEach(([k, v]) => {
    if (!v) u.searchParams.delete(k);
    else u.searchParams.set(k, v);
  });
  const q = u.searchParams.toString();
  return q ? `${base}?${q}` : base;
}

function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold transition " +
        (active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
      }
    >
      {children}
    </Link>
  );
}

function OfferRow({ apiBase, m }: { apiBase: string; m: ApiMenu }) {
  const img = fixImageUrl(apiBase, m.imageUrl);
  const dineIn = isDineIn(m.type);
  const mins = parseRemainingMinutes(m.timeRemaining);

  const isHot = mins <= 60;
  const isCritical = mins <= 30;

  const timeLabel = isHot ? `Últimos ${m.timeRemaining}` : `Caduca en ${m.timeRemaining}`;

  const urgencyPill =
    isCritical
      ? "bg-rose-100 text-rose-800"
      : isHot
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";

  const urgencyRing =
    isCritical
      ? "ring-2 ring-rose-200"
      : isHot
        ? "ring-2 ring-amber-200"
        : "ring-1 ring-slate-200";

  return (
    <Link
      href={`/offers/${m.id}`}
      className={[
        "group flex items-stretch gap-3 rounded-2xl bg-white p-3 shadow-sm transition",
        "hover:-translate-y-[1px] hover:shadow-md",
        urgencyRing,
      ].join(" ")}
    >
      <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={m.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-200 via-white to-slate-200">
            <span className="text-xs font-black text-slate-600">BB</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-500">{m.restaurant}</div>

            <div className="truncate text-sm font-black text-slate-900">{m.title}</div>

            {m.description ? (
              <div className="mt-1 line-clamp-1 text-xs text-slate-600">{m.description}</div>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <div className="text-lg font-black text-slate-900">{formatEuros(m.priceCents)}</div>
            <div className="text-xs font-semibold text-slate-500">{m.distanceKm.toFixed(1)} km</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {dineIn ? "En local" : "Para llevar"}
          </span>

          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyPill}`}>
            {timeLabel}
          </span>

          {m.badge ? (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              {m.badge}
            </span>
          ) : null}

          <span className="ml-auto inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-800">
            Reservar
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const apiBase = getApiBase();
  const items = await getActiveMenus(apiBase);

  const sort = searchParams?.sort ?? "near";
  const type = searchParams?.type;
  const under10 = searchParams?.under10 === "1";

  let filtered = items.slice();

  if (type === "TAKEAWAY") filtered = filtered.filter((m) => !isDineIn(m.type));
  if (type === "DINEIN") filtered = filtered.filter((m) => isDineIn(m.type));
  if (under10) filtered = filtered.filter((m) => (m.priceCents ?? 0) <= 1000);

  filtered.sort((a, b) => {
    if (sort === "soon")
      return parseRemainingMinutes(a.timeRemaining) - parseRemainingMinutes(b.timeRemaining);
    return a.distanceKm - b.distanceKm;
  });

  const countLabel = filtered.length === 1 ? "1 oferta" : `${filtered.length} ofertas`;

  return (
    <main className="min-h-[100svh] bg-slate-50 md:bg-slate-100 md:bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(15,23,42,0.08),transparent_60%)]">
      <div className="mx-auto w-full md:flex md:justify-center md:px-6 md:py-10">
        <div className="w-full bg-[#F3F7FF] md:max-w-[440px] md:overflow-hidden md:rounded-[32px] md:border md:border-slate-200 md:shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur md:static">
            {/* Top row con más aire */}
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <Link href="/offers" className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-black text-white">
                  BB
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">BuenBocado</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Última hora · precio cerrado
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href="http://localhost:3001/login" 
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Soy restaurante
                </Link>

                <CartPill />
              </div>
            </div>

            {/* Bloque de título separado (menos apelotonado) */}
            <div className="px-4 pb-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Ofertas cerca de ti
                </h1>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {countLabel}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ● En vivo
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Reserva en segundos. Recoge con código.
              </p>

              {/* Chips con más margen y un pelín más compactos */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ChipLink
                  href={qsHref("/offers", { sort: "near", type, under10: under10 ? "1" : undefined })}
                  active={sort === "near"}
                >
                  Cerca
                </ChipLink>
                <ChipLink
                  href={qsHref("/offers", { sort: "soon", type, under10: under10 ? "1" : undefined })}
                  active={sort === "soon"}
                >
                  Caduca pronto
                </ChipLink>
                <ChipLink
                  href={qsHref("/offers", { sort, type, under10: under10 ? undefined : "1" })}
                  active={under10}
                >
                  &lt; 10 €
                </ChipLink>
                <ChipLink
                  href={qsHref("/offers", {
                    sort,
                    type: type === "TAKEAWAY" ? undefined : "TAKEAWAY",
                    under10: under10 ? "1" : undefined,
                  })}
                  active={type === "TAKEAWAY"}
                >
                  Para llevar
                </ChipLink>
                <ChipLink
                  href={qsHref("/offers", {
                    sort,
                    type: type === "DINEIN" ? undefined : "DINEIN",
                    under10: under10 ? "1" : undefined,
                  })}
                  active={type === "DINEIN"}
                >
                  En local
                </ChipLink>
                <ChipLink href="/offers" active={false}>
                  Quitar filtros
                </ChipLink>
              </div>
            </div>
          </header>

          {/* Más espacio antes del listado */}
          <section className="px-4 pb-24 pt-6">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-black">Sin ofertas ahora</div>
                <p className="mt-2 text-sm text-slate-600">
                  Esto cambia rápido. Vuelve en unos minutos o quita filtros.
                </p>
                <div className="mt-4">
                  <Link
                    href="/offers"
                    className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Reintentar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((m) => (
                  <OfferRow key={m.id} apiBase={apiBase} m={m} />
                ))}
              </div>
            )}
          </section>

          {/* Bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-[520px] px-2 pb-[env(safe-area-inset-bottom)]">
              <Link
                href="/offers"
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-900"
                aria-current="page"
              >
                <span className="h-1 w-10 rounded-full bg-slate-900" />
                Ofertas
              </Link>
              <Link
                href="/checkout"
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500"
              >
                <span className="h-1 w-10 rounded-full bg-transparent" />
                Carrito
              </Link>
              <Link
                href="/account"
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500"
              >
                <span className="h-1 w-10 rounded-full bg-transparent" />
                Cuenta
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}
