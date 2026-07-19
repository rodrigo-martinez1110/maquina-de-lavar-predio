import { redirect } from "next/navigation";
import { AppNav } from "../components/AppNav";
import { BalanceCard } from "../components/BalanceCard";
import { getApartmentSession } from "../lib/auth/apartment-session";
import { getApartmentWeeklyAvailableMinutes } from "../lib/repositories/weekly-balances";

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

export default async function HomePage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");
  const availableMinutes = await getApartmentWeeklyAvailableMinutes({
    apartmentId: session.apartmentId,
    date: todayInSaoPaulo(),
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm font-medium text-slate-300">
          Apartamento {session.apartmentNumber}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">Lava e Seca</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-300">
          Reserve, acompanhe seu saldo e combine horarios sem confusao.
        </p>
      </header>
      <BalanceCard availableMinutes={availableMinutes} />
      <section className="grid grid-cols-2 gap-3">
        <a
          className="rounded-xl bg-slate-950 p-4 text-center font-medium text-white shadow-sm"
          href="/reservations?now=1"
        >
          Usar agora
        </a>
        <a
          className="rounded-xl border border-slate-200 bg-white p-4 text-center font-medium text-slate-800 shadow-sm"
          href="/reservations"
        >
          Reservar horario
        </a>
      </section>
      <AppNav />
    </main>
  );
}
