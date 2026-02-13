"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@buenbocado/ui";
import { useAuth } from "../../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

function eurosToCents(input: string) {
  const cleaned = String(input ?? "").trim().replace(",", ".");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function centsToEuros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

type MenuDto = {
  id: string;
  title: string;
  description: string;
  type: "TAKEAWAY" | "DINEIN";
  priceCents: number;
  currency: string;
  quantity: number;
  availableFrom: string;
  availableTo: string;
  expiresAt: string;
  createdAt: string;
};

export default function EditOfferPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const router = useRouter();
  const { getToken } = useAuth();

  const [menu, setMenu] = useState<MenuDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [type, setType] = useState<"TAKEAWAY" | "DINEIN">("TAKEAWAY");

  // Timer
  const [remainingMs, setRemainingMs] = useState(0);
  const expired = remainingMs <= 0 && menu !== null;

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/menus", {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");

      const found = (json.data || []).find((m: any) => m.id === id);
      if (!found) throw new Error("Oferta no encontrada");

      setMenu(found);
      setTitle(found.title);
      setDescription(found.description);
      setPrice(centsToEuros(found.priceCents));
      setQuantity(found.quantity);
      setType(found.type);

      const elapsed = Date.now() - new Date(found.createdAt).getTime();
      setRemainingMs(Math.max(0, EDIT_WINDOW_MS - elapsed));
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

  useEffect(() => { load(); }, [load]);

  // Countdown timer
  useEffect(() => {
    if (remainingMs <= 0) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) { clearInterval(interval); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingMs > 0]);

  const timerLabel = useMemo(() => {
    if (remainingMs <= 0) return "00:00";
    const totalSec = Math.floor(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }, [remainingMs]);

  const timerColor = remainingMs < 120000 ? "text-rose-600" : remainingMs < 300000 ? "text-amber-600" : "text-emerald-600";

  async function save() {
    const token = getToken();
    if (!token || !menu) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const priceCents = eurosToCents(price);
      if (!title.trim() || title.trim().length < 3) throw new Error("Título mín. 3 caracteres");
      if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error("Precio inválido");

      const res = await fetch(API_BASE + "/api/restaurant/me/menus/" + id, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceCents,
          quantity: Math.max(0, Math.floor(quantity)),
          type,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error guardando");

      setSaved(true);
      if (json.remainingSeconds !== undefined) {
        setRemainingMs(json.remainingSeconds * 1000);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Editar oferta
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {menu?.title || "Cargando…"}
        </h1>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/r/offers"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          ← Volver a ofertas
        </Link>
      </div>

      {/* Timer bar */}
      {menu && (
        <Card className={expired ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}>
          <div className="flex items-center justify-between p-1">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {expired ? "Tiempo de edición agotado" : "Tiempo restante para editar"}
              </p>
              <p className="text-xs text-zinc-500">
                {expired
                  ? "Ya no puedes modificar esta oferta. Puedes duplicarla si necesitas cambios."
                  : "Puedes modificar la oferta durante los 10 primeros minutos tras publicarla."}
              </p>
            </div>
            <div className={"text-2xl font-mono font-bold " + timerColor}>
              {timerLabel}
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-4"><p className="text-sm text-zinc-500">Cargando…</p></Card>
      ) : error && !menu ? (
        <Card className="p-4 bg-rose-50 text-sm text-rose-700">{error}</Card>
      ) : menu ? (
        <Card className="space-y-4">
          <div className="space-y-4 p-1">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-zinc-700">Tipo</span>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  disabled={expired}
                >
                  <option value="TAKEAWAY">Para llevar</option>
                  <option value="DINEIN">En local</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-zinc-700">Cantidad</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={expired}
                />
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-sm font-semibold text-zinc-700">Título</span>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={expired}
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-sm font-semibold text-zinc-700">Descripción</span>
              <textarea
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={expired}
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-sm font-semibold text-zinc-700">Precio (€)</span>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={expired}
              />
            </label>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            {saved && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                ✅ Oferta actualizada correctamente.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {!expired && (
                <Button type="button" onClick={save} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
              )}
              <Link
                href="/r/offers"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {expired ? "Volver" : "Cancelar"}
              </Link>
            </div>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
