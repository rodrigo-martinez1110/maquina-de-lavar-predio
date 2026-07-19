import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { ReservationDayOverview } from "../../components/ReservationDayOverview";
import { createReservationFromForm } from "../../lib/actions/reservation-form";
import { getApartmentSession } from "../../lib/auth/apartment-session";
import { buildDaySlots, buildFreeWindows } from "../../lib/domain/schedule";
import { listReservationsForDay } from "../../lib/repositories/reservations";
import { MyReservations } from "./my-reservations";
import { ReservationForm } from "./reservation-form";

type ReservationsPageProps = {
  searchParams?: Promise<{
    date?: string;
    start?: string;
  }>;
};

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function dateFromSearchParam(date: string | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? String(date) : todayInSaoPaulo();
}

function startFromSearchParam(start: string | undefined) {
  return /^\d{2}:\d{2}$/.test(start ?? "") ? String(start) : "10:00";
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const selectedDate = dateFromSearchParam(params.date);
  const selectedStart = startFromSearchParam(params.start);
  const reservations = await listReservationsForDay(selectedDate);
  const slots = buildDaySlots({ date: selectedDate, reservations });
  const freeWindows = buildFreeWindows(slots);
  const myReservations = reservations.filter(
    (reservation) => reservation.apartmentId === session.apartmentId,
  );
  const busySlotsCount = slots.filter((slot) => slot.status === "busy").length;
  const freeSlotsCount = slots.length - busySlotsCount;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Apartamento {session.apartmentNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold">Agenda</h1>
            <p className="mt-2 text-sm text-slate-600">
              Horarios entre 07:00 e 23:00, em blocos de 30 minutos.
            </p>
          </div>
          <form className="flex gap-2" action="/reservations">
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
              defaultValue={selectedDate}
              name="date"
              type="date"
            />
            <button
              className="min-h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
              type="submit"
            >
              Ver dia
            </button>
          </form>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
            <p className="font-semibold">{freeSlotsCount} livres</p>
            <p className="text-xs text-emerald-700">blocos de 30 min</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
            <p className="font-semibold">{busySlotsCount} ocupados</p>
            <p className="text-xs text-rose-700">ja reservados</p>
          </div>
        </div>
      </header>
      <ReservationDayOverview date={selectedDate} freeWindows={freeWindows} slots={slots} />
      <MyReservations reservations={myReservations} />
      <ReservationForm
        action={createReservationFromForm}
        defaultDate={selectedDate}
        defaultStartTime={selectedStart}
      />
      <AppNav />
    </main>
  );
}
