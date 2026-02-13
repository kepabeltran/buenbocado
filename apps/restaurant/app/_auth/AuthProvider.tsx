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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

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

  const fetchMe = useCallback(async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch(API_BASE + "/api/auth/me", {
        headers: { Authorization: "Bearer " + token },
        credentials: "include",
      });

      if (res.status === 401) {
        const refreshRes = await fetch(API_BASE + "/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) return null;

        const refreshJson = await refreshRes.json();
        if (refreshJson.accessToken) {
          localStorage.setItem("bb_access_token", refreshJson.accessToken);
          const retryRes = await fetch(API_BASE + "/api/auth/me", {
            headers: { Authorization: "Bearer " + refreshJson.accessToken },
            credentials: "include",
          });
          if (!retryRes.ok) return null;
          const retryJson = await retryRes.json();
          return retryJson?.user ?? null;
        }
        return null;
      }

      if (!res.ok) return null;
      const json = await res.json();
      return json?.user ?? null;
    } catch {
      return null;
    }
  }, [getToken]);

  const refreshUser = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const user = await fetchMe();
    setState({ user, loading: false, error: null });
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await fetch(API_BASE + "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("bb_access_token");
    localStorage.removeItem("bb_restaurant_user");
    setState({ user: null, loading: false, error: null });
    router.push("/login");
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (state.loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (!state.user && !isPublic) {
      router.push("/login");
    }

    if (state.user && isPublic) {
      router.push("/r");
    }
  }, [state.loading, state.user, pathname, router]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
