"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { restaurants } from "../_data/restaurants";

function Icon({
  name,
  className = "",
}: {
  name:
    | "user"
    | "store"
    | "shield"
    | "sparkles"
    | "map"
    | "clock"
    | "ticket"
    | "arrow"
    | "bolt";
  className?: string;
}) {
  const common = `h-5 w-5 ${className}`;
  switch (name) {
    case "user":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 21a8 8 0 10-16 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 11a4 4 0 100-8 4 4 0 000 8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "store":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 9l2-5h14l2 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M4 9v11h16V9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 20v-6h6v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "shield":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2l8 4v6c0 6-4 10-8 10S4 18 4 12V6l8-4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "sparkles":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M19 12l.8 2.4L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.6L19 12z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M5 13l.8 2.4L8 16l-2.2.6L5 19l-.8-2.4L2 16l2.2-.6L5 13z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "map":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 3v15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 6v15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "clock":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 22a10 10 0 110-20 10 10 0 010 20z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 6v6l4 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "ticket":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 9a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 010 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 010-4V9z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 7v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>
      );

    case "arrow":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "bolt":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

function CardShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function PortalPage() {
  const [rid, setRid] = useState(restaurants[0]?.id ?? "buen-bocado");

  const restaurantLabel = useMemo(() => {
    const r = restaurants.find((x) => x.id === rid);
    return r?.name ?? rid;
  }, [rid]);

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
            <Icon name="bolt" className="text-zinc-900" />
            Portal de acceso — Demo BuenBocado
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Elige tu ruta: cliente o restaurante
          </h1>

          <p className="max-w-2xl text-base text-zinc-700">
            Este portal existe para que un socio entienda el flujo en 30 segundos.
            Todo está en modo demo (datos locales), pero el recorrido es real.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardShell
            title="Entrar como cliente"
            subtitle="Ver ofertas → reservar → ticket de recogida"
            icon={<Icon name="user" />}
          >
            <div className="grid gap-3">
              <Link
                href="/offers"
                className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <span>Ir a Ofertas</span>
                <Icon name="arrow" className="text-white" />
              </Link>

              <Link
                href="/orders"
                className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                <span>Mis pedidos</span>
                <Icon name="arrow" className="text-zinc-900" />
              </Link>

              <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
                <div className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Icon name="ticket" className="text-zinc-900" />
                  Ticket demo
                </div>
                <div className="mt-1 text-zinc-600">
                  Tras reservar verás un código de recogida de 6 dígitos.
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell
            title="Entrar como restaurante"
            subtitle="Pedidos entrantes → LISTO → validar código → ENTREGADO"
            icon={<Icon name="store" />}
          >
            <div className="grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900">
                      <Icon name="map" className="text-zinc-900" />
                      Restaurante seleccionado
                    </div>
                    <div className="mt-1 text-zinc-600">
                      Actualmente:{" "}
                      <span className="font-semibold">{restaurantLabel}</span>
                    </div>
                  </div>

                  <select
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
                    value={rid}
                    onChange={(e) => setRid(e.target.value)}
                    aria-label="Seleccionar restaurante (solo demo)"
                    title="En demo puedes cambiar; en producción entrará ya identificado"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ CAMBIO IMPORTANTE: antes era /restaurant?rid=... */}
              <Link
                href={`/r/${encodeURIComponent(rid)}`}
                className="block w-full rounded-2xl bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
                title="Panel del restaurante (ruta /r/[rid])"
              >
                Entrar al panel del restaurante
              </Link>

              <Link
                href="/restaurant"
                className="block w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                title="Ruta demo alternativa (puede incluir selector)"
              >
                Ir a panel (demo)
              </Link>

              <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
                <div className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Icon name="shield" className="text-zinc-900" />
                  Regla de seguridad (demo)
                </div>
                <div className="mt-1 text-zinc-600">
                  No se marca ENTREGADO sin introducir un código válido.
                </div>
              </div>
            </div>
          </CardShell>
        </div>

        <footer className="mt-10 text-sm text-zinc-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 backdrop-blur">
              <Icon name="clock" className="text-zinc-700" />
              Demo local (sin base de datos)
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 backdrop-blur">
              <Icon name="sparkles" className="text-zinc-700" />
              Objetivo: que parezca producto
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
