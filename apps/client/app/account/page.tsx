"use client";

import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountPage() {
  const { user, loading, isLoggedIn, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/auth");
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm text-zinc-500">Cargando…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/offers" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white font-semibold">
              BB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">mi cuenta</div>
            </div>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-8 space-y-6">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-zinc-900 text-2xl font-bold text-white">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{user.name}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
            {user.phone && (
              <p className="text-sm text-zinc-500">{user.phone}</p>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <Link
            href="/orders"
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Mis pedidos
            <span className="text-zinc-400">→</span>
          </Link>

          <Link
            href="/offers"
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Ver ofertas
            <span className="text-zinc-400">→</span>
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          Cerrar sesión
        </button>

        {/* Legal */}
        <p className="text-center text-xs text-zinc-400">
          BuenBocado · Buen precio, mejor bocado
        </p>
      </div>
    </main>
  );
}
