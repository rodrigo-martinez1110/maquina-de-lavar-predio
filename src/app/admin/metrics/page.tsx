import {
  rankApartmentUsage,
  summarizeUsageTotals,
} from "../../../lib/domain/metrics";
import { getAdminUsageMetrics } from "../../../lib/repositories/metrics";

export const dynamic = "force-dynamic";

export default async function AdminMetricsPage() {
  const { rows, peakSlots } = await getAdminUsageMetrics();
  const totals = summarizeUsageTotals(rows);
  const apartmentUsage = rankApartmentUsage(rows);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Metricas</h1>
        <p className="text-sm text-slate-600">
          Acompanhe uso total, atrasos e apartamentos com maior demanda.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Uso total registrado</p>
          <p className="text-2xl font-semibold">{formatMinutes(totals.totalMinutes)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Reservas</p>
          <p className="text-2xl font-semibold">{totals.reservationCount}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Atrasos</p>
          <p className="text-2xl font-semibold">{totals.lateCount}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-medium">Uso por apartamento</h2>
          {apartmentUsage.length === 0 ? (
            <p className="rounded border border-dashed p-4 text-sm text-slate-600">
              Ainda nao ha reservas registradas.
            </p>
          ) : (
            apartmentUsage.map((row) => (
              <div className="rounded border p-3" key={row.apartmentNumber}>
                Apt {row.apartmentNumber}: {formatMinutes(row.usedMinutes)}
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-medium">Horarios mais usados</h2>
          {peakSlots.slice(0, 8).map((slot) => (
            <div className="rounded border p-3" key={`${slot.dayOfWeek}-${slot.hour}`}>
              {dayNames[slot.dayOfWeek]} as {String(slot.hour).padStart(2, "0")}:00 -{" "}
              {formatMinutes(slot.usedMinutes)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours}h`;
  if (hours === 0) return `${rest}min`;
  return `${hours}h ${rest}min`;
}
