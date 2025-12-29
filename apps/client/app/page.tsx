import Link from "next/link";
import { Card } from "@buenbocado/ui";

export default function HomePage() {
  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Buen Bocado
        </p>
        <h1 className="text-4xl font-bold text-slate-900">
          Buen precio, mejor bocado
        </h1>
        <p className="max-w-xl text-slate-700">
          Encuentra menús honestos cerca de ti y reserva en segundos. Sin
          descuentos confusos, solo precio final.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            href="/nearby"
          >
            Ver qué hay cerca
          </Link>
          <a
            className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
            href="http://localhost:3001/r"
          >
            Soy restaurante
          </a>
        </div>
      </header>
      <Card className="grid gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Flujo cliente (MVP)
        </h2>
        <p className="text-sm text-slate-600">
          Home → Qué hay cerca → Detalle menú → Pagar → Ticket/Confirmación.
        </p>
      </Card>
    </section>
  );
}
