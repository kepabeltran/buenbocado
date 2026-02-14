"use client";
import { useEffect } from "react";
export default function RestaurantLoginRedirect() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_RESTAURANT_URL ?? "http://localhost:3001").replace(/\/$/, "");
    window.location.href = `${base}/r`;
  }, []);
  return (
    <main className="min-h-screen bg-[#faf5f0] grid place-items-center">
      <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-sm text-center">
        <div className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-zinc-900 text-white font-black text-sm">
          BB
        </div>
        <p className="mt-4 text-sm font-semibold text-zinc-700">Portal de restaurante</p>
        <p className="mt-1 text-xs text-zinc-400">Redirigiendo…</p>
      </div>
    </main>
  );
}
