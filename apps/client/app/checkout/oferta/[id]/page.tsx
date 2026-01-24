"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ApiMenu = {
  id: string;
  restaurant: string;
  type: "TAKEAWAY" | "DINEIN";
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  timeRemaining: string;
  distanceKm: number;
  badge: string | null;
  imageUrl: string | null;
};

function formatEurosFromCents(cents: number) {
  const euros = cents / 100;
  return euros.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function pickOrderId(json: any): string | null {
  const id =
    json?.order?.id ??
    json?.data?.id ??
    json?.id ??
    json?.orderId ??
    null;
  return typeof id === "string" && id.trim() ? id : null;
}

export default function CheckoutOfertaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_BASE ||
    "http://127.0.0.1:4000";

  const [apiOffer, setApiOffer] = useState<ApiMenu | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // En dev mantenemos lat/lng hardcodeado (acordado)
        const url = `${apiBase}/api/menus/active?lat=37.176&lng=-3.600`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        const found: ApiMenu | null = Array.isArray(json?.data)
          ? json.data.find((m: ApiMenu) => m.id === id) ?? null
          : null;

        if (!cancelled) setApiOffer(found);
      } catch {
        if (!cancelled) setApiOffer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, apiBase]);

  const headerText = useMemo(() => {
    if (!apiOffer) return "";
    const kind = apiOffer.type === "TAKEAWAY" ? "Para llevar" : "En el local";
    return `${apiOffer.restaurant} · ${kind} · Caduca en ${apiOffer.timeRemaining}`;
  }, [apiOffer]);

  if (!id) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">Oferta inválida.</div>
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

  if (!apiOffer) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-16">Oferta inválida.</div>
      </main>
    );
  }

  async function onConfirm() {
    setError(null);

    if (submitting) return;

    if (name.trim().length < 2) return setError("Pon tu nombre (mínimo 2 letras).");
    if (!email.trim().includes("@")) return setError("Pon un email válido.");
    if (phone.trim().length < 6) return setError("Pon un teléfono válido.");

    setSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: apiOffer!.id,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          // Nota: por ahora la API no guarda phone/notes. Lo añadimos luego.
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg = json?.message || json?.error || "No se pudo crear el pedido.";
        setError(String(msg));
        return;
      }

      const orderId = pickOrderId(json);
      if (!orderId) {
        setError("Pedido creado, pero falta el id en la respuesta. Revisa /api/orders.");
        return;
      }

      router.push(`/ticket/${orderId}`);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Error creando el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href={`/offers/${apiOffer.id}`}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            ← Volver
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
          <h1 className="text-2xl font-semibold">Confirmar</h1>
          <p className="mt-2 text-sm text-zinc-600">{headerText}</p>

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
              <label className="text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="tu@email.com"
                inputMode="email"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="6xx xxx xxx"
                inputMode="tel"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                rows={3}
                placeholder="Ej.: llego en 10 min…"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <button
              onClick={onConfirm}
              disabled={submitting}
              className="mt-2 rounded-2xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {submitting ? "Creando pedido…" : "Confirmar reserva"}
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="text-sm font-semibold text-zinc-900">Resumen</div>

          <div className="mt-3 text-sm text-zinc-700">{apiOffer.title}</div>
          <div className="mt-1 text-xs text-zinc-500">{apiOffer.description}</div>

          <div className="mt-4 flex items-end justify-between">
            <div className="text-xs text-zinc-500">Total</div>
            <div className="text-2xl font-semibold text-zinc-900">
              {formatEurosFromCents(apiOffer.priceCents)}
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Pedido real: se crea en API/DB y el restaurante podrá validarlo por código.
          </p>
        </aside>
      </section>
    </main>
  );
}
