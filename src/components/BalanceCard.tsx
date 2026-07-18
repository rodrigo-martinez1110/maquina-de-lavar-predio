export function BalanceCard({ availableMinutes }: { availableMinutes: number }) {
  const hours = Math.floor(availableMinutes / 60);
  const minutes = availableMinutes % 60;

  return (
    <section className="rounded border bg-white p-4">
      <p className="text-sm text-slate-500">Saldo da semana</p>
      <p className="text-3xl font-semibold">
        {hours}h{minutes ? ` ${minutes}min` : ""}
      </p>
    </section>
  );
}
