"use client";

import { useMemo, useState } from "react";
import { Card, Chip } from "@buenbocado/ui";

type OrderStatus = "CREATED" | "PREPARING" | "READY" | "DELIVERED";

type Order = {
  id: string;
  customer: string;
  status: OrderStatus;
  pickupCode: string; // codigo numerico que enseña el cliente
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Creado",
  PREPARING: "Preparando",
  READY: "Listo",
  DELIVERED: "Entregado",
};

// Mock MVP (luego vendrá de API)
const initialOrders: Order[] = [
  { id: "order-1", customer: "Laura M.", status: "PREPARING", pickupCode: "4821" },
  { id: "order-2", customer: "Carlos R.", status: "READY", pickupCode: "1193" },
  { id: "order-3", customer: "Marta G.", status: "DELIVERED", pickupCode: "7750" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const normalizedCode = useMemo(() => code.replace(/\D/g, ""), [code]);

  function markDeliveredByCode() {
    setMessage(null);

    if (normalizedCode.length < 3) {
      setMessage({ type: "error", text: "Introduce un código válido (solo números)." });
      return;
    }

    const idx = orders.findIndex((o) => o.pickupCode === normalizedCode);

    if (idx === -1) {
      setMessage({ type: "error", text: "Código no encontrado. Revisa el número." });
      return;
    }

    const order = orders[idx];

    if (order.status === "DELIVERED") {
      setMessage({ type: "error", text: `Ese pedido ya estaba entregado (${order.id}).` });
      return;
    }

    const next = [...orders];
    next[idx] = { ...order, status: "DELIVERED" };
    setOrders(next);
    setCode("");
    setMessage({ type: "ok", text: `Pedido marcado como ENTREGADO: ${order.id}` });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    markDeliveredByCode();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Pedidos</p>
        <h1 className="text-3xl font-bold text-slate-900">Estados en tiempo real</h1>
        <p className="text-sm text-slate-600">
          Para evitar errores, <span className="font-semibold">la entrega se confirma introduciendo el código</span>{" "}
          que enseña el cliente.
        </p>
      </header>

      <Card className="p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-700">Código de recogida</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="Ej. 4821"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-300"
            />
            <p className="mt-1 text-xs text-slate-500">Solo números. Se valida al confirmar.</p>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 active:opacity-90"
          >
            Marcar como entregado
          </button>
        </form>

        {message && (
          <div
            className={[
              "mt-3 rounded-xl px-3 py-2 text-sm",
              message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}
      </Card>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{order.id}</p>
              <p className="text-xs text-slate-500">{order.customer}</p>
              <p className="mt-1 text-xs text-slate-500">
                Código: <span className="font-semibold text-slate-700">{order.pickupCode}</span>
              </p>
            </div>
            <Chip>{STATUS_LABEL[order.status]}</Chip>
          </Card>
        ))}
      </div>
    </section>
  );
}