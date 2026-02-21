"use client";

import { useState, FormEvent, useMemo } from "react";
import { useRouter } from "next/navigation";

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (env && typeof env === "string" && env.trim()) {
    return env.trim().replace(/\/$/, "");
  }

  // DEV: use same hostname as this app (so SameSite=Lax cookies work)
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");

      if (json?.accessToken) localStorage.setItem("bb_admin_token", json.accessToken);
      if (json?.user) localStorage.setItem("bb_admin_user", JSON.stringify(json.user));

      router.push("/admin/restaurants");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">Acceso al panel</p>

        {err && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-700">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-2 text-[11px] text-zinc-500">
            DEV: para cookies de sesion (bb_access / bb_refresh) usa la misma IP/hostname en app y API.
          </p>
        </form>
      </div>
    </div>
  );
}