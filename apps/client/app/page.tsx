import Link from "next/link";

type Offer = {
  id: string;
  restaurant: string;
  title: string;
  description: string;
  discountPct: number;
  pickupLabel: string;
  stock: number;
  price: number;
  originalPrice: number;
  kind: "drop" | "planned";
  expiresInMin?: number;
  durationDays?: number;
};

const offers: Offer[] = [
  {
    id: "mesa-flash-21",
    restaurant: "Buen Bocado",
    title: "Mesa Flash 21:00 (2 pax)",
    description:
      "Reserva caída. Descuento sobre carta o menú especial (según disponibilidad). Confirmación rápida.",
    discountPct: 30,
    pickupLabel: "Recogida 19:00–19:45",
    stock: 1,
    price: 14.0,
    originalPrice: 20.0,
    kind: "drop",
    expiresInMin: 25,
  },
  {
    id: "pack-tapas-uh",
    restaurant: "Bar El Sol",
    title: "Pack Tapas Última Hora",
    description:
      "Raciones variadas (sorpresa). Ideal si vienes de camino. Contenido variable según excedente del día.",
    discountPct: 53,
    pickupLabel: "Recogida 18:30–19:20",
    stock: 4,
    price: 6.9,
    originalPrice: 14.7,
    kind: "drop",
    expiresInMin: 30,
  },
  {
    id: "pack-sorpresa",
    restaurant: "Ramen Kame",
    title: "Pack Sorpresa (1–2 personas)",
    description:
      "Excedente de cocina. Valor estimado alto. Puede incluir ramen, gyozas o entrantes. Ideal para hoy.",
    discountPct: 62,
    pickupLabel: "Recogida 18:45–19:35",
    stock: 6,
    price: 8.9,
    originalPrice: 23.4,
    kind: "drop",
    expiresInMin: 40,
  },
  {
    id: "menu-gambas-3d",
    restaurant: "Marisquería del Sur",
    title: "Menú especial de gambas (3 días)",
    description:
      "Excedente planificado: producto que no se puede perder. Reservas por franja.",
    discountPct: 40,
    pickupLabel: "Franja Comida/Cena",
    stock: 8,
    price: 12.9,
    originalPrice: 21.5,
    kind: "planned",
    durationDays: 3,
  },
];

function euros(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Top bar (estilo app) */}
      <div className="sticky top-4 z-10">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                BB
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">BuenBocado</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    demo
                  </span>
                </div>
                <div className="text-xs text-zinc-500">última hora + excedentes</div>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <Link
                href="/portal"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Portal
              </Link>
              <Link
                href="/orders"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Mis pedidos
              </Link>
              <Link
                href="/offers"
                className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Ver ofertas
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero (minimal + llamativo) */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
              Drops que caducan · stock limitado · recogida rápida
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              Ahorra comiendo bien con ofertas de última hora
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
              Restaurantes publican excedentes y huecos de reservas caídas. Tú reservas, recibes tu ticket y recoges en tu franja.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/offers"
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Ver ofertas cerca
              </Link>
              <Link
                href="/portal"
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Abrir demo (portal)
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">Rápido</div>
                <div className="mt-1 text-xs text-zinc-600">Reservas en segundos.</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">Ticket</div>
                <div className="mt-1 text-xs text-zinc-600">Código de recogida.</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">Antidesperdicio</div>
                <div className="mt-1 text-xs text-zinc-600">Excedentes con descuento.</div>
              </div>
            </div>
          </div>

          {/* “parece descargable”: panel lateral estilo store */}
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
            <div className="text-sm font-semibold text-zinc-900">Listo para demo</div>
            <p className="mt-1 text-sm text-zinc-600">
              En producción: login, pagos, fotos reales y panel restaurante por rol.
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs text-zinc-500">iOS</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">Descarga (próximo)</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs text-zinc-500">Android</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">Descarga (próximo)</div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/offers"
                className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver ofertas ahora
              </Link>
              <div className="mt-2 text-xs text-zinc-500">
                (demo web) La app nativa vendrá después.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ofertas destacadas (cards PRO con hueco para foto) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Ofertas destacadas</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Así se verá el feed real (con fotos reales en producción).
            </p>
          </div>

          <Link
            href="/offers"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ver todas
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {offers.map((o) => (
            <Link
              key={o.id}
              href={`/offers/${o.id}`}
              className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
            >
              {/* Hueco de foto */}
              <div className="relative aspect-[16/10] w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-100 to-indigo-100 opacity-70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white">
                    -{o.discountPct}%
                  </span>
                  <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                    {o.kind === "planned" ? "Excedente" : "Última hora"}
                  </span>
                </div>

                <div className="absolute right-4 top-4">
                  <span className="rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                    {o.kind === "planned"
                      ? `Disponible ${o.durationDays ?? 1} días`
                      : `Caduca en ${o.expiresInMin ?? 0} min`}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-800 backdrop-blur">
                      <span className="truncate">{o.restaurant}</span>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-zinc-900 drop-shadow-sm">
                      {o.title}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/40 bg-white/75 px-3 py-2 text-right backdrop-blur">
                    <div className="text-sm font-semibold text-zinc-900">{euros(o.price)}</div>
                    <div className="text-xs text-zinc-500 line-through">{euros(o.originalPrice)}</div>
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="p-5">
                <p className="text-sm text-zinc-600">{o.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{o.pickupLabel}</Badge>
                  <Badge>Stock: {o.stock}</Badge>
                  <Badge>Confirmación rápida</Badge>
                </div>

                <div className="mt-4 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                  Ver oferta →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA restaurante */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">¿Eres restaurante?</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Publica excedentes o huecos de reservas caídas en segundos. Vende lo que se iba a perder.
        </p>
        <div className="mt-5">
          <Link
            href="/portal"
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Entrar al portal (restaurante)
          </Link>
        </div>
      </section>
    </div>
  );
}