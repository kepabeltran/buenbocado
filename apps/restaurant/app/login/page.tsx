"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

export default function RestaurantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Guardar token también en localStorage como backup (para fetch desde client-side)
      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }
      if (json.user) {
        localStorage.setItem("bb_restaurant_user", JSON.stringify(json.user));
      }

      router.push("/r");
    } catch (err: any) {
      setError("Error de conexión. ¿Está la API arrancada?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-zinc-900 text-2xl font-bold text-white">
            BB
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Portal Restaurante</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Accede para gestionar tus ofertas y pedidos
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@restaurante.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 active:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          ¿No tienes cuenta? Contacta con el administrador.
        </p>
      </div>
    </div>
  );
}
