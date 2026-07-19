import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { createHourOffer, createHourRequest } from "../../lib/actions/transfers";
import { getApartmentSession } from "../../lib/auth/apartment-session";

export default async function CreditsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");
  const weekStart = weekStartForToday();

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
      <section className="grid grid-cols-2 gap-3">
        <form action={createHourOffer} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input name="weekStart" type="hidden" value={weekStart} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Ceder
            <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3" name="minutes" defaultValue="60">
              <option value="30">30 min</option>
              <option value="60">1h</option>
              <option value="90">1h30</option>
              <option value="120">2h</option>
            </select>
          </label>
          <button className="mt-3 min-h-11 w-full rounded-xl bg-slate-950 p-3 font-medium text-white shadow-sm" type="submit">
            Ceder horas
          </button>
        </form>
        <form action={createHourRequest} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input name="weekStart" type="hidden" value={weekStart} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Pedir
            <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3" name="minutes" defaultValue="60">
              <option value="30">30 min</option>
              <option value="60">1h</option>
              <option value="90">1h30</option>
              <option value="120">2h</option>
            </select>
          </label>
          <button className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white p-3 font-medium text-slate-800 shadow-sm" type="submit">
            Pedir horas
          </button>
        </form>
      </section>
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
