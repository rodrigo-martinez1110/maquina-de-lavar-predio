import { redirect } from "next/navigation";
import { AppNav } from "../components/AppNav";
import { BalanceCard } from "../components/BalanceCard";
import { getApartmentSession } from "../lib/auth/apartment-session";

export default async function HomePage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Lava e Seca</h1>
      <p className="text-sm font-medium text-slate-900">
        Apartamento {session.apartmentNumber}
      </p>
      <BalanceCard availableMinutes={360} />
      <section className="grid grid-cols-2 gap-3">
        <a
          className="rounded bg-slate-900 p-4 text-center text-white"
          href="/reservations?now=1"
        >
          Usar agora
        </a>
        <a className="rounded border p-4 text-center" href="/reservations">
          Reservar horario
        </a>
      </section>
      <AppNav />
    </main>
  );
}
