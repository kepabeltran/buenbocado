"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type SettlementMode = "WEEKLY_CALENDAR" | "ROLLING_7D" | "CUSTOM_RANGE";

type AdminRestaurant = {
  id: string;
  name: string;
  slug: string | null;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  zoneTag: string;
  isActive: boolean;
  commissionBps: number;
  contactPeople: string | null;
  settlementMode: SettlementMode;
  settlementWeekday: number;
  settlementTimezone: string;
  logoUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000").trim();

function pctFromBps(bps: number) {
  return ((bps ?? 0) / 100).toFixed(2);
}

function modeLabel(m: SettlementMode) {
  switch (m) {
    case "WEEKLY_CALENDAR":
      return "Semanal (día fijo)";
    case "ROLLING_7D":
      return "Rodante (últimos 7 días)";
    case "CUSTOM_RANGE":
      return "Rango personalizado (pendiente)";
    default:
      return m;
  }
}

function inputStyle(disabled = false): CSSProperties {
  return {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    outline: "none",
  };
}

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 14,
  padding: 14,
};

const btnStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

export default function AdminRestaurantsPage() {
  const [items, setItems] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"edit" | "create">("edit");
  const isCreate = mode === "create";

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => items.find((r) => r.id === editingId) ?? null,
    [items, editingId]
  );

  const [draft, setDraft] = useState<Partial<AdminRestaurant>>({});
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/restaurants`, { cache: "no-store" });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.message || "Error cargando restaurantes");
      setItems(j.data || []);

      // si hay datos y estamos en modo edición sin selección, abre el primero
      if (!isCreate && !editingId && (j.data || []).length > 0) {
        startEdit(j.data[0]);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function startEdit(r: AdminRestaurant) {
    setMode("edit");
    setSavedMsg(null);
    setErr(null);
    setEditingId(r.id);
    setDraft({
      name: r.name,
      slug: r.slug ?? "",
      address: r.address,
      phone: r.phone ?? "",
      lat: r.lat,
      lng: r.lng,
      zoneTag: r.zoneTag,
      isActive: r.isActive,
      commissionBps: r.commissionBps,
      contactPeople: r.contactPeople ?? "",
      settlementMode: r.settlementMode,
      settlementWeekday: r.settlementWeekday,
      settlementTimezone: r.settlementTimezone,
    });
  }

  function startCreate() {
    setMode("create");
    setSavedMsg(null);
    setErr(null);
    setEditingId(null);
    setDraft({
      name: "",
      slug: "",
      address: "",
      phone: "",
      zoneTag: "GR-DEV",
      isActive: true,
      lat: 37.176,
      lng: -3.6,
      commissionBps: 1500,
      contactPeople: "",
      settlementMode: "WEEKLY_CALENDAR",
      settlementWeekday: 5,
      settlementTimezone: "Europe/Madrid",
    });
  }

  function cancelCreate() {
    setMode("edit");
    setErr(null);
    setSavedMsg(null);
    if (items.length > 0) startEdit(items[0]);
    else {
      setEditingId(null);
      setDraft({});
    }
  }

  async function save() {
    if (!editingId) return;
    setSavedMsg(null);
    setErr(null);

    const payload = {
      slug: String(draft.slug ?? "").trim() || null,
      address: String(draft.address ?? "").trim(),
      phone: String((draft as any).phone ?? "").trim() || null,
      zoneTag: String(draft.zoneTag ?? "").trim(),
      isActive: !!draft.isActive,
      lat: Number(draft.lat),
      lng: Number(draft.lng),
      commissionBps: Number(draft.commissionBps),
      contactPeople: String(draft.contactPeople ?? "").trim() || null,
      settlementMode: String(draft.settlementMode ?? "WEEKLY_CALENDAR").trim(),
      settlementWeekday: Number(draft.settlementWeekday ?? 1),
      settlementTimezone: String(draft.settlementTimezone ?? "Europe/Madrid").trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/restaurants/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.message || "Error guardando");
      setSavedMsg("Guardado ");
      await load();
      setEditingId(editingId);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function createFromDraft() {
    setSavedMsg(null);
    setErr(null);

    const name = String(draft.name ?? "").trim();
    const address = String(draft.address ?? "").trim();
    const zoneTag = String(draft.zoneTag ?? "").trim();
    const lat = Number(draft.lat);
    const lng = Number(draft.lng);

    if (!name) return setErr("name es obligatorio");
    if (!address) return setErr("address es obligatorio");
    if (!zoneTag) return setErr("zoneTag es obligatorio");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return setErr("lat/lng deben ser numéricos");

    const payload: any = {
      name,
      slug: String(draft.slug ?? "").trim() || undefined,
      address,
      phone: String(draft.phone ?? "").trim() || null,
      zoneTag,
      lat,
      lng,
      isActive: !!draft.isActive,
      commissionBps: Number.isFinite(Number(draft.commissionBps)) ? Math.trunc(Number(draft.commissionBps)) : 0,
      settlementMode: String(draft.settlementMode ?? "WEEKLY_CALENDAR").trim(),
      settlementWeekday: Number(draft.settlementWeekday ?? 5),
      settlementTimezone: String(draft.settlementTimezone ?? "Europe/Madrid").trim(),
      contactPeople: String(draft.contactPeople ?? "").trim() || null,
    };

    // si slug está vacío, que el API lo genere
    if (!payload.slug) delete payload.slug;

    try {
      const res = await fetch(`${API_BASE}/api/admin/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.message || "Error creando restaurante");

      const created = j.data as AdminRestaurant;
      setItems((prev) => [created, ...prev]);
      setMode("edit");
      startEdit(created);
      setSavedMsg("Creado ");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  const showForm = isCreate || !!editing;

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#f8efe8", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Admin · Restaurantes</h1>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              MVP: alta + edición de datos básicos + comisión + liquidación + contactos por restaurante.
            </div>
          </div>
          <button onClick={load} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", cursor: "pointer" }}>
            Recargar
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.8 }}><b>Nota:</b> Escribe la direccion y usa &quot;Buscar en Google Maps&quot; para obtener las coordenadas (clic derecho en el pin).</div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* LISTA */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Restaurantes ({items.length})</div>
              <button onClick={startCreate} style={btnStyle}>Nuevo</button>
            </div>

            {loading ? (
              <div style={{ opacity: 0.7 }}>Cargando</div>
            ) : items.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No hay restaurantes.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {items.map((r) => {
                  const active = r.id === editingId && !isCreate;
                  return (
                    <button
                      key={r.id}
                      onClick={() => startEdit(r)}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: active ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.9)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{r.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {r.address} · {r.zoneTag} · {r.isActive ? "Activo" : "Inactivo"}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                            {modeLabel(r.settlementMode)} · W{r.settlementWeekday} · {r.settlementTimezone}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800 }}>{pctFromBps(r.commissionBps)}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORM */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>{isCreate ? "Alta de restaurante" : "Edición"}</div>
              {savedMsg ? <span style={{ marginLeft: 10, color: "green" }}>{savedMsg}</span> : null}
              {err ? <span style={{ marginLeft: 10, color: "crimson" }}>{err}</span> : null}
            </div>

            {!isCreate && editing ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px dashed rgba(0,0,0,0.18)", background: "rgba(255,255,255,0.65)" }}>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <div style={{ fontWeight: 800, opacity: 0.9 }}>Código (ID)</div>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{editing.id}</div>
                </div>
                <button
                  onClick={() => {
                    try {
                      if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(editing.id);
                      setSavedMsg("ID copiado ");
                    } catch {
                      window.prompt("Copia el ID:", editing.id);
                    }
                  }}
                  style={{ ...btnStyle, padding: "6px 10px", fontSize: 12 }}
                >
                  Copiar
                </button>
              </div>
            ) : null}

            {!showForm ? (
              <div style={{ marginTop: 12, opacity: 0.7 }}>Selecciona un restaurante para editar o pulsa Nuevo.</div>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Nombre</span>
                    {isCreate ? (
                      <input value={String(draft.name ?? "")} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} style={inputStyle()} placeholder="Nombre del restaurante" />
                    ) : (
                      <input value={editing?.name ?? ""} disabled style={inputStyle(true)} />
                    )}
                  <span style={{ fontSize: 12, opacity: 0.7 }}>&nbsp;</span>
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Slug</span>
                    <input value={String(draft.slug ?? "")} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} style={inputStyle()} placeholder="la-gamba" />
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Si lo dejas vacío, el API lo genera.</span>
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Dirección</span>
                  <input value={String(draft.address ?? "")} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} style={inputStyle()} placeholder="Calle, ciudad" />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Teléfono (público)</span>
                  <input value={String(draft.phone ?? "")} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} style={inputStyle()} placeholder="+34 600 000 000" />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Se mostrará en la ficha del restaurante en la app.</span>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Zona</span>
                    <input value={String(draft.zoneTag ?? "")} onChange={(e) => setDraft((d) => ({ ...d, zoneTag: e.target.value }))} style={inputStyle()} placeholder="GR-CENTRO" />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Estado</span>
                    <select value={draft.isActive ? "1" : "0"} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.value === "1" }))} style={inputStyle()}>
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </label>
                </div>
                <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Pegar coordenadas de Google Maps</span>
                    <input style={inputStyle()} placeholder="37.17717, -3.59807 (pega aqui desde Google Maps)" onChange={(e) => { const v = e.target.value; const parts = v.split(",").map((s: string) => s.trim()); if (parts.length === 2) { const la = parseFloat(parts[0]); const ln = parseFloat(parts[1]); if (Number.isFinite(la) && Number.isFinite(ln)) { setDraft((d: any) => ({ ...d, lat: la, lng: ln })); } } }} />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Latitud</span>
                    <input value={String(draft.lat ?? "")} onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value as any }))} style={inputStyle()} placeholder="37.176" />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Longitud</span>
                    <input value={String(draft.lng ?? "")} onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value as any }))} style={inputStyle()} placeholder="-3.600" />
                  </label>
                </div>
                <a href={"https://www.google.com/maps/search/" + encodeURIComponent(String(draft.address || ""))} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#2563eb", cursor: "pointer", marginTop: 4 }}>Buscar en Google Maps (clic derecho en pin → copiar coordenadas)</a>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Comisión (bps)</span>
                  <input value={String(draft.commissionBps ?? 0)} onChange={(e) => setDraft((d) => ({ ...d, commissionBps: e.target.value as any }))} style={inputStyle()} placeholder="1200" />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>= {pctFromBps(Number(draft.commissionBps ?? 0))}% (100 bps = 1%)</span>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Liquidación</span>
                    <select value={String(draft.settlementMode ?? "WEEKLY_CALENDAR")} onChange={(e) => setDraft((d) => ({ ...d, settlementMode: e.target.value as any }))} style={inputStyle()}>
                      <option value="WEEKLY_CALENDAR">Semanal (día fijo)</option>
                      <option value="ROLLING_7D">Rodante (últimos 7 días)</option>
                      <option value="CUSTOM_RANGE">Rango personalizado</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Día (1-7)</span>
                    <input value={String(draft.settlementWeekday ?? 5)} onChange={(e) => setDraft((d) => ({ ...d, settlementWeekday: e.target.value as any }))} style={inputStyle()} placeholder="5" />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Zona horaria</span>
                  <input value={String(draft.settlementTimezone ?? "Europe/Madrid")} onChange={(e) => setDraft((d) => ({ ...d, settlementTimezone: e.target.value }))} style={inputStyle()} placeholder="Europe/Madrid" />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Contactos (una persona por línea)</span>
                  <textarea
                    value={String(draft.contactPeople ?? "")}
                    onChange={(e) => setDraft((d) => ({ ...d, contactPeople: e.target.value }))}
                    style={{ ...inputStyle(), minHeight: 110, resize: "vertical" }}
                    placeholder="Ana · gerente · +34 600 000 000 · ana@restaurante.com"
                  />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Aquí cabe nombre, rol, email y teléfono.</span>
                </label>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                  {isCreate ? (
                    <>
                      <button onClick={cancelCreate} style={{ ...btnStyle, fontWeight: 700 }}>Cancelar</button>
                      <button onClick={createFromDraft} style={{ ...btnStyle, fontWeight: 800 }}>Crear</button>
                    </>
                  ) : (
                    <>
                      <button onClick={save} style={{ ...btnStyle, fontWeight: 800 }}>Guardar</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
