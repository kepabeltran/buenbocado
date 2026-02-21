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

function resolveApiBase() {
  const env =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (env && typeof env === "string" && env.trim()) {
    return env.trim().replace(/\/$/, "");
  }

  // DEV: use same hostname as this app (localhost or LAN IP)
  // so SameSite=Lax cookies (bb_access / bb_refresh) are sent.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

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

function clearCustomerStorage() {
  try {
    localStorage.removeItem("bb_access_token");
    localStorage.removeItem("bb_customer_user");
  } catch {}
}

// Helper: only accept customer role
function onlyCustomer(user: any): CustomerUser | null {
  if (!user) return null;
  if (user.role && user.role !== "customer") {
    clearCustomerStorage();
    return null;
  }
  return user;
}

async function refreshAccessToken(): Promise<string | null> {
  // Uses HttpOnly bb_refresh cookie when present (SameSite=Lax)
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
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

async function fetchMe(token: string | null): Promise<CustomerUser | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers,
      credentials: "include",
    });

    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    return onlyCustomer(json?.user);
  } catch {
    return null;
  }
}

async function fetchCustomerWithFallback(): Promise<CustomerUser | null> {
  // 1) Try with local token (if any)
  const token = typeof window !== "undefined" ? localStorage.getItem("bb_access_token") : null;
  if (token) {
    const me = await fetchMe(token);
    if (me) return me;
  }

  // 2) Try cookie-based /me (if server uses bb_access cookie)
  const meCookie = await fetchMe(null);
  if (meCookie) {
    // Ensure we also have a token for Authorization-based calls
    await refreshAccessToken();
    return meCookie;
  }

  // 3) Try refresh via bb_refresh cookie and retry
  const newToken = await refreshAccessToken();
  if (newToken) {
    const me = await fetchMe(newToken);
    if (me) return me;
  }

  return null;
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

  const refreshUser = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const user = await fetchCustomerWithFallback();
    setState({ user, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    clearCustomerStorage();
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
