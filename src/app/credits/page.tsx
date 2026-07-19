import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { getApartmentSession } from "../../lib/auth/apartment-session";

export default async function CreditsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

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
        <button className="min-h-12 rounded-xl bg-slate-950 p-3 font-medium text-white shadow-sm" type="button">
          Ceder horas
        </button>
        <button className="min-h-12 rounded-xl border border-slate-200 bg-white p-3 font-medium text-slate-800 shadow-sm" type="button">
          Pedir horas
        </button>
      </section>
      <AppNav />
    </main>
  );
}
