export type Offer = {
  id: string;
  restaurantId: string;
  restaurantName: string;
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
  tags?: string[];
};

export const offers: Offer[] = [
  {
    id: "mesa-flash-21",
    restaurantId: "buen-bocado",
    restaurantName: "Buen Bocado",
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
    tags: ["Confirmación rápida", "Stock limitado"],
  },
  {
    id: "pack-tapas-uh",
    restaurantId: "bar-el-sol",
    restaurantName: "Bar El Sol",
    title: "Pack Tapas Última Hora",
    description:
      "Raciones variadas (sorpresa). Contenido variable según excedente del día.",
    discountPct: 53,
    pickupLabel: "Recogida 18:30–19:20",
    stock: 4,
    price: 6.9,
    originalPrice: 14.7,
    kind: "drop",
    expiresInMin: 30,
    tags: ["Sorpresa", "Rápido"],
  },
  {
    id: "pack-sorpresa",
    restaurantId: "ramen-kame",
    restaurantName: "Ramen Kame",
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
    tags: ["Antidesperdicio", "Sorpresa"],
  },
  {
    id: "menu-gambas-3d",
    restaurantId: "marisqueria-sur",
    restaurantName: "Marisquería del Sur",
    title: "Menú especial de gambas (3 días)",
    description:
      "Excedente planificado: producto que no se puede perder. Reservas por franja.",
    discountPct: 40,
    pickupLabel: "Franja comida / cena",
    stock: 8,
    price: 12.9,
    originalPrice: 21.5,
    kind: "planned",
    durationDays: 3,
    tags: ["Reserva por franja", "Varios días"],
  },
];

export function euros(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}