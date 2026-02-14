"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_auth/AuthProvider";

export default function AdminIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/admin/login");
    } else {
      router.push("/admin/orders");
    }
  }, [loading, user, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <p className="text-sm text-zinc-500">Redirigiendo…</p>
    </div>
  );
}
