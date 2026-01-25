"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@buenbocado/ui";
import { fetchTicket } from "@/lib/api";
import { getOrder } from "@/app/_state/orders";

type TicketVM = {
  id: string;
  status: string;
  code: string;
  pickup: string;
  instructions: string;
  source: "api" | "local";
};

function statusLabel(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "CREATED") return "Reservado";
  if (v === "PREPARING") return "En preparación";
  if (v === "READY") return "Listo para recoger";
  if (v === "DELIVERED") return "Entregado";
  return v || "—";
}

export default function TicketPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = String(params?.orderId ?? "").trim();

  const [ticket, setTicket] = useState<TicketVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;

    async function run() {
      setLoading(true);
      setError(null);
      setTicket(null);

      const looksLocal = orderId.startsWith("ord_");

      // 1) Si NO parece local, intentamos API primero
      if (!looksLocal) {
        try {
          const t = await fetchTicket(orderId, { timeoutMs: 2500 });
          if (!alive) return;
          setTicket({ ...t, source: "api" });
          setLoading(false);
          return;
        } catch {
          // seguimos a fallback local
        }
      }

      // 2) Fallback LOCAL (Mis pedidos)
      const local = getOrder(orderId);
      if (local) {
        if (!alive) return;
        setTicket({
          id: local.id,
          status: local.status,
          code: local.pickupCode,
          pickup: local.restaurantName || "Restaurante",
          instructions: "Enseña este código en el local para recoger tu pedido.",
          source: "local",
        });
        setLoading(false);
        return;
      }

      // 3) Último intento: por si acaso (si era local pero realmente era API)
      try {
        const t = await fetchTicket(orderId, { timeoutMs: 2500 });
        if (!alive) return;
        setTicket({ ...t, source: "api" });
        setLoading(false);
        return;
      } catch {}

      if (!alive) return;
      setError("No encontramos este pedido. Puede ser un pedido demo antiguo o que ya no exista.");
      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [orderId]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">
              BB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">ticket</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Mis pedidos
            </Link>
            <Link
              href="/ofertas"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
            Ticket
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Pedido confirmado
          </h1>
          {orderId && (
            <p className="text-xs text-zinc-500">
              Ref: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </header>

        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-zinc-600">Cargando ticket…</p>
          </Card>
        ) : error ? (
          <Card className="p-6 space-y-3">
            <p className="text-sm font-semibold text-red-700">No se pudo cargar el ticket</p>
            <p className="text-sm text-zinc-700">{error}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/orders"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Volver a Mis pedidos
              </Link>
              <Link
                href="/ofertas"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver ofertas
              </Link>
            </div>
          </Card>
        ) : ticket ? (
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <Card className="space-y-3 p-6">
              <p className="text-sm text-slate-600">Código</p>
              <p id="codigo" className="text-3xl font-bold text-brand-700 tracking-widest">
                {ticket.code}
              </p>

              <p className="text-sm text-slate-600">Estado</p>
              <p className="text-lg font-semibold text-slate-900">
                {statusLabel(ticket.status)}
              </p>

              <p className="text-sm text-slate-600">Recogida</p>
              <p className="text-lg font-semibold text-slate-900">
                {ticket.pickup}
              </p>

              <p className="text-sm text-slate-600">{ticket.instructions}</p>

              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  href="/ofertas"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Volver a ofertas
                </Link>
                <Link
                  href="/orders"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  Mis pedidos
                </Link>
              </div>
            </Card>

            <Card className="flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-brand-200 bg-brand-50 text-xs text-brand-700">
                QR mock
              </div>
              <p className="text-xs text-slate-500">Escanéalo en el local</p>
            </Card>
          </div>
        ) : null}
      </section>
    </main>
  );
}