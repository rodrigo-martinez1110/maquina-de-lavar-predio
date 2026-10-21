export function RulesHighlight() {
  return (
    <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-800">Antes de reservar</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Regras importantes</h2>
          <p className="mt-2 text-sm text-slate-700">
            Cada apartamento tem <strong>10h por semana</strong> e pode reservar no máximo <strong>8h no mesmo dia</strong>.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-bold text-white shadow-sm hover:bg-amber-600"
          href="/rules"
        >
          Ver todas as regras
        </a>
      </div>
    </section>
  );
}
