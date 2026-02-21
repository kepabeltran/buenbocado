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

  // In dev on private networks, keep API host aligned with the current app host
  // so SameSite=Lax cookies work (localhost vs 127.0.0.1 vs 192.168.x.x).
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

    if (user.role !== "restaurant") return null;

    return user as RestaurantUser;
  } catch {
    return null;
  }
}

async function fetchUserWithFallback(): Promise<RestaurantUser | null> {
  // 1) Try with local token (if any)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bb_access_token") : null;
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

  // 3) Cookie-only /me (if server supports bb_access cookie directly)
  const meCookie = await fetchMe(null);
  if (meCookie) {
    await refreshAccessToken(); // best-effort token for Authorization-based screens
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

  // Important: after a successful login, the token appears in localStorage,
  // but this provider (already mounted) must re-check once before redirecting.
  const [softRetryDone, setSoftRetryDone] = useState(false);

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
    setSoftRetryDone(false);
    setState({ user: null, loading: false, error: null });
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!state.user) return;

    const t = setInterval(async () => {
      const u = await fetchUserWithFallback();
      if (!u) await logout();
    }, 60000);

    return () => clearInterval(t);
  }, [state.user, logout]);

  useEffect(() => {
    if (state.loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

    // Reset soft retry whenever we're on the login route
    if (isPublic) {
      if (softRetryDone) setSoftRetryDone(false);
      if (state.user) router.replace("/r");
      return;
    }

    // Protected route
    if (!state.user) {
      // One soft retry to catch "token just stored after login" without needing Ctrl+F5
      if (!softRetryDone) {
        setSoftRetryDone(true);
        refreshUser();
        return;
      }
      router.replace("/login");
    }
  }, [state.loading, state.user, pathname, router, softRetryDone, refreshUser]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
