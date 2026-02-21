"use client";

import { useState, FormEvent, useMemo } from "react";
import { useRouter } from "next/navigation";

function isPrivateHost(host: string) {
  if (host === "localhost" || host === "127.0.0.1") return true;
  return (
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  const envTrim = typeof env === "string" ? env.trim() : "";

  if (typeof window !== "undefined" && window.location) {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    const isWeb = proto === "http:" || proto === "https:";

    if (isWeb && host && isPrivateHost(host)) {
      let envHost = "";
      try {
        if (envTrim) envHost = new URL(envTrim).hostname;
      } catch {
        envHost = "";
      }

      if (!envHost || (isPrivateHost(envHost) && envHost !== host)) {
        return `http://${host}:4000`;
      }
    }
  }

  if (envTrim) return envTrim.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

export default function RestaurantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/restaurant/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.message || "Email o contraseña incorrectos");
        return;
      }

      if (json.accessToken) localStorage.setItem("bb_access_token", json.accessToken);
      if (json.user) localStorage.setItem("bb_restaurant_user", JSON.stringify(json.user));

      router.replace("/r");
    } catch {
      setError("Error de conexion. ¿Esta la API arrancada?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#fafdf7] to-emerald-50/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-2xl font-extrabold text-white">
            BB
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Portal Restaurante</h1>
          <p className="mt-1 text-sm text-slate-400">Accede para gestionar tus ofertas y pedidos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@restaurante.com"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition active:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-300">¿No tienes cuenta? Contacta con el administrador.</p>
      </div>
    </div>
  );
}
