export type OfertaTipo = "PACK" | "MESA_FLASH";
export type OfertaCadencia = "DROP" | "PROGRAMADA";

export type PickupWindow = {
  id: string;          // "lunch" | "dinner" ...
  label: string;       // "Comida" | "Cena"
  start: string;       // "13:00"
  end: string;         // "15:30"
  capacity: number;    // cupo por franja (MVP: por día en localStorage)
};

export type Oferta = {
  id: string;
  tipo: OfertaTipo;

  cadencia: OfertaCadencia;

  titulo: string;
  descripcion: string;

  restaurantId: string;
  restaurantName: string;
  pickupAddress: string;

  originalPriceCents: number;
  priceCents: number;

  qtyAvailable: number; // Para DROP o simple. En PROGRAMADA lo “real” va por franjas.

  // DROP (como antes)
  pickupFromMins?: number;
  pickupToMins?: number;
  expiresInMins?: number;

  // PROGRAMADA (2–3 días)
  availableFromISO?: string;
  availableToISO: string; // obligatorio si PROGRAMADA
  pickupWindows?: PickupWindow[]; // 1–2 ventanas recomendadas

  tags: string[];
};

export const ofertas: Oferta[] = [
  {
    id: "pack-ramen-1",
    tipo: "PACK",
    cadencia: "DROP",
    titulo: "Pack Sorpresa (1–2 personas)",
    descripcion:
      "Excedente de cocina. Valor estimado alto. Puede incluir ramen, gyozas o entrantes. Ideal para cenar hoy.",
    restaurantId: "ramen-kame",
    restaurantName: "Ramen Kame",
    pickupAddress: "Recogida en local",
    originalPriceCents: 1800,
    priceCents: 690,
    qtyAvailable: 6,
    pickupFromMins: 25,
    pickupToMins: 75,
    expiresInMins: 40,
    tags: ["-60%", "Para llevar", "Hoy"],
  },
  {
    id: "pack-tapas-1",
    tipo: "PACK",
    cadencia: "DROP",
    titulo: "Pack Tapas Última Hora",
    descripcion:
      "Raciones variadas (sorpresa). Suele incluir 2–3 tapas + pan. Perfecto si vienes de camino.",
    restaurantId: "bar-sol",
    restaurantName: "Bar El Sol",
    pickupAddress: "Recogida en local",
    originalPriceCents: 1600,
    priceCents: 750,
    qtyAvailable: 4,
    pickupFromMins: 15,
    pickupToMins: 60,
    expiresInMins: 30,
    tags: ["-50%", "Rápido", "Tapas"],
  },
  {
    id: "pack-dulce-1",
    tipo: "PACK",
    cadencia: "DROP",
    titulo: "Pack Dulce (postres + bollería)",
    descripcion:
      "Perfecto para desayunos/meriendas. Contenido variable (sorpresa) según excedente del día.",
    restaurantId: "dulce-nube",
    restaurantName: "Dulce Nube",
    pickupAddress: "Recogida en local",
    originalPriceCents: 1500,
    priceCents: 590,
    qtyAvailable: 8,
    pickupFromMins: 10,
    pickupToMins: 55,
    expiresInMins: 55,
    tags: ["-60%", "Dulce", "Top"],
  },
  {
    id: "mesa-flash-21-00",
    tipo: "MESA_FLASH",
    cadencia: "DROP",
    titulo: "Mesa Flash 21:00 (2 pax)",
    descripcion:
      "Reserva caída. Descuento sobre carta o menú especial (según disponibilidad). Confirmación rápida.",
    restaurantId: "buen-bocado",
    restaurantName: "Buen Bocado",
    pickupAddress: "En sala (restaurante)",
    originalPriceCents: 0,
    priceCents: 0,
    qtyAvailable: 1,
    pickupFromMins: 45,
    pickupToMins: 90,
    expiresInMins: 25,
    tags: ["Last minute", "Sala", "Descuento"],
  },

  // ✅ PROGRAMADA: ejemplo “Gambas 3 días” con 2 franjas y cupos
  {
    id: "gambas-3dias",
    tipo: "PACK",
    cadencia: "PROGRAMADA",
    titulo: "Menú especial de gambas (3 días)",
    descripcion:
      "Excedente planificado. Menú especial con gambas para evitar desperdicio. Disponible unos días y se cierra.",
    restaurantId: "marisqueria-sur",
    restaurantName: "Marisquería del Sur",
    pickupAddress: "Recogida en local",
    originalPriceCents: 2200,
    priceCents: 1290,
    qtyAvailable: 999, // en programadas el control real será por franja
    availableToISO: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    pickupWindows: [
      { id: "lunch", label: "Comida", start: "13:00", end: "15:30", capacity: 6 },
      { id: "dinner", label: "Cena", start: "20:00", end: "22:00", capacity: 8 },
    ],
    tags: ["Programada", "Marisco", "-41%"],
  },
];

export function getOfertaById(id: string) {
  return ofertas.find((o) => o.id === id) ?? null;
}

export function formatEuros(cents: number) {
  const eur = cents / 100;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(eur);
}

export function discountPct(oferta: Oferta) {
  if (!oferta.originalPriceCents || oferta.originalPriceCents <= oferta.priceCents) return 0;
  return Math.round((1 - oferta.priceCents / oferta.originalPriceCents) * 100);
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function getTimes(oferta: Oferta, nowMs: number) {
  if (oferta.cadencia === "PROGRAMADA") {
    const expiresAt = new Date(oferta.availableToISO);
    const pickupFrom = new Date(nowMs);
    const pickupTo = new Date(nowMs);
    return { expiresAt, pickupFrom, pickupTo };
  }

  const expiresAt = new Date(nowMs + (oferta.expiresInMins ?? 0) * 60_000);
  const pickupFrom = new Date(nowMs + (oferta.pickupFromMins ?? 0) * 60_000);
  const pickupTo = new Date(nowMs + (oferta.pickupToMins ?? 0) * 60_000);
  return { expiresAt, pickupFrom, pickupTo };
}

export function fmtDateLong(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "2-digit" });
}

export function ofertaLabelCaduca(oferta: Oferta, nowMs: number) {
  if (oferta.cadencia === "PROGRAMADA") {
    const until = new Date(oferta.availableToISO);
    return `Hasta ${fmtDateLong(until)}`;
  }
  const { expiresAt } = getTimes(oferta, nowMs);
  const remaining = expiresAt.getTime() - nowMs;
  return remaining <= 0 ? "Caducada" : fmtCountdown(remaining);
}

export function ofertaLabelRecogida(oferta: Oferta, nowMs: number) {
  if (oferta.cadencia === "PROGRAMADA") {
    const wins = oferta.pickupWindows ?? [];
    if (wins.length === 1) return `Recogida ${wins[0].start}–${wins[0].end}`;
    if (wins.length > 1) return `Franjas ${wins.map((w) => w.label).join("/")}`;
    return "Franja por definir";
  }
  const { pickupFrom, pickupTo } = getTimes(oferta, nowMs);
  return `Recogida ${fmtTime(pickupFrom)}–${fmtTime(pickupTo)}`;
}