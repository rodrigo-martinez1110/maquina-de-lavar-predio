import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { ReservationTimeline } from "../../components/ReservationTimeline";
import { getApartmentSession } from "../../lib/auth/apartment-session";

const availableSlots = ["07:00", "07:30", "08:00", "08:30", "09:00"];

export default async function ReservationsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">Apartamento {session.apartmentNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold">Agenda</h1>
        <p className="mt-2 text-sm text-slate-600">
          Horarios disponiveis entre 07:00 e 23:00.
        </p>
      </header>
      <ReservationTimeline slots={availableSlots} />
      <AppNav />
    </main>
  );
}
