"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────

type CustomerUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer";
};

type AuthState = {
  user: CustomerUser | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
  isLoggedIn: boolean;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

// ─── Context ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isLoggedIn: false,
  logout: async () => {},
  refreshUser: async () => {},
  getToken: () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Helper: only accept customer role
function onlyCustomer(user: any): CustomerUser | null {
  if (!user) return null;
  if (user.role && user.role !== "customer") {
    localStorage.removeItem("bb_access_token");
    return null;
  }
  return user;
}

// ─── Provider ─────────────────────────────────────────────
// NOTA: El cliente puede navegar ofertas sin estar logueado.
// Solo se requiere login para reservar, ver pedidos, etc.

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bb_access_token");
  }, []);

  const fetchMe = useCallback(async (): Promise<CustomerUser | null> => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.status === 401) {
        // Intentar refresh
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) {
          localStorage.removeItem("bb_access_token");
          return null;
        }

        const refreshJson = await refreshRes.json();
        if (refreshJson.accessToken) {
          localStorage.setItem("bb_access_token", refreshJson.accessToken);
          const retryRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${refreshJson.accessToken}` },
            credentials: "include",
          });
          if (!retryRes.ok) return null;
          const retryJson = await retryRes.json();
          return onlyCustomer(retryJson?.user);
        }
        return null;
      }

      if (!res.ok) return null;
      const json = await res.json();
      return onlyCustomer(json?.user);
    } catch {
      return null;
    }
  }, [getToken]);

  const refreshUser = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const user = await fetchMe();
    setState({ user, loading: false });
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("bb_access_token");
    localStorage.removeItem("bb_customer_user");
    setState({ user: null, loading: false });
    router.push("/offers");
  }, [router]);

  // Verificar sesión al montar
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isLoggedIn = !!state.user;

  return (
    <AuthContext.Provider value={{ ...state, isLoggedIn, logout, refreshUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
