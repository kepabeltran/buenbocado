"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@buenbocado/ui";

function normalizeBase(raw: string) {
  return raw
    .replace("0.0.0.0", "127.0.0.1")
    .replace(/\/$/, "")
    .replace(/\/api\/?$/, "");
}

function getApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    process.env.NEXT_PUBLIC_BUENBOCADO_API_URL ??
    "http://127.0.0.1:4000";

  return normalizeBase(raw);
}

function eurosToCents(input: string) {
  const cleaned = String(input ?? "")
    .trim()
    .replace(/\u20ac/g, "").replace("\u00e2\u201a\u00ac", "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export default function NewMenuPage() {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [type, setType] = useState<"TAKEAWAY" | "DINEIN">("TAKEAWAY");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("8,50");
  const [quantity, setQuantity] = useState<number>(10);
  const [allowTimeAdjustment, setAllowTimeAdjustment] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

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
      const priceCents = eurosToCents(price);
      if (!file) throw new Error("Selecciona una foto para publicar la oferta.");
      if (!title.trim() || title.trim().length < 3) throw new Error("Pon un título (mín. 3 caracteres).");
      if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error("Precio inválido.");
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Cantidad inválida.");

      let imageUrl: string | undefined = undefined;

      // 1) Subir imagen (obligatoria)
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("La imagen supera 5MB (límite MVP).");
        if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");

        const fd = new FormData();
        fd.append("file", file);

        const upRes = await fetch(`${apiBase}/api/uploads/menu-image`, {
          method: "POST",
          body: fd,
        });

        const upJson = await upRes.json().catch(() => ({} as any));
        if (!upRes.ok || !upJson?.ok || !upJson?.url) {
          const msg = upJson?.error ? `Upload: ${upJson.error}` : "No se pudo subir la imagen.";
          throw new Error(msg);
        }

        imageUrl = String(upJson.url);
      }

      // 2) Crear menú en API
      const payload: any = {
        type,
        title: title.trim(),
        description: description.trim(),
        priceCents,
        currency: "EUR",
        quantity: Math.floor(quantity),
        allowTimeAdjustment,
      };
      if (imageUrl) payload.imageUrl = imageUrl;

      const res = await fetch(`${apiBase}/api/restaurant/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok || !j?.id) {
        const msg = j?.error || j?.message || "No se pudo crear el menú.";
        throw new Error(msg);
      }

      setCreatedId(String(j.id));
      // Vuelves al panel (o déjalo aquí si prefieres)
      router.push("/r");
    } catch (err: any) {
      setError(err?.message ? String(err.message) : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Restaurante
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Crear menú</h1>
        <p className="text-sm text-slate-600">
          (MVP) Publica una oferta. Si quieres, añade foto.
        </p>
      </header>

      <Card className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Tipo</span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="TAKEAWAY">TAKEAWAY (para llevar)</option>
                <option value="DINEIN">DINEIN (en local)</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Cantidad</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-slate-700">Título</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Ej: Pack sushi sorpresa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-slate-700">Descripción</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              rows={3}
              placeholder="Qué incluye, alérgenos, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Precio (\u20ac)</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="8,50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={allowTimeAdjustment}
                onChange={(e) => setAllowTimeAdjustment(e.target.checked)}
              />
              <span className="text-sm text-slate-700">Permitir ajuste de hora</span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Foto (opcional)</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">Máx. 5MB. Se normaliza a JPG 16:10.</p>
            </label>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-700">Preview</p>
              <div className="mt-2 aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    Sin imagen
                  </div>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {createdId ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Menú creado: {createdId}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Publicando..." : "Publicar menú"}
            </Button>

            <Link
              className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
              href="/r"
            >
              Volver
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            API: <span className="font-mono">{apiBase}</span>
          </p>
        </form>
      </Card>
    </section>
  );
}