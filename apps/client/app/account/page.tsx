"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

export default function AccountPage() {
  const { user, isLoggedIn, loading: authLoading, logout, getToken, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Cargar perfil completo
  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    async function loadProfile() {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(API_BASE + "/api/auth/me", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json().catch(() => ({}));
        if (json?.user) {
          setName(json.user.name || "");
          setPhone(json.user.phone || "");
          setCity(json.user.city || "");
          setAddress(json.user.address || "");
          setPostalCode(json.user.postalCode || "");
        }
        setProfileLoaded(true);
      } catch { setProfileLoaded(true); }
    }

    loadProfile();
  }, [authLoading, isLoggedIn, getToken]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  async function saveProfile() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setMsg(null);

    try {
      if (!name.trim() || name.trim().length < 2) throw new Error("Nombre mín. 2 caracteres");

      const res = await fetch(API_BASE + "/api/customer/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          postalCode: postalCode.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error guardando");

      setMsg({ type: "ok", text: "Perfil actualizado" });
      await refreshUser();
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  }

  // Pedir ubicación GPS
  async function requestLocation() {
    if (!navigator.geolocation) {
      setMsg({ type: "error", text: "Tu navegador no soporta geolocalización" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const token = getToken();
        if (!token) return;

        try {
          await fetch(API_BASE + "/api/customer/me/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ lat, lng }),
          });
          setMsg({ type: "ok", text: "Ubicación actualizada" });
        } catch {
          setMsg({ type: "error", text: "Error guardando ubicación" });
        }
      },
      () => {
        setMsg({ type: "error", text: "Permiso de ubicación denegado" });
      },
      { enableHighAccuracy: true }
    );
  }

  if (authLoading || !profileLoaded) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-zinc-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Link href="/offers" className="text-sm text-zinc-500 hover:text-zinc-900">← Volver a ofertas</Link>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Mi cuenta</h1>
        <p className="mt-1 text-sm text-zinc-500">{user?.email}</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Nombre completo</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Teléfono</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Ciudad</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Málaga"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Dirección</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, piso…"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Código postal</span>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="29001"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          {/* GPS */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Ubicación GPS</p>
                <p className="text-xs text-blue-700">Para mostrarte ofertas cercanas</p>
              </div>
              <button
                onClick={requestLocation}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                📍 Activar
              </button>
            </div>
          </div>
        </div>

        {msg && (
          <div className={"mt-4 rounded-xl px-4 py-2 text-sm font-medium " + (msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
            {msg.text}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          <Link
            href="/orders"
            className="w-full text-center rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Mis pedidos
          </Link>

          <button
            onClick={logout}
            className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
