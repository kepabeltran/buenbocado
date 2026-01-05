"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrder } from "../../_state/orders";

export default function PickupCodePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const order = id ? getOrder(id) : null;

  if (!id || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-xl px-4 py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">Código no encontrado</h1>
            <p className="mt-2 text-sm text-zinc-600">Puede que el pedido no exista en este navegador.</p>
            <Link href="/orders" className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ir a mis pedidos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const code = order.pickupCode ?? "—";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      alert("✅ Código copiado");
    } catch {
      alert("No se pudo copiar. Selecciona el código manualmente.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href={`/order/${order.id}`} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            ← Volver al ticket
          </Link>
          <Link href="/orders" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Mis pedidos
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="text-xs text-zinc-500">Restaurante</div>
          <div className="mt-1 text-lg font-semibold">{order.restaurantName}</div>

          <h1 className="mt-6 text-2xl font-semibold">Código de recogida</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enséñalo en el local para retirar el pedido. (MVP: luego esto se valida desde el panel del restaurante)
          </p>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-center">
            <div className="text-xs text-zinc-500">Tu código</div>
            <div className="mt-2 font-mono text-5xl font-bold tracking-widest">{code}</div>

            <button
              onClick={copy}
              className="mt-6 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Copiar código
            </button>
          </div>

          <div className="mt-8 text-sm text-zinc-600">
            <div className="font-semibold text-zinc-900">Consejo</div>
            <div className="mt-1">Si vas tarde, avisa en notas o llama. En la ventana marcada es cuando está listo.</div>
          </div>
        </div>
      </section>
    </main>
  );
}