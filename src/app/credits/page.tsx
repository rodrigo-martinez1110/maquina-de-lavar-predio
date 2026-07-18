import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { getApartmentSession } from "../../lib/auth/apartment-session";

export default async function CreditsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Horas</h1>
      <p className="text-sm font-medium text-slate-900">
        Apartamento {session.apartmentNumber}
      </p>
      <section className="grid grid-cols-2 gap-3">
        <button className="min-h-12 rounded bg-slate-900 p-3 text-white" type="button">
          Ceder horas
        </button>
        <button className="min-h-12 rounded border p-3" type="button">
          Pedir horas
        </button>
      </section>
      <AppNav />
    </main>
  );
}
