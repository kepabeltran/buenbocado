"use client";

import { useEffect } from "react";

export default function RestaurantEntry() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_RESTAURANT_URL ?? "http://localhost:3001").replace(/\/$/, "");
    window.location.href = `${base}/r`;
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui" }}>
      <div style={{ fontSize: 14, opacity: 0.75 }}>Redirigiendo al portal de restaurante…</div>
    </main>
  );
}
