import { Card, Chip } from "@buenbocado/ui";

const orders = [
  { id: "order-1", customer: "Laura M.", status: "Preparando" },
  { id: "order-2", customer: "Carlos R.", status: "Listo" },
  { id: "order-3", customer: "Marta G.", status: "Entregado" }
];

export default function OrdersPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Pedidos
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Estados en tiempo real
        </h1>
      </header>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{order.id}</p>
              <p className="text-xs text-slate-500">{order.customer}</p>
            </div>
            <Chip>{order.status}</Chip>
          </Card>
        ))}
      </div>
    </section>
  );
}
