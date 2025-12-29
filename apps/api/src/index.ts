import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true
});

const menus = [
  {
    id: "menu-1",
    restaurant: "La Esquina",
    type: "TAKEAWAY",
    title: "Menú mediterráneo",
    description: "Ensalada fresca, pasta al pesto y pan artesanal.",
    priceCents: 850,
    currency: "EUR",
    timeRemaining: "45 min",
    distanceKm: 1.2,
    badge: "Precio ajustado"
  },
  {
    id: "menu-2",
    restaurant: "Casa Nori",
    type: "DINEIN",
    title: "Bento japonés",
    description: "Pollo teriyaki, arroz y encurtidos.",
    priceCents: 990,
    currency: "EUR",
    timeRemaining: "30 min",
    distanceKm: 0.6,
    badge: "Último pase"
  },
  {
    id: "menu-3",
    restaurant: "Barrio Verde",
    type: "TAKEAWAY",
    title: "Veggie combo",
    description: "Bowl de quinoa, hummus y fruta.",
    priceCents: 720,
    currency: "EUR",
    timeRemaining: "50 min",
    distanceKm: 2.1,
    badge: null
  }
];

app.get("/health", async () => ({ status: "ok" }));

app.get("/menus", async () => ({
  data: menus
}));

app.get<{ Params: { id: string } }>("/menus/:id", async (request, reply) => {
  const menu = menus.find((item) => item.id === request.params.id);
  if (!menu) {
    return reply.code(404).send({ error: "Menu not found" });
  }
  return { data: menu };
});

app.post("/orders", async () => ({
  orderId: "order-123",
  code: "BB-4F2K"
}));

app.get<{ Params: { id: string } }>("/orders/:id", async (request) => ({
  id: request.params.id,
  status: "CREATED",
  code: "BB-4F2K",
  pickup: "Hoy 19:30",
  instructions: "Muestra este código en caja para retirar tu pedido."
}));

app.post("/restaurant/menus", async () => ({
  ok: true,
  id: "menu-new"
}));

const port = Number(process.env.PORT ?? 4000);

app.listen({ port, host: "0.0.0.0" });
