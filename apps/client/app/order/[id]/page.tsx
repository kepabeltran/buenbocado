"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ApiOrderResp = {
  ok: boolean;
  order?: {
    id: string;
    status: string;
    code: string;
    menuId: string;
    createdAt: string;
  };
  menu?: {
    id: string;
    title: string;
    type: "TAKEAWAY" | "DINEIN";
    priceCents: number;
    currency: string;
    description?: string;
  } | null;
  restaurant?: {
    id: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
  } | null;
  error?: string;
  message?: string;
};

function formatEurosFromCents(cents: number) {
  const euros = cents / 100;
  return euros.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function statusLabel(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "CREATED") return "Reservado";
  if (v === "READY") return "Listo para recoger";
  if (v === "DELIVERED") return "Entregado";
  if (v === "CANCELLED") return "Cancelado";
  return v || "—";
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_BASE ||
    "http://127.0.0.1:4000";

  const [data, setData] = useState<ApiOrderResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) return;

      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(`${apiBase}/api/orders/${id}`, { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as ApiOrderResp;

        if (!res.ok || !json?.ok) {
          const msg = (json as any)?.message || (json as any)?.error || "No se pudo cargar el pedido.";
          if (!cancelled) setErr(String(msg));
          if (!cancelled) setData(null);
          return;
        }

        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ? String(e.message) : "Error cargando el pedido.");
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, apiBase]);

  const title = useMemo(() => {
    const kind = data?.menu?.type === "TAKEAWAY" ? "Para llevar" : "En el local";
    const rest = data?.restaurant?.name ?? "Restaurante";
    return `${rest} · ${kind}`;
  }, [data]);

  if (!id) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">Pedido inválido.</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">Cargando…</div>
      </main>
    );
  }

  if (err || !data?.order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/offers"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              ← Volver a ofertas
            </Link>

            <Link
              href="/orders"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Mis pedidos
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold">No encuentro tu reserva</div>
            <p className="mt-2 text-sm text-zinc-600">
              {err ?? "Puede que este pedido no exista o haya expirado."}
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/offers"
                className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Volver a ofertas
              </Link>

              <Link
                href="/orders"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50"
              >
                Ir a mis pedidos
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const code = data.order.code;
  const rest = data.restaurant;
  const menu = data.menu;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/offers"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            ← Ofertas
          </Link>

          <Link
            href="/orders"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Mis pedidos
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Reserva confirmada</h1>
          <p className="mt-2 text-sm text-zinc-600">{title}</p>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="text-xs font-semibold tracking-wide text-amber-900/70">CÓDIGO DE RECOGIDA</div>
            <div className="mt-2 text-4xl font-extrabold tracking-widest text-amber-900">{code}</div>
            <p className="mt-3 text-sm text-amber-900/80">
              Enséñalo en el restaurante. Para marcar como entregado, el restaurante introducirá este código.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold text-zinc-500">Estado</div>
              <div className="mt-1 text-base font-semibold">{statusLabel(data.order.status)}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold text-zinc-500">Restaurante</div>
              <div className="mt-1 text-base font-semibold">{rest?.name ?? "—"}</div>
              {rest?.address ? <div className="mt-1 text-sm text-zinc-600">{rest.address}</div> : null}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold text-zinc-500">Tu oferta</div>
              <div className="mt-1 text-base font-semibold">{menu?.title ?? "—"}</div>
              {menu?.description ? <div className="mt-1 text-sm text-zinc-600">{menu.description}</div> : null}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold text-zinc-500">Total</div>
              <div className="mt-1 text-2xl font-semibold">
                {typeof menu?.priceCents === "number" ? formatEurosFromCents(menu.priceCents) : "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/offers"
              className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Volver a ofertas
            </Link>

            <Link
              href="/orders"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50"
            >
              Ver mis pedidos
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="text-sm font-semibold text-zinc-900">Instrucciones</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Ve al restaurante y muestra el código.</li>
            <li>Si llegas tarde, puede caducar según la oferta.</li>
            <li>El restaurante marcará el pedido como entregado introduciendo tu código.</li>
          </ul>

          <p className="mt-4 text-xs text-zinc-500">
            Nota MVP: phone/notes aún no se guardan en la API. Eso lo añadimos después.
          </p>
        </aside>
      </section>
    </main>
  );
}