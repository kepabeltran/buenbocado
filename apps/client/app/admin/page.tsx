"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Landing del admin: el layout ya valida token/rol. Aquí solo redirigimos.
    router.replace("/admin/orders");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <p className="text-sm text-zinc-500">Redirigiendo…</p>
    </div>
  );
}
