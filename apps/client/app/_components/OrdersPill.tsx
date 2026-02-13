"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function extractCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const v = JSON.parse(raw);
    const list = (v?.orders ?? v?.data ?? v) as unknown;

    if (Array.isArray(list)) return list.length;
    if (list && typeof list === "object") return Object.keys(list as any).length;
  } catch {}
  return 0;
}

function guessOrdersKey(): string | null {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Preferimos nuestras keys tipo bb_* y que contengan "orders"
      if (/bb/i.test(k) && /orders/i.test(k)) keys.push(k);
    }
    if (keys.length === 0) return "bb_client_orders_v1";

    keys.sort((a, b) => {
      const score = (s: string) =>
        (s.includes("bb_client_orders") ? 100 : 0) + (s.includes("_v1") ? 10 : 0);
      return score(b) - score(a);
    });
    return keys[0];
  } catch {
    return "bb_client_orders_v1";
  }
}

export default function OrdersPill() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const key = guessOrdersKey();

    const read = () => {
      if (!key) return setCount(0);
      setCount(extractCount(localStorage.getItem(key)));
    };

    read();

    // OJO: en la MISMA pestaña, el evento "storage" no salta,
    // así que metemos un poll suave para MVP.
    const t = window.setInterval(read, 800);

    const onStorage = (e: StorageEvent) => {
      if (key && e.key === key) read();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Link
      href="/orders"
      className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
      title="Ver tus pedidos"
    >
      <span>Pedidos</span>

      {count > 0 ? (
        <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-white/15 px-1.5 text-[11px] font-black">
          {count}
        </span>
      ) : null}
    </Link>
  );
}