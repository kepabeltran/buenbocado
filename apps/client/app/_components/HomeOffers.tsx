"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ofertas,
  discountPct,
  ofertaLabelCaduca,
  ofertaLabelRecogida,
} from "../_data/ofertas";

export default function HomeOffers() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const top = useMemo(() => {
    // Orden: primero los drops que caducan antes, luego programadas
    return ofertas
      .map((o) => {
        const caduca = ofertaLabelCaduca(o, now);
        const recogida = ofertaLabelRecogida(o, now);
        const pct = discountPct(o);
        return { o, caduca, recogida, pct };
      })
      .slice(0, 4);
  }, [now]);

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Ofertas cerca de ti</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Última hora y excedentes con descuento. Caducan rápido o se programan por días.
          </p>
        </div>
        <Link
          href="/ofertas"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {top.map(({ o, caduca, recogida, pct }) => {
          const agotado = o.qtyAvailable <= 0;

          return (
            <Link
              key={o.id}
              href={`/ofertas/${o.id}`}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500">{o.restaurantName}</div>
                  <div className="mt-1 text-base font-semibold leading-snug">{o.titulo}</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {pct > 0 && (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                        -{pct}%
                      </span>
                    )}
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                      {recogida}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                      Stock: {agotado ? "0" : o.qtyAvailable}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-500">
                    {o.cadencia === "PROGRAMADA" ? "Disponible" : "Caduca en"}
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold">{caduca}</div>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-600 line-clamp-2">{o.descripcion}</p>

              <div className="mt-4 text-sm font-semibold text-zinc-900">Ver oferta →</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}