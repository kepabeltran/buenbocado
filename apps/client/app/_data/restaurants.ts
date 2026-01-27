export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  priceLevel?: "$" | "$$" | "$$$";
  hours?: string;
};

export const restaurants: Restaurant[] = [
  {
    id: "buen-bocado",
    name: "Buen Bocado",
    tagline: "Cocina honesta. Flash deals cuando hay huecos.",
    neighborhood: "Centro",
    city: "Málaga",
    address: "C/ Ejemplo 12",
    priceLevel: "$$",
    hours: "L–D 13:00–16:00 / 20:00–23:30",
  },
  {
    id: "bar-el-sol",
    name: "Bar El Sol",
    tagline: "Tapas rápidas para los que van con prisa.",
    neighborhood: "Soho",
    city: "Málaga",
    address: "Av. Ejemplo 8",
    priceLevel: "$",
    hours: "L–S 12:30–16:30 / 19:30–23:00",
  },
  {
    id: "ramen-kame",
    name: "Ramen Kame",
    tagline: "Ramen y packs sorpresa (cuando sobra lo bueno).",
    neighborhood: "Teatinos",
    city: "Málaga",
    address: "Pz. Ejemplo 5",
    priceLevel: "$$",
    hours: "M–D 13:00–16:00 / 19:30–23:00",
  },
  {
    id: "marisqueria-sur",
    name: "Marisquería del Sur",
    tagline: "Producto fresco. Excedentes planificados por franja.",
    neighborhood: "La Malagueta",
    city: "Málaga",
    address: "Paseo Ejemplo 3",
    priceLevel: "$$$",
    hours: "J–D 13:00–16:30 / 20:00–23:30",
  },
];

export function getRestaurantById(id: string) {
  return restaurants.find((r) => r.id === id);
}

export function formatEuros(cents: number) {
  const eur = cents / 100;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(eur);
}
