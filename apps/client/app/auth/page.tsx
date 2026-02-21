"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (env && typeof env === "string" && env.trim()) {
    return env.trim().replace(/\/$/, "");
  }

  // DEV: use same hostname as this app (localhost or LAN IP)
  // so SameSite=Lax cookies (bb_access / bb_refresh) are sent.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

type Tab = "login" | "registro";

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
    passed <= 1 ? "bg-rose-500" :
    passed <= 2 ? "bg-orange-500" :
    passed <= 3 ? "bg-amber-500" :
    passed <= 4 ? "bg-lime-500" :
    "bg-emerald-500";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={"h-full rounded-full transition-all duration-300 " + barColor} style={{ width: pct + "%" }} />
      </div>
      <div className="grid grid-cols-1 gap-1">
        {results.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            {r.ok ? (
              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><circle cx="12" cy="12" r="9" /></svg>
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

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/offers";
  const { refreshUser, isLoggedIn } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPostalCode, setRegPostalCode] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");

  const passwordValid = useMemo(() => PASSWORD_RULES.every((r) => r.test(regPass)), [regPass]);
  const passwordsMatch = regPass === regPass2 && regPass2.length > 0;

  useEffect(() => {
    if (isLoggedIn) router.push(redirect);
  }, [isLoggedIn, redirect, router]);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      if (!loginEmail.trim() || !loginPass) throw new Error("Email y contraseña obligatorios");
      const res = await fetch(API_BASE + "/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPass }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error al iniciar sesión");
      if (json.accessToken) localStorage.setItem("bb_access_token", json.accessToken);
      await refreshUser();
      router.push(redirect);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setLoading(true);
    try {
      if (!regName.trim() || regName.trim().length < 2) throw new Error("Nombre obligatorio (mín. 2 caracteres)");
      if (!regEmail.trim() || !regEmail.includes("@")) throw new Error("Email inválido");
      if (!passwordValid) throw new Error("La contraseña no cumple todos los requisitos");
      if (regPass !== regPass2) throw new Error("Las contraseñas no coinciden");

      const res = await fetch(API_BASE + "/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim() || undefined,
          password: regPass,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error al registrarse");
      if (json.accessToken) localStorage.setItem("bb_access_token", json.accessToken);

      const token = json.accessToken;
      if (token && (regCity.trim() || regAddress.trim() || regPostalCode.trim())) {
        fetch(API_BASE + "/api/customer/me/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({
            city: regCity.trim() || null,
            address: regAddress.trim() || null,
            postalCode: regPostalCode.trim() || null,
          }),
        }).catch(() => {});
      }

      await refreshUser();
      router.push(redirect);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition";

  const tabClass = (t: Tab) =>
    "flex-1 py-2.5 text-sm font-bold rounded-xl transition " +
    (tab === t ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-emerald-700");

  return (
    <main className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      <div className="mx-auto max-w-[480px] px-4 py-8">

        {/* Botón volver */}
        <div className="mb-6">
          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Ofertas
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white">BB</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></h1>
            <p className="mt-1 text-xs text-slate-400">Ofertas exclusivas de restaurantes</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 mb-6">
            <button type="button" onClick={() => { setTab("login"); setError(null); }} className={tabClass("login")}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => { setTab("registro"); setError(null); }} className={tabClass("registro")}>
              Crear cuenta
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-700">Email</span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Contraseña</span>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Tu contraseña"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </label>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20"
              >
                {loading ? "Entrando…" : "Iniciar sesión"}
              </button>

              <p className="text-center text-xs text-slate-400">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => setTab("registro")} className="font-bold text-emerald-600 hover:underline">
                  Regístrate
                </button>
              </p>
            </div>
          )}

          {/* REGISTRO */}
          {tab === "registro" && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-700">Nombre completo *</span>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="María García López" className={inputClass} />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Email *</span>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="tu@email.com" className={inputClass} />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Teléfono</span>
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+34 600 000 000" className={inputClass} />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Dirección</span>
                <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} placeholder="Calle, número, piso…" className={inputClass} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Ciudad</span>
                  <input type="text" value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="Ej: Málaga" className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Código postal</span>
                  <input type="text" value={regPostalCode} onChange={(e) => setRegPostalCode(e.target.value)} placeholder="29001" className={inputClass} />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Contraseña *</span>
                <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Crea una contraseña segura" className={inputClass} />
                <PasswordStrength password={regPass} />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">Repetir contraseña *</span>
                <input
                  type="password"
                  value={regPass2}
                  onChange={(e) => setRegPass2(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={
                    "mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition " +
                    (regPass2.length === 0
                      ? "border-slate-200 focus:border-emerald-400"
                      : passwordsMatch
                        ? "border-emerald-300 focus:border-emerald-400"
                        : "border-rose-300 focus:border-rose-400"
                    )
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                {regPass2.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-xs text-rose-600">Las contraseñas no coinciden</p>
                )}
                {passwordsMatch && (
                  <div className="mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs text-emerald-600">Las contraseñas coinciden</span>
                  </div>
                )}
              </label>

              <button
                onClick={handleRegister}
                disabled={loading || !passwordValid || !passwordsMatch}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20"
              >
                {loading ? "Creando cuenta…" : "Crear cuenta"}
              </button>

              <p className="text-center text-xs text-slate-400">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => setTab("login")} className="font-bold text-emerald-600 hover:underline">
                  Inicia sesión
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
