export function BalanceCard({ availableMinutes }: { availableMinutes: number }) {
  const hours = Math.floor(availableMinutes / 60);
  const minutes = availableMinutes % 60;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Saldo da semana</p>
          <p className="mt-2 text-4xl font-semibold text-slate-950">
            {hours}h{minutes ? ` ${minutes}min` : ""}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          disponivel
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Use com calma, libere mais cedo quando terminar e evite os horarios de pico.
      </p>
    </section>
  );
}
