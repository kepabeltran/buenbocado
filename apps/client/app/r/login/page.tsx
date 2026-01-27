"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RestaurantLogin() {
  const router = useRouter();

  function enterDev() {
    // DEV: cookie temporal (luego será sesión real + roles)
    document.cookie = "bb_rest=1; Path=/; Max-Age=2592000; SameSite=Lax";
    router.push("/r/buen-bocado");
  }

  function logoutDev() {
    // DEV: borrar cookie
    document.cookie = "bb_rest=; Path=/; Max-Age=0; SameSite=Lax";
    router.push("/r/login");
  }

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-white text-xs font-bold">
              BB
            </span>
            Acceso restaurante
          </div>

          <Link
            href="/offers"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Volver a ofertas
          </Link>
        </header>

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-black tracking-tight">Intranet restaurante</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Aquí entran los restaurantes con sus credenciales. (Ahora mismo: acceso temporal en dev
            mientras montamos login real.)
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={enterDev}
              className="w-full rounded-2xl bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Entrar (modo dev)
            </button>

            <button
              type="button"
              onClick={logoutDev}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Cerrar sesión (dev)
            </button>

            <div className="text-xs text-zinc-600">
              Próximo paso: login real + autorización por restaurante + contabilidad/liquidaciones.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}