import { Card } from "@buenbocado/ui";
import { fetchTicket } from "@/lib/api";

export default async function TicketPage({
  params
}: {
  params: { orderId: string };
}) {
  const ticket = await fetchTicket(params.orderId);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Ticket
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Pedido confirmado
        </h1>
      </header>
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card className="space-y-3">
          <p className="text-sm text-slate-600">Código corto</p>
          <p className="text-2xl font-bold text-brand-700">{ticket.code}</p>
          <p className="text-sm text-slate-600">Recogida</p>
          <p className="text-lg font-semibold text-slate-900">
            {ticket.pickup}
          </p>
          <p className="text-sm text-slate-600">{ticket.instructions}</p>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-brand-200 bg-brand-50 text-xs text-brand-700">
            QR mock
          </div>
          <p className="text-xs text-slate-500">Escanéalo en el local</p>
        </Card>
      </div>
    </section>
  );
}
