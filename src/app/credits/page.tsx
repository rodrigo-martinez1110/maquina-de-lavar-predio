import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { getApartmentSession } from "../../lib/auth/apartment-session";
import { listOpenTransfersForWeek } from "../../lib/repositories/transfers";
import { CreditForms } from "./credit-forms";

export default async function CreditsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");
  const weekStart = weekStartForToday();
  const transfers = await listOpenTransfersForWeek(weekStart);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">
          Apartamento {session.apartmentNumber}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Horas</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ceda horas que nao pretende usar ou peca ajuda quando precisar.
        </p>
      </header>
      <CreditForms
        currentApartmentId={session.apartmentId}
        transfers={transfers}
        weekStart={weekStart}
      />
      <AppNav />
    </main>
  );
}

function weekStartForToday() {
  const now = new Date();
  const saoPauloDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const noonUtc = new Date(`${saoPauloDate}T12:00:00Z`);
  const day = noonUtc.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  noonUtc.setUTCDate(noonUtc.getUTCDate() - diffToMonday);
  return noonUtc.toISOString().slice(0, 10);
}
