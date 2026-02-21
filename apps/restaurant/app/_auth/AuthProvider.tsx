"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

type RestaurantUser = {
  id: string;
  email: string;
  role: string;
  restaurantRole?: string;
  restaurantId: string;
  restaurantName: string;
};

type AuthState = {
  user: RestaurantUser | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
};

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (env && typeof env === "string" && env.trim()) {
    return env.trim().replace(/\/$/, "");
  }

  // DEV: use same hostname as the Restaurant app (localhost or LAN IP)
  // so SameSite=Lax cookies (bb_access / bb_refresh) are sent.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

const PUBLIC_PATHS = ["/login"];

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
  refreshUser: async () => {},
  getToken: () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

function clearRestaurantStorage() {
  try {
    localStorage.removeItem("bb_access_token");
    localStorage.removeItem("bb_restaurant_user");
  } catch {}
}

async function refreshAccessToken(): Promise<string | null> {
  // Uses HttpOnly bb_refresh cookie when present (SameSite=Lax)
  try {
    const res = await fetch(API_BASE + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    const t = typeof json?.accessToken === "string" ? json.accessToken : null;
    if (t) localStorage.setItem("bb_access_token", t);
    return t;
  } catch {
    return null;
  }
}

async function fetchMe(token: string | null): Promise<RestaurantUser | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(API_BASE + "/api/auth/me", {
      headers,
      credentials: "include",
    });

    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    const user = json?.user ?? null;
    if (!user) return null;

    // role guard
    if (user.role !== "restaurant") return null;

    return user as RestaurantUser;
  } catch {
    return null;
  }
}

async function fetchUserWithFallback(): Promise<RestaurantUser | null> {
  // 1) Try with local token (if any)
  const token = typeof window !== "undefined" ? localStorage.getItem("bb_access_token") : null;
  if (token) {
    const me = await fetchMe(token);
    if (me) return me;
  }

  // 2) Try refresh using HttpOnly cookie -> store token -> retry
  const newToken = await refreshAccessToken();
  if (newToken) {
    const me = await fetchMe(newToken);
    if (me) return me;
  }

  // 3) Last try: cookie-only /me (in case server supports bb_access cookie directly)
  const meCookie = await fetchMe(null);
  if (meCookie) {
    // ensure token exists for the rest of the app (many screens use Authorization)
    await refreshAccessToken();
    return meCookie;
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bb_access_token");
  }, []);

  const refreshUser = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const user = await fetchUserWithFallback();
    setState({ user, loading: false, error: null });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(API_BASE + "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    clearRestaurantStorage();
    setState({ user: null, loading: false, error: null });
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Periodic session check (soft-hardening)
  useEffect(() => {
    if (!state.user) return;

    const t = setInterval(async () => {
      const u = await fetchUserWithFallback();
      if (!u) {
        await logout();
      }
    }, 60000); // 60s (avoid hammering the API)

    return () => clearInterval(t);
  }, [state.user, logout]);

  useEffect(() => {
    if (state.loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (!state.user && !isPublic) {
      router.replace("/login");
    }

    if (state.user && isPublic) {
      router.replace("/r");
    }
  }, [state.loading, state.user, pathname, router]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
