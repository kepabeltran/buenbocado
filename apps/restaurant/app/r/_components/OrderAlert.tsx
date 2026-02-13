"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../_auth/AuthProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

// Genera un beep usando Web Audio API (sin necesidad de archivo de sonido)
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playBeep = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Patrón de alerta: 3 beeps ascendentes
    playBeep(now, 600, 0.15);
    playBeep(now + 0.2, 800, 0.15);
    playBeep(now + 0.4, 1000, 0.2);

    // Cerrar contexto después
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Si no soporta Web Audio, no hacer nada
  }
}

export function OrderAlert() {
  const { getToken } = useAuth();
  const [newCount, setNewCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [lastMenuTitle, setLastMenuTitle] = useState("");
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const soundEnabledRef = useRef(true);
  const repeatTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Limpiar timers al cerrar
  function dismiss() {
    setVisible(false);
    for (const t of repeatTimersRef.current) clearTimeout(t);
    repeatTimersRef.current = [];
  }

  const checkNewOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_BASE + "/api/restaurant/me/orders?take=50", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const orders = (json.data || []) as any[];
      const pending = orders.filter((o: any) => o.status === "CREATED" || o.status === "PREPARING");

      if (initialLoadRef.current) {
        for (const o of pending) knownIdsRef.current.add(o.id);
        initialLoadRef.current = false;
        return;
      }

      let newOrders = 0;
      let latestTitle = "";
      for (const o of pending) {
        if (!knownIdsRef.current.has(o.id)) {
          knownIdsRef.current.add(o.id);
          newOrders++;
          latestTitle = o.menu?.title || "Nuevo pedido";
        }
      }

      if (newOrders > 0) {
        setNewCount(newOrders);
        setLastMenuTitle(latestTitle);
        setVisible(true);

        // Sonido inmediato + 2 repeticiones cada 5 segundos
        if (soundEnabledRef.current) {
          playAlertSound();
          const t1 = setTimeout(() => { if (soundEnabledRef.current) playAlertSound(); }, 5000);
          const t2 = setTimeout(() => { if (soundEnabledRef.current) playAlertSound(); }, 10000);
          repeatTimersRef.current.push(t1, t2);
        }
      }
    } catch {
      // Silenciar errores de red
    }
  }, [getToken]);

  // Polling cada 8 segundos
  useEffect(() => {
    checkNewOrders();
    const id = setInterval(checkNewOrders, 8000);
    return () => clearInterval(id);
  }, [checkNewOrders]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-lg text-white">
            🔔
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">
              {newCount === 1 ? "¡Nuevo pedido!" : `¡${newCount} pedidos nuevos!`}
            </p>
            <p className="text-xs text-emerald-700">{lastMenuTitle}</p>
          </div>
          <button
            onClick={dismiss}
            className="ml-2 text-emerald-400 hover:text-emerald-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
