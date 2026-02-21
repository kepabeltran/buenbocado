"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (env && typeof env === "string" && env.trim()) {
    return env.trim().replace(/\/$/, "");
  }

  // DEV: use same hostname as the Admin app (localhost or LAN IP)
  // so SameSite=Lax cookies (bb_access / bb_refresh) are sent.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

type AdminUser = { id: string; email: string; name: string; role: string };

const NAV_ITEMS = [
  { href: "/admin/restaurants", label: "Restaurantes" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/offers", label: "Ofertas" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/settlements", label: "Liquidaciones" },
];

function clearAdminStorage() {
  try {
    localStorage.removeItem("bb_admin_token");
    localStorage.removeItem("bb_admin_user");
  } catch {}
}

function kickToLogin(router: ReturnType<typeof useRouter>) {
  clearAdminStorage();
  router.replace("/admin/login");
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(API_BASE + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    const t = typeof json?.accessToken === "string" ? json.accessToken : null;
    if (t) localStorage.setItem("bb_admin_token", t);
    return t;
  } catch {
    return null;
  }
}

async function fetchMe(token: string | null): Promise<AdminUser | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(API_BASE + "/api/auth/me", {
      headers,
      credentials: "include",
    });

    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    if (json?.user?.role !== "admin") return null;
    return json.user as AdminUser;
  } catch {
    return null;
  }
}

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
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function check() {
      setLoading(true);

      // 1) Try with local token (if any)
      let token = getToken();
      let me = await fetchMe(token);

      // 2) If invalid, try cookie-based session (bb_access)
      if (!me) {
        me = await fetchMe(null);
      }

      // 3) If still not, try refresh (bb_refresh) and retry
      if (!me) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
          me = await fetchMe(token);
        }
      }

      if (cancelled) return;

      if (!me) {
        kickToLogin(router);
        return;
      }

      setUser(me);
      setLoading(false);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [getToken, router, isLoginPage]);

  function logout() {
    clearAdminStorage();
    fetch(API_BASE + "/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    router.push("/admin/login");
  }

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Cargando...</p>
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

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}