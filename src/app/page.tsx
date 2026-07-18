import { redirect } from "next/navigation";
import { getApartmentSession } from "../lib/auth/apartment-session";

export default async function HomePage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Lava e Seca</h1>
      <p className="text-sm text-slate-600">Agenda compartilhada dos apartamentos 1 a 14.</p>
      <p className="text-sm font-medium text-slate-900">Apartamento {session.apartmentNumber}</p>
    </main>
  );
}
