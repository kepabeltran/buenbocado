import Link from "next/link";
import PhotoHero from "./PhotoHero";
import { notFound } from "next/navigation";

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


function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
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

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 1500): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.replace("0.0.0.0","127.0.0.1"), { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function getMenuById(id: string): Promise<ApiMenu | null> {
  const base = getApiBase();
  const payload = await fetchJsonWithTimeout<{ data: ApiMenu[] }>(
    `${base}/api/menus/active?lat=37.176&lng=-3.600`,
    1500
  );
  const menu = (payload.data ?? []).find((m) => m.id === id);
  return menu ?? null;
}

function eurosFromCents(priceCents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(priceCents / 100);
}

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
  const menu = await getMenuById(params.id);
  if (!menu) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Home
        </Link>
        <Link
          href="/offers"
          className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Ver ofertas
        </Link>
      </header>

      <section className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative aspect-[16/10] w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
{menu.badge ? (
              <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                {menu.badge}
              </span>
            ) : null}
          </div>

          <div className="absolute right-4 top-4">
            <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
              {menu.timeRemaining ? `Caduca en ${menu.timeRemaining}` : "Disponible"}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                <span className="truncate">{menu.restaurant}</span>
                <span className="shrink-0 text-zinc-600">· {menu.type === "DINEIN" ? "Mesa" : "Para llevar"}</span>
                {typeof menu.distanceKm === "number" ? (
                  <span className="shrink-0 text-zinc-600">· {formatDistance(menu.distanceKm)}</span>
                ) : null}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-zinc-900 drop-shadow-sm">
                {menu.title}
              </h1>
      {menu.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
          <PhotoHero src={menu.imageUrl} alt={menu.title} className="mt-4" />
      ) : null}
            </div>

            <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
              <div className="text-sm font-semibold text-zinc-900">
                {eurosFromCents(menu.priceCents, menu.currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-zinc-700">{menu.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/checkout"
              className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Reservar (demo checkout)
            </Link>
            <Link
              href="/portal"
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Portal restaurante
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Nota: esto ya viene de la API. Siguiente paso: crear ofertas reales desde el portal.
          </p>
        </div>
      </section>
    
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-500">Total</div>
            <div className="truncate text-base font-black text-zinc-900">
              {eurosFromCents(menu.priceCents, menu.currency)}
            </div>
          </div>

          <Link
            href={`/checkout/${menu.id}`}
            className="shrink-0 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            Reservar ahora
          </Link>
        </div>
      </div>
</main>
  );
}