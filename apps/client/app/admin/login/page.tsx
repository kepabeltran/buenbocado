"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

export default function AdminLoginPage() {
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
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
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

      if (json.accessToken) {
        localStorage.setItem("bb_access_token", json.accessToken);
      }
      if (json.user) {
        localStorage.setItem("bb_admin_user", JSON.stringify(json.user));
      }

      router.push("/admin/restaurants");
    } catch {
      setError("Error de conexión. ¿Está la API arrancada?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-700 text-2xl font-bold text-white">
            BB
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-zinc-500">Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@buenbocado.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
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
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
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
            className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar como Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
