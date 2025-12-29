import Link from "next/link";
import { Button, Card, Chip } from "@buenbocado/ui";
import { fetchMenu } from "@/lib/api";

export default async function MenuDetailPage({
  params
}: {
  params: { id: string };
}) {
  const menu = await fetchMenu(params.id);

  return (
    <section className="space-y-6">
      <Link className="text-sm font-semibold text-brand-700" href="/nearby">
        ← Volver a la lista
      </Link>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{menu.type === "TAKEAWAY" ? "Para llevar" : "En el local"}</Chip>
          {menu.badge ? <Chip>{menu.badge}</Chip> : null}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{menu.title}</h1>
          <p className="text-sm text-slate-600">{menu.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>{menu.restaurant}</span>
          <span>·</span>
          <span>{menu.timeRemaining} restantes</span>
        </div>
        <Button type="button">
          Pagar {(menu.priceCents / 100).toFixed(2)} {menu.currency}
        </Button>
      </Card>
      <Card>
        <p className="text-sm text-slate-600">
          Este es un flujo MVP sin pagos reales. El botón solo muestra el estado
          de diseño.
        </p>
      </Card>
    </section>
  );
}
