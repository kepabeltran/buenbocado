"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createOrder } from "../../../_state/orders";
import {
  formatEuros,
  getOfertaById,
  discountPct,
  ofertaLabelRecogida,
} from "../../../_data/ofertas";
import { reserveOne } from "../../../_state/ofertaAvailability";

export default function CheckoutOfertaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const id = params?.id;

  const oferta = useMemo(() => (id ? getOfertaById(id) : null), [id]);

  const qty = Math.max(1, Number(sp.get("qty") ?? "1"));
  const pax = Math.max(1, Number(sp.get("pax") ?? "2"));
  const day = sp.get("day") ?? null;
  const windowId = sp.get("window") ?? null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const now = Date.now();

  if (!id || !oferta) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">Oferta inválida.</div>
      </main>
    );
  }

  const pct = discountPct(oferta);
  const recogidaLabel = ofertaLabelRecogida(oferta, now);

  const selectedWindow = oferta.cadencia === "PROGRAMADA"
    ? (oferta.pickupWindows ?? []).find((w) => w.id === windowId) ?? null
    : null;

  const lineQty = oferta.tipo === "PACK" ? qty : 1;
  const lineName = oferta.tipo === "PACK" ? oferta.titulo : `Reserva mesa (${pax} pax) · ${oferta.titulo}`;
  const subtotalCents = lineQty * oferta.priceCents;

  function onConfirm() {
    setError(null);

    if (name.trim().length < 2) return setError("Pon tu nombre (mínimo 2 letras).");
    if (phone.trim().length < 6) return setError("Pon un teléfono válido.");

    // Si es PROGRAMADA, obligamos a día+franja y descontamos cupo
    if (oferta.cadencia === "PROGRAMADA") {
      if (!day) return setError("Falta el día. Vuelve atrás y elige día.");
      if (!windowId || !selectedWindow) return setError("Falta la franja. Vuelve atrás y elige franja.");

      const res = reserveOne(oferta.id, day, windowId, selectedWindow.capacity);
      if (!res.ok) return setError("Esa franja está agotada. Elige otra.");
    }

    const extraParts = [
      `Recogida: ${recogidaLabel} · ${oferta.pickupAddress}`,
      day ? `Día: ${day}` : null,
      selectedWindow ? `Franja: ${selectedWindow.label} ${selectedWindow.start}–${selectedWindow.end}` : null,
    ].filter(Boolean);

    const extra = extraParts.join(" | ");

    const order = createOrder({
      restaurantId: oferta.restaurantId,
      restaurantName: oferta.restaurantName,
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: oferta.pickupAddress,
        notes: [notes.trim(), extra].filter(Boolean).join(" | ") || undefined,
      },
      items: [
        {
          itemId: `oferta:${oferta.id}`,
          name: lineName,
          qty: lineQty,
          priceCents: oferta.priceCents,
        },
      ],
      subtotalCents,
    });

    router.push(`/order/${order.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/ofertas/${oferta.id}`} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            ← Volver
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/orders" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Mis pedidos
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Confirmar</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {oferta.restaurantName} · {recogidaLabel}
            {day ? ` · Día ${day}` : ""}
            {selectedWindow ? ` · ${selectedWindow.label} ${selectedWindow.start}–${selectedWindow.end}` : ""}
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="600 123 123"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Ej: llegaré 10 min tarde, sin gluten si es posible…"
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={onConfirm}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Confirmar y generar ticket
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Resumen</h2>

            <div className="mt-4 text-sm">
              <div className="font-semibold">{lineName}</div>
              <div className="mt-1 text-xs text-zinc-500">
                {oferta.tipo === "PACK" ? `${lineQty} unidad(es)` : `Mesa para ${pax} personas`}
              </div>
              {day && <div className="mt-1 text-xs text-zinc-500">Día: {day}</div>}
              {selectedWindow && (
                <div className="mt-1 text-xs text-zinc-500">
                  Franja: {selectedWindow.label} {selectedWindow.start}–{selectedWindow.end}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs text-zinc-500">Precio</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-xl font-semibold">{formatEuros(subtotalCents)}</div>
                {oferta.originalPriceCents > 0 && (
                  <div className="text-sm text-zinc-500 line-through">{formatEuros(oferta.originalPriceCents)}</div>
                )}
                {pct > 0 && <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">-{pct}%</span>}
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              (MVP) Cupos por franja se guardan en este navegador. Luego lo haremos global con DB.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}