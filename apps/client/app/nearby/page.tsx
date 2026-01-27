import Link from "next/link";
import { Card, Chip } from "@buenbocado/ui";
import { fetchMenus } from "@/lib/api";

export default async function NearbyPage() {
  const menus = await fetchMenus();

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Qué hay cerca
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Menús listos en tu zona
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm">
            <option>Zona Centro</option>
            <option>Zona Norte</option>
            <option>Zona Sur</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <Chip>Para llevar</Chip>
            <Chip>En el local</Chip>
            <Chip>Precio</Chip>
            <Chip>Ordenar</Chip>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {menus.map((menu) => (
          <Card key={menu.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-700">
                {menu.restaurant}
              </p>
              {menu.badge ? (
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                  {menu.badge}
                </span>
              ) : null}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {menu.title}
              </h2>
              <p className="text-sm text-slate-600">{menu.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>
                {menu.type === "TAKEAWAY" ? "Para llevar" : "En el local"}
              </span>
              <span>·</span>
              <span>
                {(menu.priceCents / 100).toFixed(2)} {menu.currency}
              </span>
              <span>·</span>
              <span>{menu.timeRemaining}</span>
              <span>·</span>
              <span>{menu.distanceKm} km</span>
            </div>
            <Link
              className="inline-flex items-center text-sm font-semibold text-brand-700"
              href={`/menu/${menu.id}`}
            >
              Ver detalle →
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
