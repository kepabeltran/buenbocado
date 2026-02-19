"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type PasswordRule = { label: string; test: (p: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Un número", test: (p) => /[0-9]/.test(p) },
  { label: "Un símbolo (!@#$%...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const pct = Math.round((passed / total) * 100);

  const barColor =
    passed <= 1
      ? "bg-rose-500"
      : passed <= 2
        ? "bg-orange-500"
        : passed <= 3
          ? "bg-amber-500"
          : passed <= 4
            ? "bg-lime-500"
            : "bg-emerald-500";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={"h-full rounded-full transition-all duration-300 " + barColor}
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="grid grid-cols-1 gap-1">
        {results.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            {r.ok ? (
              <svg
                className="w-3 h-3 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-3 h-3 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            <span className={"text-xs " + (r.ok ? "text-emerald-700 font-medium" : "text-slate-400")}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, isLoggedIn, loading: authLoading, logout, getToken, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [msgProfile, setMsgProfile] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Password change state (customer)
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [msgPw, setMsgPw] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const passwordValid = useMemo(() => PASSWORD_RULES.every((r) => r.test(newPassword)), [newPassword]);
  const passwordsMatch = useMemo(
    () => newPassword === confirmPassword && confirmPassword.length > 0,
    [newPassword, confirmPassword]
  );

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
      } catch {
        setProfileLoaded(true);
      }
    }
    loadProfile();
  }, [authLoading, isLoggedIn, getToken]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!msgProfile) return;
    const t = setTimeout(() => setMsgProfile(null), 3000);
    return () => clearTimeout(t);
  }, [msgProfile]);

  useEffect(() => {
    if (!msgPw) return;
    const t = setTimeout(() => setMsgPw(null), 4000);
    return () => clearTimeout(t);
  }, [msgPw]);

  async function saveProfile() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setMsgProfile(null);
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
      setMsgProfile({ type: "ok", text: "Perfil actualizado" });
      await refreshUser();
    } catch (e: any) {
      setMsgProfile({ type: "error", text: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  }

  async function requestLocation() {
    if (!navigator.geolocation) {
      setMsgProfile({ type: "error", text: "Tu navegador no soporta geolocalización" });
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
          setMsgProfile({ type: "ok", text: "Ubicación actualizada" });
        } catch {
          setMsgProfile({ type: "error", text: "Error guardando ubicación" });
        }
      },
      () => {
        setMsgProfile({ type: "error", text: "Permiso de ubicación denegado" });
      },
      { enableHighAccuracy: true }
    );
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setMsgPw(null);

    if (!currentPassword || !newPassword) {
      setMsgPw({ type: "error", text: "Rellena la contraseña actual y la nueva." });
      return;
    }
    if (currentPassword === newPassword) {
      setMsgPw({ type: "error", text: "La nueva contraseña debe ser distinta a la actual." });
      return;
    }
    if (!passwordValid) {
      setMsgPw({ type: "error", text: "La nueva contraseña no cumple todos los requisitos." });
      return;
    }
    if (!passwordsMatch) {
      setMsgPw({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    const token = getToken();
    if (!token) {
      setMsgPw({ type: "error", text: "No hay sesión activa. Vuelve a iniciar sesión." });
      return;
    }

    setSavingPw(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/customer/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error cambiando contraseña");

      setMsgPw({ type: "ok", text: "Contraseña actualizada. Vuelve a entrar con la nueva." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        void logout();
      }, 1200);
    } catch (err: any) {
      setMsgPw({ type: "error", text: String(err?.message || err) });
    } finally {
      setSavingPw(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition";

  if (authLoading || !profileLoaded) {
    return (
      <main
        className="min-h-screen bg-[#fafdf7] grid place-items-center"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <p className="text-sm text-slate-400">Cargando…</p>
      </main>
    );
  }

  const firstName = (user?.name || user?.email || "").split(" ")[0].split("@")[0];

  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap"
        rel="stylesheet"
      />

      <div className="mx-auto max-w-[480px] px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Ofertas
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-[8px] font-extrabold text-white">
              BB
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              Buen<span className="text-emerald-600">Bocado</span>
            </span>
          </Link>
        </div>

        {/* Saludo */}
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-900">Hola, {firstName}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
        </div>

        {/* PERFIL */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Nombre completo</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-700">Teléfono</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className={inputClass}
              />
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
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Activar
                </button>
              </div>
            </div>
          </div>

          {msgProfile && (
            <div
              className={
                "mt-4 rounded-xl px-4 py-2.5 text-sm font-medium " +
                (msgProfile.type === "ok"
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-700")
              }
            >
              {msgProfile.text}
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

        {/* SEGURIDAD (Acordeón) */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Seguridad</h2>
              <p className="text-xs text-slate-400 mt-0.5">Cambia tu contraseña de acceso</p>
            </div>

            <button
              type="button"
              onClick={() => setPwOpen((v) => !v)}
              className={
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition border " +
                (pwOpen
                  ? "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700")
              }
            >
              {pwOpen ? "Cerrar" : "Cambiar contraseña"}
              <svg
                className={"w-4 h-4 transition-transform " + (pwOpen ? "rotate-180 text-slate-400" : "text-white")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {!pwOpen && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-[12px] text-slate-600">
                Consejo rápido: usa una contraseña con <b>8+ caracteres</b>, mayúsculas, números y símbolos.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Por seguridad, al cambiarla se cerrará tu sesión.</p>
            </div>
          )}

          {pwOpen && (
            <div className="mt-4">
              {msgPw && (
                <div
                  className={
                    "mb-4 rounded-xl px-4 py-2.5 text-sm font-medium " +
                    (msgPw.type === "ok"
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-700")
                  }
                >
                  {msgPw.text}
                </div>
              )}

              <form onSubmit={onChangePassword} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Contraseña actual</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Nueva contraseña</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                    placeholder="Crea una contraseña segura"
                    required
                  />
                  <PasswordStrength password={newPassword} />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Confirmar nueva contraseña</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Las contraseñas no coinciden</p>
                  )}
                  {passwordsMatch && <p className="mt-1 text-xs text-emerald-600 font-semibold">Las contraseñas coinciden</p>}
                </label>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20"
                  >
                    {savingPw ? "Cambiando…" : "Guardar nueva contraseña"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPwOpen(false)}
                    className="w-full rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                  >
                    Cancelar
                  </button>

                  <p className="text-[11px] text-slate-400">Por seguridad, al cambiar la contraseña se cerrará tu sesión.</p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
