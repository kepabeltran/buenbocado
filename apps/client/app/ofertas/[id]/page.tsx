"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  discountPct,
  formatEuros,
  getOfertaById,
  ofertaLabelCaduca,
  ofertaLabelRecogida,
  type PickupWindow,
} from "../../_data/ofertas";
import { getRemainingCapacity } from "../../_state/ofertaAvailability";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelDay(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function OfertaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const now = Date.now();
  const oferta = useMemo(() => (id ? getOfertaById(id) : null), [id]);

  const [qty, setQty] = useState(1);
  const [pax, setPax] = useState(2);

  const dayOptions = useMemo(() => {
    if (!oferta || oferta.cadencia !== "PROGRAMADA") return [];
    const end = new Date(oferta.availableToISO);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const arr: Date[] = [];
    const cur = new Date(start);
    while (cur <= end && arr.length < 4) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [oferta]);

  const [selectedDay, setSelectedDay] = useState(() => toYMD(new Date()));
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  const windows: PickupWindow[] = useMemo(() => {
    if (!oferta || oferta.cadencia !== "PROGRAMADA") return [];
    return oferta.pickupWindows ?? [];
  }, [oferta]);

  const windowsWithRemaining = useMemo(() => {
    if (!oferta || oferta.cadencia !== "PROGRAMADA") return [];
    return windows.map((w) => ({
      w,
      remaining: getRemainingCapacity(oferta.id, selectedDay, w.id, w.capacity),
    }));
  }, [oferta, windows, selectedDay]);

  useEffect(() => {
    if (!oferta || oferta.cadencia !== "PROGRAMADA") return;
    // Si no hay franja seleccionada o la elegida está agotada, elige la primera con cupo
    const current = selectedWindowId ? windowsWithRemaining.find((x) => x.w.id === selectedWindowId) : null;
    if (current && current.remaining > 0) return;

    const firstAvailable = windowsWithRemaining.find((x) => x.remaining > 0);
    setSelectedWindowId(firstAvailable ? firstAvailable.w.id : (windowsWithRemaining[0]?.w.id ?? null));
  }, [oferta, selectedDay, windowsWithRemaining, selectedWindowId]);

  if (!id || !oferta) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">Oferta no encontrada</h1>
            <p className="mt-2 text-sm text-zinc-600">Puede que haya caducado.</p>
            <Link href="/ofertas" className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Volver a ofertas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pct = discountPct(oferta);
  const caduca = ofertaLabelCaduca(oferta, now);
  const recogida = ofertaLabelRecogida(oferta, now);

  const canReserveBase = oferta.qtyAvailable > 0;

  const selectedWindow = windowsWithRemaining.find((x) => x.w.id === selectedWindowId) ?? null;
  const selectedWindowRemaining = selectedWindow?.remaining ?? 0;

  const canReserve =
    canReserveBase &&
    (oferta.cadencia !== "PROGRAMADA" || (selectedWindowId && selectedWindowRemaining > 0));

  function goCheckout() {
    if (!canReserve) return;

    const qsBase =
      oferta.tipo === "PACK"
        ? `?qty=${encodeURIComponent(String(qty))}`
        : `?pax=${encodeURIComponent(String(pax))}`;

    const qsProgramada =
      oferta.cadencia === "PROGRAMADA"
        ? `&day=${encodeURIComponent(selectedDay)}&window=${encodeURIComponent(selectedWindowId ?? "")}`
        : "";

    router.push(`/checkout/oferta/${oferta.id}${qsBase}${qsProgramada}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/ofertas" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            ← Ofertas
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/orders" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Mis pedidos
            </Link>
            <Link href="/" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Home
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-zinc-500">{oferta.restaurantName}</div>
          <h1 className="mt-1 text-2xl font-semibold">{oferta.titulo}</h1>
          <p className="mt-3 text-sm text-zinc-600">{oferta.descripcion}</p>

          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs text-zinc-500">Recogida / Sala</div>
              <div className="font-semibold">{recogida} · {oferta.pickupAddress}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs text-zinc-500">{oferta.cadencia === "PROGRAMADA" ? "Disponible hasta" : "Caduca en"}</div>
              <div className="font-mono font-semibold">{caduca}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-xs text-zinc-500">Precio</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-xl font-semibold">{formatEuros(oferta.priceCents)}</div>
              {oferta.originalPriceCents > 0 && (
                <div className="text-sm text-zinc-500 line-through">{formatEuros(oferta.originalPriceCents)}</div>
              )}
              {pct > 0 && <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">-{pct}%</span>}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Reservar</h2>

            {oferta.cadencia === "PROGRAMADA" && dayOptions.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Elige día</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dayOptions.map((d) => {
                    const ymd = toYMD(d);
                    const active = selectedDay === ymd;
                    return (
                      <button
                        key={ymd}
                        onClick={() => setSelectedDay(ymd)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                          active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                        type="button"
                      >
                        {labelDay(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {oferta.cadencia === "PROGRAMADA" && windowsWithRemaining.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Elige franja</label>
                <div className="mt-2 grid gap-2">
                  {windowsWithRemaining.map(({ w, remaining }) => {
                    const active = selectedWindowId === w.id;
                    const disabled = remaining <= 0;

                    return (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWindowId(w.id)}
                        disabled={disabled}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                          active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        type="button"
                      >
                        <div>
                          <div className="font-semibold">{w.label}</div>
                          <div className={`text-xs ${active ? "text-white/80" : "text-zinc-500"}`}>
                            {w.start}–{w.end}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${active ? "text-white" : "text-zinc-700"}`}>
                          {disabled ? "Agotada" : `Quedan ${remaining}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  (MVP) No hora exacta: vienes dentro de la franja. Si una franja se agota, se bloquea sola.
                </p>
              </div>
            )}

            {oferta.tipo === "PACK" ? (
              <div className="mt-4">
                <label className="text-sm font-medium">Cantidad</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQty(n)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                        qty === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                      type="button"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label className="text-sm font-medium">Personas</label>
                <div className="mt-2 flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPax(n)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                        pax === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                      type="button"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={goCheckout}
              disabled={!canReserve}
              className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                canReserve ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Continuar
            </button>

            {!canReserve && (
              <p className="mt-3 text-xs text-zinc-500">
                Oferta agotada (o franja sin cupo).
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}