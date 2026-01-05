import Link from "next/link";
import { offers, euros, type Offer } from "../_data/offers";

type SP = { q?: string; kind?: "drop" | "planned"; sort?: "urgency" | "discount" | "price" };

function norm(s: string) {
  return (s || "").toLowerCase().trim();
}

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.length) sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function timeLabel(o: Offer) {
  return o.kind === "planned"
    ? `Disponible ${o.durationDays ?? 1} días`
    : `Caduca en ${o.expiresInMin ?? 0} min`;
}

function kindLabel(o: Offer) {
  return o.kind === "planned" ? "Excedente" : "Última hora";
}

export default function OffersPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams?.q || "").toString();
  const kind = searchParams?.kind;
  const sort = searchParams?.sort || "urgency";

  let list = offers.slice();

  if (kind) list = list.filter((o) => o.kind === kind);

  const nq = norm(q);
  if (nq) {
    list = list.filter((o) => {
      const hay = `${o.restaurantName} ${o.title} ${o.description}`.toLowerCase();
      return hay.includes(nq);
    });
  }

  if (sort === "discount") {
    list.sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));
  } else if (sort === "price") {
    list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else {
    // urgency: primero los drops que caducan antes; luego planned
    list.sort((a, b) => {
      const ax = a.kind === "drop" ? (a.expiresInMin ?? 9999) : 99999;
      const bx = b.kind === "drop" ? (b.expiresInMin ?? 9999) : 99999;
      return ax - bx;
    });
  }

  const hrefAll = buildHref("/offers", { q: q || undefined, sort });
  const hrefDrop = buildHref("/offers", { q: q || undefined, kind: "drop", sort });
  const hrefPlanned = buildHref("/offers", { q: q || undefined, kind: "planned", sort });
  const hrefClear = buildHref("/offers", {});

  return (
    <div className="space-y-6">
      {/* Header con “look app” */}
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-7">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-rose-50 to-indigo-100 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.9),transparent_55%)]" />
          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Ofertas</h1>
                <p className="mt-1 text-sm text-zinc-700">
                  Última hora + excedentes. Stock limitado.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Home
                </Link>
                <Link
                  href="/orders"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Mis pedidos
                </Link>
              </div>
            </div>

            {/* Buscador + filtros (funcionales via query params) */}
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <form action="/offers" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por restaurante o por oferta…"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
                <input type="hidden" name="kind" value={kind ?? ""} />
                <input type="hidden" name="sort" value={sort} />
                <button
                  type="submit"
                  className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Buscar
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={hrefAll}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                    !kind ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  Todas
                </Link>
                <Link
                  href={hrefDrop}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                    kind === "drop"
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  Última hora
                </Link>
                <Link
                  href={hrefPlanned}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                    kind === "planned"
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  Excedentes
                </Link>

                {(q || kind) && (
                  <Link
                    href={hrefClear}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Limpiar
                  </Link>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={buildHref("/offers", { q: q || undefined, kind, sort: "urgency" })}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    sort === "urgency" ? "bg-white border-zinc-400 text-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Urgencia
                </Link>
                <Link
                  href={buildHref("/offers", { q: q || undefined, kind, sort: "discount" })}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    sort === "discount" ? "bg-white border-zinc-400 text-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Descuento
                </Link>
                <Link
                  href={buildHref("/offers", { q: q || undefined, kind, sort: "price" })}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    sort === "price" ? "bg-white border-zinc-400 text-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Precio
                </Link>
              </div>
            </div>

            <div className="mt-4 text-sm text-zinc-700">
              Mostrando <span className="font-semibold text-zinc-900">{list.length}</span> ofertas
            </div>
          </div>
        </div>
      </section>

      {/* Grid de tarjetas (100% clicables) */}
      <div className="grid gap-5 md:grid-cols-2">
        {list.map((o) => (
          <Link
            key={o.id}
            href={`/offers/${o.id}`}
            className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
          >
            {/* hueco foto */}
            <div className="relative aspect-[16/10] w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-75" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-black/5" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                  -{o.discountPct}%
                </span>
                <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                  {kindLabel(o)}
                </span>
              </div>

              <div className="absolute right-4 top-4">
                <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                  {timeLabel(o)}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                    <span className="truncate">{o.restaurantName}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm">
                    {o.title}
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                  <div className="text-sm font-semibold text-zinc-900">{euros(o.price)}</div>
                  <div className="text-xs text-zinc-500 line-through">{euros(o.originalPrice)}</div>
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm text-zinc-600">{o.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {o.pickupLabel}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  Stock: {o.stock}
                </span>
                {(o.tags || []).slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                Ver oferta →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}