"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ofertas,
  discountPct,
  ofertaLabelCaduca,
  ofertaLabelRecogida,
} from "../_data/ofertas";

export default function OfertasPage() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    return ofertas
      .map((o) => {
        const caduca = ofertaLabelCaduca(o, now);
        const recogida = ofertaLabelRecogida(o, now);
        const pct = discountPct(o);
        return { o, caduca, recogida, pct };
      })
      .sort((a, b) => {
        // Drops primero (porque son urgentes), programadas después
        if (a.o.cadencia !== b.o.cadencia) return a.o.cadencia === "DROP" ? -1 : 1;
        return 0;
      });
  }, [now]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">
              BB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">ofertas última hora</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Mis pedidos
            </Link>
            <Link
              href="/restaurants"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver restaurantes
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Ofertas</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Drops que caducan rápido + excedentes programados por días.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rows.map(({ o, caduca, recogida, pct }) => {
            const agotado = o.qtyAvailable <= 0;

            return (
              <Link
                key={o.id}
                href={`/ofertas/${o.id}`}
                className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500">{o.restaurantName}</div>
                    <div className="mt-1 text-lg font-semibold leading-snug">{o.titulo}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700"
                        >
                          {t}
                        </span>
                      ))}
                      {pct > 0 && (
                        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                          -{pct}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-zinc-500">
                      {o.cadencia === "PROGRAMADA" ? "Disponible" : "Caduca en"}
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold">{caduca}</div>
                    <div className="mt-2 text-xs text-zinc-500">{recogida}</div>
                    <div className="mt-1 text-xs font-medium text-zinc-700">
                      Stock: {agotado ? "0" : o.qtyAvailable}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-600 line-clamp-2">{o.descripcion}</p>

                <div className="mt-5 text-sm font-semibold text-zinc-900">
                  {o.tipo === "PACK" ? "Ver pack →" : "Ver mesa flash →"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}