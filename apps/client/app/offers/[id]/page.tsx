import Link from "next/link";
import { formatEuros } from "../../_data/restaurants";

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
    "http://127.0.0.1:4000";

  return rawBase.replace(/\/api\/?$/, "");
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

async function getMenuById(id: string): Promise<ApiMenu | null> {
  const base = getApiBase();

  // DEV: mantenemos lat/lng fijo para distancia "real" (como acordamos)
  const url = `${base}/api/menus/active?lat=37.176&lng=-3.600`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const payload = (await res.json()) as { data: ApiMenu[] };
  return payload.data.find((m) => m.id === id) ?? null;
}

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
  const menu = await getMenuById(params.id);

  if (!menu) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/offers" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a ofertas
        </Link>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold">Oferta no encontrada</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Puede que haya caducado o que el listado haya cambiado. Vuelve a ofertas y entra de nuevo.
          </p>
          <div className="mt-6">
            <Link
              href="/offers"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver ofertas activas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/offers" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← Volver a ofertas
      </Link>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-xs text-zinc-500">
          {menu.restaurant} · {isDineIn(menu.type) ? "DINEIN" : "TAKEAWAY"}
        </div>

        <h1 className="mt-2 text-2xl font-semibold">{menu.title}</h1>

        {menu.imageUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            <div className="relative aspect-[16/10] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={menu.imageUrl}
                alt={menu.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
            {formatEuros(menu.priceCents)}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
            {menu.timeRemaining}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
            {menu.distanceKm.toFixed(1)} km
          </span>
          {menu.badge ? (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
              {menu.badge}
            </span>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-zinc-700">
          {menu.description ?? "Oferta disponible por tiempo limitado."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/checkout/oferta/${menu.id}`}
            className="inline-flex justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Reservar
          </Link>

          <Link
            href="/offers"
            className="inline-flex justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Seguir viendo ofertas
          </Link>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          ID: <span className="font-mono">{menu.id}</span>
        </div>
      </div>
    </main>
  );
}