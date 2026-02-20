"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
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
  // Opcionales (si el API los trae hoy o mañana, sin romper)
  title?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
};

function statusLabel(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "CREATED") return "Confirmado";
  if (v === "PREPARING") return "En preparación";
  if (v === "READY") return "Listo";
  if (v === "DELIVERED") return "Entregado";
  if (v === "EXPIRED") return "Caducado";
  if (v === "CANCELLED") return "Cancelado";
  return "Pedido";
}

function statusPillClass(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "DELIVERED" || v === "READY")
    return "bg-emerald-50 border border-emerald-100 text-emerald-700";
  if (v === "PREPARING")
    return "bg-amber-50 border border-amber-200 text-amber-700";
  if (v === "EXPIRED" || v === "CANCELLED")
    return "bg-rose-50 border border-rose-200 text-rose-700";
  return "bg-slate-50 border border-slate-200 text-slate-700";
}

function ticketHeadline(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "DELIVERED") return "Pedido entregado";
  if (v === "READY") return "Listo para recoger";
  if (v === "PREPARING") return "En preparación";
  if (v === "EXPIRED") return "Pedido caducado";
  if (v === "CANCELLED") return "Pedido cancelado";
  return "Pedido confirmado";
}

function ticketSubline(s?: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "DELIVERED") return "Gracias. Guarda este ticket por si lo necesitas.";
  if (v === "READY") return "Enseña el código en el local para recoger tu pedido.";
  if (v === "PREPARING") return "Se está preparando. Vuelve en unos minutos.";
  if (v === "EXPIRED") return "Este ticket ya no es válido.";
  if (v === "CANCELLED") return "Este pedido fue cancelado.";
  return "Reserva confirmada. Ya lo tienes guardado en Mis pedidos.";
}

function splitPickup(pickup?: string) {
  const raw = String(pickup ?? "").trim();
  if (!raw) return { name: "Restaurante", address: "" };

  // Formatos típicos: "NOMBRE · Dirección", "NOMBRE - Dirección"
  if (raw.includes("·")) {
    const [a, ...rest] = raw.split("·");
    return { name: a.trim() || "Restaurante", address: rest.join("·").trim() };
  }
  if (raw.includes(" - ")) {
    const [a, ...rest] = raw.split(" - ");
    return { name: a.trim() || "Restaurante", address: rest.join(" - ").trim() };
  }
  return { name: raw, address: "" };
}

function formatEurosFromCents(cents?: number | null, currency?: string | null) {
  if (typeof cents !== "number") return null;
  const cur = (currency || "EUR").toUpperCase();
  const amount = cents / 100;
  try {
    return amount.toLocaleString("es-ES", { style: "currency", currency: cur });
  } catch {
    // fallback simple
    return `${amount.toFixed(2)} ${cur}`;
  }
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  if (sameDay(d, now)) return `Hoy ${time}`;

  const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  return `${date} ${time}`;
}

function timeAgo(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;

  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}


export default function TicketPage() {
  const params = useParams<{ orderId?: string }>();
  const orderId = String(params?.orderId ?? "");

  const [ticket, setTicket] = useState<TicketVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const codeRaw = useMemo(() => {
    const raw = String(ticket?.code ?? "").replace(/\s+/g, "").trim();
    return raw;
  }, [ticket?.code]);

  const codePretty = useMemo(() => {
    if (!codeRaw) return "";
    return codeRaw.split("").join(" ");
  }, [codeRaw]);

  const money = useMemo(
    () => formatEurosFromCents(ticket?.priceCents ?? null, ticket?.currency ?? "EUR"),
    [ticket?.priceCents, ticket?.currency],
  );

  const { name: restaurantName, address: restaurantAddress } = useMemo(
    () => splitPickup(ticket?.pickup),
    [ticket?.pickup],
  );

  const [copied, setCopied] = useState(false);

  const [copiedRef, setCopiedRef] = useState(false);

  async function copyCode() {
    try {
      if (!codeRaw) return;
      await navigator.clipboard.writeText(codeRaw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // si falla clipboard, no liamos: el usuario puede seleccionar y copiar
    }
  }


  async function copyRef() {
    try {
      if (!orderId) return;
      await navigator.clipboard.writeText(orderId);
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 1200);
    } catch {}
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
            instructions: String(t?.instructions ?? ""),
            title: t?.title ?? t?.menuTitle ?? null,
            priceCents: typeof t?.priceCents === "number" ? t.priceCents : null,
            currency: typeof t?.currency === "string" ? t.currency : null,
            createdAt: typeof t?.createdAt === "string" ? t.createdAt : t?.createdAt ? String(t.createdAt) : null,
            deliveredAt: typeof t?.deliveredAt === "string" ? t.deliveredAt : t?.deliveredAt ? String(t.deliveredAt) : null,
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
          instructions: String(local.instructions ?? ""),
          title: local.title ?? local.menuTitle ?? null,
          priceCents: typeof local.priceCents === "number" ? local.priceCents : null,
          currency: typeof local.currency === "string" ? local.currency : null,
          createdAt: typeof local?.createdAt === "string" ? local.createdAt : local?.createdAt ? String(local.createdAt) : null,
          deliveredAt: typeof local?.deliveredAt === "string" ? local.deliveredAt : local?.deliveredAt ? String(local.deliveredAt) : null,
          source: "local",
        });
        setLoading(false);
        return;
      }

      // 3) Último intento: por si acaso (si era local pero realmente era API)
      try {
        const t: any = await fetchTicket(orderId, { timeoutMs: 2500 });
        if (!alive) return;
        setTicket({
          id: String(t?.id ?? orderId),
          status: String(t?.status ?? ""),
          code: String(t?.code ?? (t as any)?.pickupCode ?? (t as any)?.pickup_code ?? ""),
          pickup: String(t?.pickup ?? t?.restaurant ?? "Restaurante"),
          instructions: String(t?.instructions ?? ""),
          title: t?.title ?? t?.menuTitle ?? null,
          priceCents: typeof t?.priceCents === "number" ? t.priceCents : null,
          currency: typeof t?.currency === "string" ? t.currency : null,
          createdAt: typeof t?.createdAt === "string" ? t.createdAt : t?.createdAt ? String(t.createdAt) : null,
            deliveredAt: typeof t?.deliveredAt === "string" ? t.deliveredAt : t?.deliveredAt ? String(t.deliveredAt) : null,
            source: "api",
        });
        setLoading(false);
        return;
      } catch {}

      if (!alive) return;
      setError("No encontramos este pedido. Puede ser un ticket demo antiguo o que ya no exista.");
      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const state = String(ticket?.status ?? "").toUpperCase();
  const headline = ticketHeadline(state);
  const subline = ticketSubline(state);

  const isDelivered = state === "DELIVERED";
  const isInvalid = state === "EXPIRED" || state === "CANCELLED";

  const instructions =
    isDelivered
      ? "Si te lo piden, enseña el QR o el código."
      : isInvalid
        ? "Este ticket no es válido. Si crees que es un error, revisa Mis pedidos."
        : (ticket?.instructions && ticket.instructions.trim()) ||
          "Enseña el QR en caja o dicta el código. Si el QR no escanea, el código es suficiente.";

  return (
    <main className="min-h-[100svh] bg-[#fafdf7] text-slate-900">
      {/* Header compacto (alineado con /offers) */}
      <header className="sticky top-0 z-30 bg-[#fafdf7]/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/offers" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-xs font-extrabold text-white">
              BB
            </span>
            <span className="text-base font-extrabold tracking-tight">
              Buen<span className="text-emerald-600">Bocado</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
            >
              Mis pedidos
            </Link>
            <Link
              href="/offers"
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-6 pb-28 space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-emerald-600">
            Ticket
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {headline}
          </h1>
          <p className="text-sm text-slate-500">{subline}</p>
</div>

        {loading ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-10 w-56 bg-slate-100 rounded-xl" />
                <div className="h-32 w-32 bg-slate-100 rounded-2xl mx-auto" />
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
              <div className="p-5 space-y-3">
                <div className="h-3 w-32 bg-slate-100 rounded" />
                <div className="h-4 w-48 bg-slate-100 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6 space-y-3 rounded-2xl border border-rose-200 bg-rose-50">
            <p className="text-sm font-extrabold text-rose-700">No se pudo cargar el ticket</p>
            <p className="text-sm text-rose-700/90">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                href="/orders"
                className="w-full text-center rounded-xl bg-white border border-rose-200 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100/40 transition"
              >
                Volver a mis pedidos
              </Link>
              <Link
                href="/offers"
                className="w-full text-center rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition"
              >
                Ver ofertas
              </Link>
            </div>
          </Card>
        ) : ticket ? (
          <div className="space-y-4">
            {/* CARD PRINCIPAL: Código + QR */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className={"inline-flex items-center rounded-full px-3 py-1 text-[12px] font-extrabold " + statusPillClass(ticket.status)}>
                  {statusLabel(ticket.status)}
                </span>

                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-[12px] font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                  aria-live="polite"
                >
                  {copied ? "Copiado ✓" : "Copiar código"}
                </button>
              </div>

              {/* Fecha/hora (clave para la inmediatez) */}
              <div className="mt-3 flex flex-col gap-1 text-[12px] text-slate-500">
                {ticket.createdAt ? (
                  <div>
                    <span className="font-extrabold text-slate-700">Realizado:</span>{" "}
                    <span>
                      {formatWhen(ticket.createdAt) || "—"}
                      {!isDelivered && timeAgo(ticket.createdAt) ? ` · ${timeAgo(ticket.createdAt)}` : ""}
                    </span>
                    {ticket.deliveredAt && isDelivered ? (
                      <>
                        <span className="text-slate-400"> · </span>
                        <span className="font-extrabold text-slate-700">Entregado:</span>{" "}
                        <span>{formatWhen(ticket.deliveredAt) || "—"}</span>
                      </>
                    ) : null}
                  </div>
                ) : ticket.deliveredAt && isDelivered ? (
                  <div>
                    <span className="font-extrabold text-slate-700">Entregado:</span>{" "}
                    <span>{formatWhen(ticket.deliveredAt) || "—"}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-[#fbfdf8] p-4">
                <div className="text-[12px] font-bold text-slate-500">Código de recogida</div>

                <p
                  id="codigo"
                  className="mt-2 text-5xl sm:text-6xl font-extrabold text-emerald-700 tracking-[0.25em] select-all text-center"
                >
                  {codePretty || "—"}
                </p>

                {/* QR SIEMPRE */}
                <div className="mt-4 flex justify-center">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <QRCode value={codeRaw || " "} size={144} />
                  </div>
                </div>

                <p className="mt-2 text-[13px] text-slate-600 text-center">{instructions}</p>
              </div>
            </Card>

            {/* CARD DETALLES: Restaurante + pedido + acciones */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                Restaurante
              </div>

              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {restaurantName}
              </div>
              {restaurantAddress && (
                <div className="text-sm text-slate-500">{restaurantAddress}</div>
              )}

              {(ticket.title || money) && (
                <div className="mt-3 rounded-xl bg-white border border-slate-100 px-4 py-3">
                  <div className="text-[11px] font-bold text-slate-500">Detalle</div>
                  <div className="mt-1 text-sm text-slate-900">
                    {ticket.title ? <span className="font-semibold">{ticket.title}</span> : null}
                    {ticket.title && money ? <span className="text-slate-400"> · </span> : null}
                    {money ? <span className="font-extrabold">{money}</span> : null}
                  </div>
                </div>
              )}
              {orderId ? (
                <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                  <summary className="cursor-pointer list-none text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Detalles
                  </summary>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                    <span>
                      ID de pedido: <span className="font-mono text-slate-700">{orderId}</span>
                    </span>
                    <button
                      type="button"
                      onClick={copyRef}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      {copiedRef ? "Copiado ✓" : "Copiar ID"}
                    </button>
                  </div>
                </details>
              ) : null}



              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  href="/offers"
                  className="w-full text-center rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/15"
                >
                  Ver ofertas
                </Link>

                <Link
                  href="/orders"
                  className="w-full text-center rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
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
