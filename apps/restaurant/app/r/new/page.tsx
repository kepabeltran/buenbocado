import { Button, Card, Chip } from "@buenbocado/ui";

export default function NewMenuPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Crear menú
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Publica tu menú en 30 segundos
        </h1>
      </header>
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Tipo
            <select className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm">
              <option>Para llevar</option>
              <option>En el local</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Nombre del menú
            <input
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
              placeholder="Ej. Menú mediterráneo"
            />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Incluye
          <textarea
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
            placeholder="Ensalada, plato principal, bebida..."
            rows={3}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Precio
            <input
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
              placeholder="8,50 €"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Unidades
            <input
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
              placeholder="15"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Franja
            <input
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
              placeholder="19:00 - 20:30"
            />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Caducidad
          <input
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
            placeholder="Hoy 21:00"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Permitir ajuste por tiempo</Chip>
          <span className="text-xs text-slate-500">
            Sin mostrar porcentajes ni precios anteriores
          </span>
        </div>
        <Button type="button">Publicar menú (mock)</Button>
      </Card>
    </section>
  );
}
