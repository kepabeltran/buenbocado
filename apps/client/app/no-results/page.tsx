import { Button, Card } from "@buenbocado/ui";

export default function NoResultsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
          Sin resultados
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Aún no hay menús disponibles
        </h1>
      </header>
      <Card className="space-y-4">
        <p className="text-sm text-slate-600">
          Te avisaremos cuando haya un menú en esta zona. Deja activada la
          opción y volveremos a intentarlo por ti.
        </p>
        <Button type="button">Avisarme en esta zona</Button>
      </Card>
    </section>
  );
}
