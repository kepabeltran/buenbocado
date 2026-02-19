"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
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
        <div className={"h-full rounded-full transition-all duration-300 " + barColor} style={{ width: pct + "%" }} />
      </div>
      <div className="grid grid-cols-1 gap-1">
        {results.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            {r.ok ? (
              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            <span className={"text-xs " + (r.ok ? "text-emerald-700 font-medium" : "text-slate-400")}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RestaurantSettingsPage() {
  const { user, getToken, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const passwordValid = useMemo(() => PASSWORD_RULES.every((r) => r.test(newPassword)), [newPassword]);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!currentPassword || !newPassword) {
      setMsg({ type: "error", text: "Rellena la contraseña actual y la nueva." });
      return;
    }
    if (!passwordValid) {
      setMsg({ type: "error", text: "La nueva contraseña no cumple todos los requisitos." });
      return;
    }
    if (!passwordsMatch) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    if (currentPassword === newPassword) {
      setMsg({ type: "error", text: "La nueva contraseña debe ser distinta a la actual." });
      return;
    }

    const token = getToken();
    if (!token) {
      setMsg({ type: "error", text: "No hay sesión activa. Vuelve a iniciar sesión." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/restaurant/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "HTTP " + res.status);

      setMsg({ type: "ok", text: "Contraseña actualizada. Te pediremos iniciar sesión de nuevo." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Seguridad: forzamos re-login para cerrar la sesión actual
      setTimeout(() => {
        void logout();
      }, 1200);
    } catch (err: any) {
      setMsg({ type: "error", text: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition";

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Botón volver (estilo app) */}
      <div className="mb-6">
        <Link
          href="/r"
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Panel
        </Link>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Seguridad</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.email ? (
            <>
              Cuenta: <span className="font-semibold">{user.email}</span>
            </>
          ) : (
            "Cambia tu contraseña de acceso."
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {msg && (
          <div
            className={
              "mb-4 rounded-xl px-4 py-3 text-sm font-semibold " +
              (msg.type === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200")
            }
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Crea una contraseña segura"
              required
            />
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Repite la nueva contraseña"
              required
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-rose-600 font-semibold">Las contraseñas no coinciden</p>
            )}
            {passwordsMatch && <p className="mt-1 text-xs text-emerald-600 font-semibold">Las contraseñas coinciden</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition active:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </button>

          <p className="text-xs text-slate-400">Nota: al cambiarla, te cerraremos sesión para que vuelvas a entrar con la nueva.</p>
        </form>
      </div>
    </div>
  );
}
