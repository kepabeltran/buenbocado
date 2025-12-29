import Link from "next/link";
import { Card, Chip } from "@buenbocado/ui";

export default function RestaurantDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Restaurante
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Panel MVP</h1>
        <p className="text-sm text-slate-600">
          Publica un menú en 30s y revisa pedidos activos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm text-slate-600">Menús activos</p>
          <p className="text-2xl font-bold text-slate-900">3</p>
          <Chip>Precio ajustado permitido</Chip>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-600">Pedidos en curso</p>
          <p className="text-2xl font-bold text-slate-900">5</p>
          <Chip>Preparando</Chip>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-600">Entregados hoy</p>
          <p className="text-2xl font-bold text-slate-900">12</p>
          <Chip>Listo</Chip>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          href="/r/new"
        >
          Crear menú
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
          href="/r/orders"
        >
          Ver pedidos
        </Link>
      </div>
    </section>
  );
}
