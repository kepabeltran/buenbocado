"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/offers" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white text-sm font-black">
              BB
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">ofertas de última hora</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Mis pedidos
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            No se han podido cargar las ofertas
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">
            Algo ha fallado al conectar con la API
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-700">
            Puede ser algo temporal. Reintenta y, si sigue igual, revisa que la API
            esté arrancada y accesible desde tu navegador.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => reset()}
              className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Reintentar
            </button>

            <Link
              href="/restaurants"
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver restaurantes
            </Link>
          </div>

          <details className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
              Ver detalle técnico (solo dev)
            </summary>
            <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
{String(error?.message ?? "")}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
}