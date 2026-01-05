"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DemoRestaurant = { id: string; name: string; city: string };

const DEMO_RESTAURANTS: DemoRestaurant[] = [
  { id: "marisqueria-sur", name: "Marisquería del Sur", city: "Granada" },
  { id: "ramen-kame", name: "Ramen Kame", city: "Granada" },
  { id: "bar-el-sol", name: "Bar El Sol", city: "Granada" },
  { id: "buen-bocado", name: "Buen Bocado", city: "Granada" },
];

function Icon({ name }: { name: "user" | "store" | "shield" | "spark" | "bolt" }) {
  const common = "h-5 w-5";
  if (name === "user")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  if (name === "store")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9l1-5h16l1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 9v10h16V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  if (name === "shield")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l8 4v6c0 6-4 9-8 10-4-1-8-4-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    );
  if (name === "spark")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M5 14l.7 3L9 18l-3.3 1-.7 3-.7-3L1.7 18 5 17l.7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    );
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
      {children}
    </span>
  );
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
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-zinc-500">ROL</div>
          <div className="mt-1 flex items-center gap-2 text-base font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              {icon}
            </span>
            {title}
          </div>
          <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function PortalPage() {
  const [rid, setRid] = useState<string>(DEMO_RESTAURANTS[0]?.id ?? "marisqueria-sur");
  const [copied, setCopied] = useState(false);

  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000/portal";
    return `${window.location.origin}/portal`;
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  const restaurantLabel = useMemo(() => {
    const r = DEMO_RESTAURANTS.find((x) => x.id === rid);
    return r ? `${r.name} · ${r.city}` : rid;
  }, [rid]);

  return (
    <div className="space-y-10">
      {/* Top bar (premium) */}
      <header className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
            BB
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">BuenBocado</div>
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                demo
              </span>
            </div>
            <div className="text-xs text-zinc-500">última hora + excedentes · acceso por rol</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            Home
          </Link>
          <Link
            href="/ofertas"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ver ofertas
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex flex-wrap gap-2">
              <Pill>
                <Icon name="spark" />
                Demo navegable (sin login)
              </Pill>
              <Pill>
                <Icon name="bolt" />
                Flujo completo cliente → restaurante
              </Pill>
              <Pill>
                <Icon name="shield" />
                Admin (vista global)
              </Pill>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Portal de acceso
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Entrada ordenada por rol para enseñar el producto sin explicar “dónde está cada cosa”.
              Ahora es demo; luego irá con login, roles y base de datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
              <div className="text-xs font-semibold text-zinc-500">Guion demo (2 min)</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                Reserva → Ticket → LISTO → Validar código
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <CardShell
          title="Cliente"
          subtitle="Explora ofertas, reserva/compra y consulta tickets."
          icon={<Icon name="user" />}
        >
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Entrar como cliente
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/ofertas"
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
              >
                Ver ofertas
              </Link>
              <Link
                href="/orders"
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
              >
                Mis pedidos
              </Link>
            </div>
            <p className="text-xs text-zinc-500">
              (demo) Los pedidos se guardan localmente. Luego serán por usuario + BD.
            </p>
          </div>
        </CardShell>

        <CardShell
          title="Restaurante"
          subtitle="Gestiona pedidos: preparar → listo → entregar con código."
          icon={<Icon name="store" />}
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs font-semibold text-zinc-500">Restaurante (demo)</div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={rid}
                  onChange={(e) => setRid(e.target.value)}
                  aria-label="Seleccionar restaurante demo"
                >
                  {DEMO_RESTAURANTS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                Seleccionado: <span className="font-semibold">{restaurantLabel}</span>
              </div>
            </div>

            <Link
              href={`/restaurant?rid=${encodeURIComponent(rid)}`}
              className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              title="Panel del restaurante (fijado por rid en demo)"
            >
              Entrar al panel del restaurante
            </Link>

            <Link
              href="/restaurant"
              className="block w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-50"
              title="Vista global (demo) para pruebas"
            >
              Admin demo (vista global)
            </Link>

            <p className="text-xs text-zinc-500">
              En producción esta selección desaparece: el restaurante entra identificado por login/rol.
            </p>
          </div>
        </CardShell>

        <CardShell
          title="Admin"
          subtitle="Vista global para pruebas y soporte. Luego será /admin con roles."
          icon={<Icon name="shield" />}
        >
          <div className="space-y-3">
            <Link
              href="/restaurant"
              className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Entrar como Admin (demo)
            </Link>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <div className="text-xs font-semibold text-zinc-500">Qué verá el admin</div>
              <ul className="mt-2 list-inside list-disc text-xs text-zinc-600">
                <li>Pedidos de todos los restaurantes</li>
                <li>Estados y validaciones</li>
                <li>Soporte y auditoría</li>
              </ul>
            </div>
            <p className="text-xs text-zinc-500">
              (demo) Ahora comparte pantalla con /restaurant. Luego lo separamos a /admin.
            </p>
          </div>
        </CardShell>
      </section>

      {/* Share + quick entry */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Atajo para enseñar a socios</div>
            <div className="text-sm text-zinc-600">
              Usa esta URL como entrada para la demo (roles + flujo).
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <input
              readOnly
              value={portalUrl}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm md:w-[340px]"
              aria-label="URL del portal"
            />
            <button
              onClick={copyUrl}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {copied ? "Copiado ✅" : "Copiar URL"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}