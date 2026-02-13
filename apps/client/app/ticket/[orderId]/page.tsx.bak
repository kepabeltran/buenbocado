"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  // Opcionales por si el API los trae hoy o ma?ana (sin romper)
  title?: string | null;
  priceCents?: number | null;
  currency?: string | null;
};

function statusLabel(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "CREATED") return "Reservado";
  if (v === "PREPARING") return "En preparaci?n";
  if (v === "READY") return "Listo para recoger";
  if (v === "DELIVERED") return "Entregado";
  return v || "?";
}

function statusTone(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "READY") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (v === "PREPARING") return "bg-amber-50 text-amber-800 border-amber-200";
  if (v === "DELIVERED") return "bg-zinc-100 text-zinc-800 border-zinc-200";
  return "bg-blue-50 text-blue-800 border-blue-200";
}

function formatMoney(cents?: number | null, currency?: string | null) {
  if (typeof cents !== "number") return null;
  const eur = (cents / 100).toFixed(2).replace(".", ",");
  const cur = currency ?? "EUR";
  if (cur === "EUR") return `${eur} ?`;
  return `${eur} ${cur}`;
}

function normalizeCode(code?: string | null) {
  const raw = String(code ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  // Si parece num?rico corto, lo llevamos a 6 d?gitos (sin inventar si ya trae letras)
  if (digits && digits.length <= 6 && digits.length >= 4 && digits === raw) {
    return digits.padStart(6, "0");
  }
  return raw || "?";
}

export default function TicketPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = String(params?.orderId ?? "").trim();

  const [ticket, setTicket] = useState<TicketVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const codePretty = useMemo(() => normalizeCode(ticket?.code), [ticket?.code]);
  const money = useMemo(
    () => formatMoney(ticket?.priceCents ?? null, ticket?.currency ?? null),
    [ticket?.priceCents, ticket?.currency],
  );

  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      const txt = String(codePretty ?? "").trim();
      if (!txt || txt === "?") return;
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // si falla clipboard, no liamos: el usuario puede seleccionar y copiar
    }
  }

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
          const t: any = await fetchTicket(orderId, { timeoutMs: 2500 });
          if (!alive) return;

          setTicket({
            id: String(t?.id ?? orderId),
            status: String(t?.status ?? ""),
            code: String(t?.code ?? (t as any)?.pickupCode ?? (t as any)?.pickup_code ?? ""),
            pickup: String(t?.pickup ?? t?.restaurant ?? "Restaurante"),
            instructions: String(
              t?.instructions ??
                "Ense?a este c?digo en el local para recoger tu pedido.",
            ),
            title: t?.title ?? t?.menuTitle ?? null,
            priceCents: typeof t?.priceCents === "number" ? t.priceCents : null,
            currency: typeof t?.currency === "string" ? t.currency : null,
            source: "api",
          });

          setLoading(false);
          return;
        } catch {
          // seguimos a fallback local
        }
      }

      // 2) Fallback LOCAL (Mis pedidos)
      const local: any = getOrder(orderId);
      if (local) {
        if (!alive) return;
        setTicket({
          id: String(local.id ?? orderId),
          status: String(local.status ?? ""),
          code: String((local as any).code ?? (local as any).pickupCode ?? ""),
          pickup: String(local.restaurantName ?? "Restaurante"),
          instructions:
            "Ense?a este c?digo en el local para recoger tu pedido.",
          // si existiesen en localStorage en el futuro, los cogemos sin romper
          title: local.title ?? local.menuTitle ?? null,
          priceCents:
            typeof local.priceCents === "number" ? local.priceCents : null,
          currency: typeof local.currency === "string" ? local.currency : null,
          source: "local",
        });
        setLoading(false);
        return;
      }

      // 3) ?ltimo intento: por si acaso (si era local pero realmente era API)
      try {
        const t: any = await fetchTicket(orderId, { timeoutMs: 2500 });
        if (!alive) return;
        setTicket({
          id: String(t?.id ?? orderId),
          status: String(t?.status ?? ""),
          code: String(t?.code ?? (t as any)?.pickupCode ?? (t as any)?.pickup_code ?? ""),
          pickup: String(t?.pickup ?? t?.restaurant ?? "Restaurante"),
          instructions: String(
            t?.instructions ??
              "Ense?a este c?digo en el local para recoger tu pedido.",
          ),
          title: t?.title ?? t?.menuTitle ?? null,
          priceCents: typeof t?.priceCents === "number" ? t.priceCents : null,
          currency: typeof t?.currency === "string" ? t.currency : null,
          source: "api",
        });
        setLoading(false);
        return;
      } catch {}

      if (!alive) return;
      setError(
        "No encontramos este pedido. Puede ser un ticket demo antiguo o que ya no exista.",
      );
      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [orderId]);

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/offers" className="flex items-center gap-2">
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
              href="/offers"
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
            <p className="text-sm text-zinc-600">Cargando ticket?</p>
          </Card>
        ) : error ? (
          <Card className="p-6 space-y-3">
            <p className="text-sm font-semibold text-red-700">
              No se pudo cargar el ticket
            </p>
            <p className="text-sm text-zinc-700">{error}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/orders"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Volver a Mis pedidos
              </Link>
              <Link
                href="/offers"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver ofertas
              </Link>
            </div>
          </Card>
        ) : ticket ? (
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            {/* IZQUIERDA: info principal */}
            <Card className="space-y-5 p-6">
              {/* C?digo grande */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    C?digo de recogida
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                    aria-live="polite"
                  >
                    {copied ? "Copiado ?" : "Copiar"}
                  </button>
                </div>

                <p
                  id="codigo"
                  className="mt-3 text-5xl sm:text-6xl font-extrabold text-brand-700 tracking-[0.25em] select-all"
                >
                  {codePretty}
                </p>

                <p className="mt-3 text-sm text-zinc-600">
                  Ens??alo en el local. Sin historias. ??
                </p>
              </div>

              {/* Estado */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                    ticket.status,
                  )}`}
                >
                  {statusLabel(ticket.status)}
                </span>
                <span className="text-xs text-zinc-500">
                  {ticket.source === "api" ? "Origen: API" : "Origen: local"}
                </span>
              </div>

              {/* Restaurante / detalles */}
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Restaurante</div>
                <div className="text-lg font-semibold text-slate-900">
                  {ticket.pickup || "Restaurante"}
                </div>

                {(ticket.title || money) && (
                  <div className="text-sm text-zinc-700">
                    {ticket.title ? (
                      <span className="font-medium">{ticket.title}</span>
                    ) : null}
                    {ticket.title && money ? <span> ? </span> : null}
                    {money ? (
                      <span className="font-semibold">{money}</span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Instrucciones */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                {ticket.instructions}
              </div>

              <div className="pt-1 flex flex-wrap gap-2">
                <Link
                  href="/offers"
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
</div>
        ) : null}
      </section>
    </main>
  );
}
