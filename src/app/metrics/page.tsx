import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { getApartmentSession } from "../../lib/auth/apartment-session";
import { getAdminUsageMetrics } from "../../lib/repositories/metrics";

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default async function ResidentMetricsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  const { peakSlots } = await getAdminUsageMetrics();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Horarios de pico</h1>
        <p className="text-sm text-slate-600">
          Use estes dados para escolher horarios mais tranquilos quando puder.
        </p>
      </header>

      <section className="grid gap-2">
        {peakSlots.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-sm text-slate-600">
            Ainda nao ha dados suficientes.
          </p>
        ) : (
          peakSlots.slice(0, 8).map((slot, index) => (
            <div className="rounded border p-3" key={`${slot.dayOfWeek}-${slot.hour}`}>
              <span className="font-medium">{index + 1}. </span>
              {dayNames[slot.dayOfWeek]} as {String(slot.hour).padStart(2, "0")}:00
            </div>
          ))
        )}
      </section>

      <AppNav />
    </main>
  );
}
