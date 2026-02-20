"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type RestUserDto = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  restaurantId: string;
  createdAt: string;
  restaurant: { name: string } | null;
};

type RestaurantDto = {
  id: string;
  name: string;
};

function kickToLogin() {
  try {
    localStorage.removeItem("bb_admin_token");
    localStorage.removeItem("bb_admin_user");
  } catch {}
  if (typeof window !== "undefined") window.location.replace("/admin/login");
}

function getTokenOrKick() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("bb_admin_token");
  if (!t) { window.location.replace("/admin/login"); return null; }
  return t;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RestUserDto[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Form crear usuario
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("OWNER");
  const [formRestaurantId, setFormRestaurantId] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  // Modal credenciales enviadas
  const [credModal, setCredModal] = useState<{ email: string; password: string; restaurant: string } | null>(null);

  // Sending credentials loading state
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getTokenOrKick();
    if (!token) return;

    try {
      const [usersRes, restRes] = await Promise.all([
        fetch(API_BASE + "/api/admin/restaurant-users", { headers: { Authorization: "Bearer " + token } }),
        fetch(API_BASE + "/api/admin/restaurants", { headers: { Authorization: "Bearer " + token } }),
      ]);

      const usersJson = await usersRes.json().catch(() => ({}));
      const restJson = await restRes.json().catch(() => ({}));

      setUsers(usersJson.data || []);
      setRestaurants(restJson.data || []);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  async function createUser() {
    const token = getTokenOrKick();
    if (!token) return;
    setMsg(null);
    setFormBusy(true);

    try {
      if (!formEmail.includes("@")) throw new Error("Email inválido");
      if (formPassword.length < 6) throw new Error("Contraseña mín. 6 caracteres");
      if (!formRestaurantId) throw new Error("Selecciona un restaurante");

      const res = await fetch(API_BASE + "/api/admin/restaurant-users", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          role: formRole,
          restaurantId: formRestaurantId,
        }),
      });

      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error creando usuario");

      setMsg({ type: "ok", text: "Usuario creado: " + formEmail });
      setFormEmail("");
      setFormPassword("");
      setShowForm(false);
      await load();
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setFormBusy(false);
    }
  }

  async function resetPassword(userId: string) {
    const newPw = prompt("Nueva contraseña (mín. 6 caracteres):");
    if (!newPw || newPw.length < 6) { alert("Contraseña muy corta"); return; }

    const token = getTokenOrKick();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/admin/restaurant-users/" + userId + "/reset-password", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPw }),
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error");
      setMsg({ type: "ok", text: "Contraseña actualizada" });
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    }
  }

  async function sendCredentials(userId: string) {
    const token = getTokenOrKick();
    if (!token) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (!confirm(`Se generará una nueva contraseña temporal y se enviarán las credenciales a ${user.email}. ¿Continuar?`)) return;

    setSendingId(userId);
    setMsg(null);

    try {
      const res = await fetch(API_BASE + "/api/admin/restaurant-users/" + userId + "/send-credentials", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 401 || res.status === 403) { kickToLogin(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error enviando credenciales");

      setCredModal({
        email: user.email,
        password: json.tempPassword || "(ver terminal API)",
        restaurant: user.restaurant?.name || "—",
      });

      setMsg({ type: "ok", text: "Credenciales enviadas a " + user.email });
    } catch (e: any) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Usuarios Restaurante</h1>
          <p className="text-sm text-zinc-500">Gestión de accesos al portal restaurante</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          {showForm ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {msg && (
        <div className={"rounded-xl px-3 py-2 text-sm font-medium " + (msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
          {msg.text}
        </div>
      )}

      {/* Modal credenciales generadas */}
      {credModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCredModal(null)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900">Credenciales generadas</h2>
            <p className="mt-1 text-sm text-zinc-500">Comparte estos datos con el restaurante</p>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <div className="text-sm">
                <span className="text-zinc-500">Restaurante: </span>
                <span className="font-semibold text-zinc-900">{credModal.restaurant}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Email: </span>
                <span className="font-semibold text-zinc-900">{credModal.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Contraseña: </span>
                <span className="font-mono font-bold text-emerald-700">{credModal.password}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400">
              En producción este email se enviará automáticamente. Por ahora puedes copiar los datos y enviarlos manualmente.
            </p>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const text = `BuenBocado — Credenciales de acceso\n\nRestaurante: ${credModal.restaurant}\nEmail: ${credModal.email}\nContraseña: ${credModal.password}\nPortal: http://localhost:3001`;
                  try {
                    navigator.clipboard.writeText(text);
                    setMsg({ type: "ok", text: "Credenciales copiadas al portapapeles" });
                  } catch {
                    window.prompt("Copia las credenciales:", text);
                  }
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Copiar
              </button>
              <button
                onClick={() => setCredModal(null)}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form crear usuario */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-900">Crear usuario restaurante</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-zinc-700">Email</span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="usuario@restaurante.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-700">Contraseña</span>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-700">Restaurante</span>
              <select
                value={formRestaurantId}
                onChange={(e) => setFormRestaurantId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona…</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-700">Rol</span>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={createUser}
              disabled={formBusy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {formBusy ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : users.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay usuarios de restaurante.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Email</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Rol</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Restaurante</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Estado</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Creado</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2 text-xs font-semibold">{u.email}</td>
                  <td className="px-3 py-2 text-xs">{u.role}</td>
                  <td className="px-3 py-2 text-xs">{u.restaurant?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={"inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + (u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500")}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => sendCredentials(u.id)}
                        disabled={sendingId === u.id}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {sendingId === u.id ? "Enviando…" : "Enviar credenciales"}
                      </button>
                      <button
                        onClick={() => resetPassword(u.id)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Reset pwd
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
