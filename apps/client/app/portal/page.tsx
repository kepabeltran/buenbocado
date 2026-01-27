import Link from "next/link";

export default function PortalHome() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Portal Restaurante</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Publica ofertas en segundos y revisa liquidaciones/contabilidad básica.
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href="/portal/crear-oferta"
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Crear oferta
          </Link>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Próximo: lista de ofertas (CRUD), pedidos y mini-contabilidad (semanal).
          </div>

          <Link
            href="/login?next=/portal"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Cambiar rol (dev)
          </Link>
        </div>
      </div>
    </main>
  );
}