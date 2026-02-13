"use client";

import Link from "next/link";

export default function ErrorOffers({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[100svh] bg-slate-100">
      <div className="mx-auto min-h-[100svh] w-full max-w-[520px] bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
            <h2 className="mt-3 text-base font-bold">
              No hemos podido cargar las ofertas
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Puede ser un fallo temporal del servidor o que la API no esté levantada.
            </p>

            <div className="mt-4 grid gap-2">
              <button
                onClick={() => reset()}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Reintentar
              </button>

              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver al inicio
              </Link>
            </div>

            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                Detalles técnicos
              </summary>
              <pre className="mt-2 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700">{String(
                error?.message ?? "Error",
              )}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
