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
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  restaurantPhone?: string | null;
  restaurantAddress?: string | null;
};

function getApiBase(): string {
  const rawBase =
    process.env.BUENBOCADO_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000";
  return rawBase.replace(/\/api\/?$/, "");
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function isDineIn(t: ApiMenu["type"]) {
  return t === "DINEIN" || t === "DINE_IN";
}

async function getMenuById(id: string): Promise<ApiMenu | null> {
  const base = getApiBase();
  const url = `${base}/api/menus/active?lat=37.176&lng=-3.600`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const payload = (await res.json()) as { data: ApiMenu[] };
  return payload.data.find((m) => m.id === id) ?? null;
}

function googleMapsUrl(lat: number | null | undefined, lng: number | null | undefined, address: string | null | undefined) {
  if (lat && lng) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return null;
}

function whatsappUrl(phone: string | null | undefined) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length < 9) return null;
  return `https://wa.me/${cleaned.replace("+", "")}`;
}

export default async function OfferDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const menu = await getMenuById(params.id);

  if (!menu) {
    return (
      <main className="min-h-screen bg-[#fafdf7] px-4 py-10">
        <div className="mx-auto max-w-[480px]">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver a ofertas
          </Link>
          <div className="mt-6 rounded-2xl bg-white border border-slate-100 p-8 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 grid place-items-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h1 className="mt-3 text-base font-extrabold text-slate-900">Oferta no encontrada</h1>
            <p className="mt-1.5 text-sm text-slate-400">Puede que haya caducado o que el listado haya cambiado.</p>
            <Link href="/offers" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
              Ver ofertas activas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mapsUrl = googleMapsUrl(menu.restaurantLat, menu.restaurantLng, menu.restaurantAddress);
  const waUrl = whatsappUrl(menu.restaurantPhone);
  const base = getApiBase();
  const imgSrc = menu.imageUrl
    ? menu.imageUrl.startsWith("/uploads/")
      ? `${base}${menu.imageUrl}`
      : menu.imageUrl.replace("http://127.0.0.1:4000", base).replace("http://localhost:4000", base)
    : null;

  return (
    <main className="min-h-screen bg-[#fafdf7]">
      <div className="mx-auto max-w-[480px]">

        {/* Header con botón volver */}
        <div className="sticky top-0 z-30 bg-[#fafdf7]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Ofertas
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
        </div>

        {/* Imagen grande */}
        {imgSrc && (
          <div className="px-4">
            <div className="overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                <img src={imgSrc} alt={menu.title} className="h-full w-full object-cover" loading="lazy" />
                {/* Badges sobre imagen */}
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm">
                    {isDineIn(menu.type) ? "En local" : "Para llevar"}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {menu.timeRemaining}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info del plato */}
        <div className="px-4 pt-4 pb-8">
          <p className="text-xs font-bold text-emerald-600">{menu.restaurant}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">{menu.title}</h1>

          {menu.description && (
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{menu.description}</p>
          )}

          {/* Precio y datos */}
          <div className="mt-4 flex items-center gap-2.5 flex-wrap">
            <span className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-extrabold text-white">
              {formatEuros(menu.priceCents)}
            </span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
              {menu.timeRemaining}
            </span>
            {menu.distanceKm != null && (
              <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                {menu.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>

          {/* Dirección */}
          {menu.restaurantAddress && (
            <div className="mt-5 rounded-xl bg-white border border-slate-100 px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <div>
                <p className="text-xs text-slate-400 font-medium">Dirección</p>
                <p className="text-sm font-bold text-slate-700">{menu.restaurantAddress}</p>
              </div>
            </div>
          )}

          {/* Botón principal */}
          <div className="mt-6">
            <Link
              href={`/checkout/oferta/${menu.id}`}
              className="block w-full rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
            >
              Reservar por {formatEuros(menu.priceCents)}
            </Link>
          </div>

          {/* Botones secundarios */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Cómo llegar
              </a>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                WhatsApp
              </a>
            )}
          </div>

          {/* Volver a ofertas */}
          <div className="mt-4">
            <Link
              href="/offers"
              className="block w-full rounded-xl bg-white border border-slate-200 py-3 text-center text-sm font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
            >
              Seguir viendo ofertas
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
