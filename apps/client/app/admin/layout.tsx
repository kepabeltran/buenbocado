"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type AdminUser = { id: string; email: string; name: string; role: string };

const NAV_ITEMS = [
  { href: "/admin/restaurants", label: "Restaurantes" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/offers", label: "Ofertas" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/settlements", label: "Liquidaciones" },
];
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bb_admin_token");
  }, []);

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return; }

    async function check() {
      const token = getToken();
      if (!token) { setLoading(false); router.push("/admin/login"); return; }

      try {
        const res = await fetch(API_BASE + "/api/auth/me", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!res.ok) { router.push("/admin/login"); return; }
        const json = await res.json();
        if (json?.user?.role !== "admin") { router.push("/admin/login"); return; }
        setUser(json.user);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [getToken, router, isLoginPage]);

  function logout() {
    localStorage.removeItem("bb_admin_token");
    localStorage.removeItem("bb_admin_user");
    fetch(API_BASE + "/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    router.push("/admin/login");
  }

  // Login page: render without nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Cargando…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-700 text-sm font-bold text-white">
              BB
            </div>
            <span className="text-sm font-bold text-zinc-900">Admin</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                    (active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{user.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
