"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Tab = "login" | "register";

export default function ClientAuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Email o contraseña incorrectos");
        return;
      }

      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }
      if (json.user) {
        localStorage.setItem("bb_customer_user", JSON.stringify(json.user));
      }

      router.push("/offers");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (regPassword !== regPassword2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim() || undefined,
          password: regPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Error al registrarse");
        return;
      }

      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }
      if (json.user) {
        localStorage.setItem("bb_customer_user", JSON.stringify(json.user));
      }

      router.push("/offers");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const tabClass = (t: Tab) =>
    `flex-1 py-2 text-center text-sm font-semibold rounded-xl transition-colors ${
      tab === t
        ? "bg-zinc-900 text-white"
        : "text-zinc-500 hover:text-zinc-700"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-zinc-900 text-2xl font-bold text-white">
            BB
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">BuenBocado</h1>
          <p className="mt-1 text-sm text-zinc-500">Buen precio, mejor bocado</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1">
          <button type="button" className={tabClass("login")} onClick={() => { setTab("login"); setError(null); }}>
            Entrar
          </button>
          <button type="button" className={tabClass("register")} onClick={() => { setTab("register"); setError(null); }}>
            Crear cuenta
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        )}

        {/* Login form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Contraseña</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Nombre</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Teléfono <span className="text-zinc-400">(opcional)</span>
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+34 600 000 000"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Contraseña</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mín. 6 caracteres"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Repetir contraseña</label>
              <input
                type="password"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/offers" className="text-xs text-zinc-400 hover:text-zinc-600">
            Explorar ofertas sin cuenta →
          </Link>
        </div>
      </div>
    </div>
  );
}
