"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Tab = "login" | "registro";

// ─── Validación de contraseña ───────────────────────────
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

  // Barra de progreso
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
      {/* Barra */}
      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div className={"h-full rounded-full transition-all duration-300 " + barColor} style={{ width: pct + "%" }} />
      </div>

      {/* Reglas */}
      <div className="grid grid-cols-1 gap-1">
        {results.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className={"text-xs " + (r.ok ? "text-emerald-600" : "text-zinc-400")}>
              {r.ok ? "✓" : "○"}
            </span>
            <span className={"text-xs " + (r.ok ? "text-emerald-700 font-medium" : "text-zinc-400")}>
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

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Registro
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

      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }

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

      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }

      // Guardar ciudad, dirección y CP si los puso
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

  const tabClass = (t: Tab) =>
    "flex-1 py-2.5 text-sm font-semibold rounded-xl transition " +
    (tab === t ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="text-center mb-6">
        <Link href="/offers" className="text-sm text-zinc-500 hover:text-zinc-900">← Volver a ofertas</Link>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">BuenBocado</h1>
          <p className="mt-1 text-sm text-zinc-500">Ofertas exclusivas de restaurantes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-zinc-100 p-1 mb-6">
          <button type="button" onClick={() => { setTab("login"); setError(null); }} className={tabClass("login")}>
            Iniciar sesión
          </button>
          <button type="button" onClick={() => { setTab("registro"); setError(null); }} className={tabClass("registro")}>
            Crear cuenta
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* LOGIN */}
        {tab === "login" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Contraseña</span>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </label>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>

            <p className="text-center text-xs text-zinc-400">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => setTab("registro")} className="font-semibold text-zinc-700 underline">
                Regístrate
              </button>
            </p>
          </div>
        )}

        {/* REGISTRO */}
        {tab === "registro" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Nombre completo *</span>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="María García López"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Email *</span>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Teléfono</span>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Dirección</span>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Calle, número, piso…"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Ciudad</span>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Ej: Málaga"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Código postal</span>
                <input
                  type="text"
                  value={regPostalCode}
                  onChange={(e) => setRegPostalCode(e.target.value)}
                  placeholder="29001"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Contraseña *</span>
              <input
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="Crea una contraseña segura"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
              />
              <PasswordStrength password={regPass} />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Repetir contraseña *</span>
              <input
                type="password"
                value={regPass2}
                onChange={(e) => setRegPass2(e.target.value)}
                placeholder="Repite tu contraseña"
                className={"mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none " +
                  (regPass2.length === 0
                    ? "border-zinc-200 focus:border-zinc-400"
                    : passwordsMatch
                      ? "border-emerald-300 focus:border-emerald-400"
                      : "border-rose-300 focus:border-rose-400"
                  )}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
              {regPass2.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-rose-600">Las contraseñas no coinciden</p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-xs text-emerald-600">✓ Las contraseñas coinciden</p>
              )}
            </label>

            <button
              onClick={handleRegister}
              disabled={loading || !passwordValid || !passwordsMatch}
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>

            <p className="text-center text-xs text-zinc-400">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => setTab("login")} className="font-semibold text-zinc-700 underline">
                Inicia sesión
              </button>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
