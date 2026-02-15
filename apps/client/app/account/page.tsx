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

  async function requestLocation() {
    if (!navigator.geolocation) {
      setMsg({ type: "error", text: "Tu navegador no soporta geolocalización" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const token = getToken();
        if (!token) return;
        try {
          await fetch(API_BASE + "/api/customer/me/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          setMsg({ type: "ok", text: "Ubicación actualizada" });
        } catch {
          setMsg({ type: "error", text: "Error guardando ubicación" });
        }
      },
      () => { setMsg({ type: "error", text: "Permiso de ubicación denegado" }); },
      { enableHighAccuracy: true }
    );
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition";

  if (authLoading || !profileLoaded) {
    return (
      <main className="min-h-screen bg-[#fafdf7] grid place-items-center" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <p className="text-sm text-slate-400">Cargando…</p>
      </main>
    );
  }

  const firstName = (user?.name || user?.email || "").split(" ")[0].split("@")[0];

  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      <div className="mx-auto max-w-[480px] px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Ofertas
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">BB</span>
            <span className="text-sm font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </Link>
        </div>

        {/* Saludo */}
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-900">Hola, {firstName}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Nombre completo</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-700">Teléfono</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" className={inputClass} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-700">Ciudad</span>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Málaga" className={inputClass} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-700">Código postal</span>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="29001" className={inputClass} />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-slate-700">Dirección</span>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, piso…" className={inputClass} />
            </label>

            {/* GPS */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800">Ubicación GPS</p>
                  <p className="text-[11px] text-emerald-600">Para mostrarte ofertas cercanas</p>
                </div>
                <button
                  onClick={requestLocation}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Activar
                </button>
              </div>
            </div>
          </div>

          {msg && (
            <div className={"mt-4 rounded-xl px-4 py-2.5 text-sm font-medium " + (msg.type === "ok" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-700")}>
              {msg.text}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>

            <Link
              href="/orders"
              className="w-full text-center rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
            >
              Mis pedidos
            </Link>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-white border border-rose-200 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
