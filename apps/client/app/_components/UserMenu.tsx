"use client";

import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

export function UserMenu() {
  const { user, loading, isLoggedIn, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-xl bg-zinc-100" />
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <div className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <span className="max-w-[100px] truncate">{user?.name || "Cuenta"}</span>
      </Link>
    </div>
  );
}
