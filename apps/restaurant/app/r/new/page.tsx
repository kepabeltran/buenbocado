"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@buenbocado/ui";
import { useAuth } from "../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

function eurosToCents(input: string) {
  const cleaned = String(input ?? "")
    .trim()
    .replace(/\u20ac/g, "")
    .replace("\u00e2\u201a\u00ac", "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

// Duración presets en minutos
const DURATION_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "1h 30m", value: 90 },
  { label: "2 h", value: 120 },
  { label: "3 h", value: 180 },
  { label: "4 h", value: 240 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nowLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function addMinutes(iso: string, mins: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

type TimeMode = "duration" | "exact";

export default function NewMenuPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [type, setType] = useState<"TAKEAWAY" | "DINEIN">("TAKEAWAY");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("8,50");
  const [quantity, setQuantity] = useState<number>(10);

  // Time config
  const [timeMode, setTimeMode] = useState<TimeMode>("duration");
  const [startTime, setStartTime] = useState(nowLocalISO());
  const [durationMins, setDurationMins] = useState(90);
  const [endTime, setEndTime] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Calcula el fin según el modo
  const computedEnd = useMemo(() => {
    if (timeMode === "duration") {
      const d = new Date(startTime);
      d.setMinutes(d.getMinutes() + durationMins);
      return d;
    }
    // modo exact
    return endTime ? new Date(endTime) : null;
  }, [timeMode, startTime, durationMins, endTime]);

  const computedEndLabel = useMemo(() => {
    if (!computedEnd || isNaN(computedEnd.getTime())) return "—";
    return computedEnd.toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  }, [computedEnd]);

  function onPickFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setCreatedId(null);

    try {
      const token = getToken();
      if (!token) throw new Error("No estás autenticado. Vuelve a iniciar sesión.");

      const priceCents = eurosToCents(price);
      if (!file) throw new Error("Selecciona una foto para publicar la oferta.");
      if (!title.trim() || title.trim().length < 3) throw new Error("Pon un título (mín. 3 caracteres).");
      if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error("Precio inválido.");
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Cantidad inválida.");

      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) throw new Error("Hora de inicio inválida.");

      if (!computedEnd || isNaN(computedEnd.getTime())) throw new Error("Hora de fin inválida.");
      if (computedEnd <= startDate) throw new Error("La hora de fin debe ser posterior al inicio.");

      let imageUrl: string | undefined = undefined;

      // 1) Subir imagen
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("La imagen supera 5MB.");
        if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");

        const fd = new FormData();
        fd.append("file", file);

        const upRes = await fetch(API_BASE + "/api/uploads/menu-image", {
          method: "POST",
          body: fd,
        });

        const upJson = await upRes.json().catch(() => ({} as any));
        if (!upRes.ok || !upJson?.ok || !upJson?.url) {
          throw new Error(upJson?.error ? "Upload: " + upJson.error : "No se pudo subir la imagen.");
        }
        imageUrl = String(upJson.url);
      }

      // 2) Crear oferta con tiempos
      const expiresAt = new Date(computedEnd.getTime() + 30 * 60 * 1000); // 30 min de gracia

      const payload: any = {
        type,
        title: title.trim(),
        description: description.trim(),
        priceCents,
        currency: "EUR",
        quantity: Math.floor(quantity),
        availableFrom: startDate.toISOString(),
        availableTo: computedEnd.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      if (imageUrl) payload.imageUrl = imageUrl;

      const res = await fetch(API_BASE + "/api/restaurant/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok || !j?.id) {
        throw new Error(j?.error || j?.message || "No se pudo crear la oferta.");
      }

      setCreatedId(String(j.id));
      router.push("/r/offers");
    } catch (err: any) {
      setError(err?.message ? String(err.message) : String(err));
    } finally {
      setBusy(false);
    }
  }

  const timeModeBtn = (m: TimeMode, label: string) => (
    <button
      type="button"
      onClick={() => setTimeMode(m)}
      className={
        "rounded-xl px-3 py-1.5 text-xs font-semibold transition " +
        (timeMode === m
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50")
      }
    >
      {label}
    </button>
  );

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Restaurante
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Crear oferta</h1>
        <p className="text-sm text-zinc-500">
          Publica una oferta con foto, precio y tiempo disponible.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/r/offers"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Mis ofertas
        </Link>
        <Link
          href="/r"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Dashboard
        </Link>
      </div>

      <Card className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-zinc-700">Tipo</span>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="TAKEAWAY">Para llevar</option>
                <option value="DINEIN">En local</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-zinc-700">Cantidad</span>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-zinc-700">Título</span>
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Ej: Pack sushi sorpresa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-zinc-700">Descripción</span>
            <textarea
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              rows={3}
              placeholder="Qué incluye, alérgenos, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-zinc-700">Precio (€)</span>
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="8,50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>

          {/* ─── TIEMPO ─────────────────────────────── */}
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-700">Tiempo de la oferta</p>

            <div className="flex gap-2">
              {timeModeBtn("duration", "Duración")}
              {timeModeBtn("exact", "Hora exacta")}
            </div>

            {/* Inicio */}
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-zinc-600">Inicio</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            {/* Duración preset */}
            {timeMode === "duration" && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-600">Duración</span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setDurationMins(p.value)}
                      className={
                        "rounded-xl px-3 py-2 text-sm font-semibold transition " +
                        (durationMins === p.value
                          ? "bg-zinc-900 text-white"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50")
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  max={720}
                  className="w-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                />
                <span className="ml-2 text-xs text-zinc-500">minutos</span>
              </div>
            )}

            {/* Hora exacta */}
            {timeMode === "exact" && (
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-zinc-600">Fin</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            )}

            {/* Preview */}
            <div className="rounded-xl bg-white border border-zinc-200 px-3 py-2 text-xs text-zinc-600">
              La oferta estará disponible hasta: <span className="font-semibold text-zinc-900">{computedEndLabel}</span>
              <br />
              <span className="text-zinc-400">+ 30 min de gracia para recogida</span>
            </div>
          </div>


          {/* ─── FOTO ───────────────────────────────── */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-zinc-700">Foto</span>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold text-zinc-700">Mini guía</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-500">
                <li>Horizontal si puedes.</li>
                <li>Plato centrado, 70–80% del encuadre.</li>
                <li>Sin flash, luz natural.</li>
                <li>Fondo limpio.</li>
              </ul>

              <div className="mt-3">
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-white"
                  style={{ aspectRatio: "16 / 10" }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      Encuadre recomendado (16:10)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white active:scale-[0.99] disabled:opacity-60"
                onClick={() => cameraInputRef.current?.click()}
                disabled={busy}
              >
                Hacer foto
              </button>
              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 active:scale-[0.99] disabled:opacity-60"
                onClick={() => galleryInputRef.current?.click()}
                disabled={busy}
              >
                Galería
              </button>
              <span className="max-w-[240px] truncate text-xs text-zinc-500">
                {file ? file.name : "Ninguna seleccionada"}
              </span>
            </div>

            <input
              ref={cameraInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={galleryInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-zinc-400">Máx. 5MB. Se normaliza a JPG 16:10.</p>
          </div>

          {/* ─── ERRORES / ÉXITO ────────────────────── */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          {createdId && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              Oferta creada correctamente.
            </div>
          )}

          {/* ─── BOTONES ────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Publicando…" : "Publicar oferta"}
            </Button>
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              href="/r/offers"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </section>
  );
}
