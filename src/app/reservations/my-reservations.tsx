"use client";

import { useActionState } from "react";
import {
  cancelReservationFromForm,
  type ReservationCancellationState,
} from "../../lib/actions/reservation-cancellation";
import type { ScheduleReservation } from "../../lib/domain/schedule";

const initialState: ReservationCancellationState = {};

function timeInSaoPaulo(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function StateMessage({ state }: { state: ReservationCancellationState }) {
  if (state.error) {
    return (
      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        {state.success}
      </p>
    );
  }

  return null;
}

function MyReservationCard({ reservation }: { reservation: ScheduleReservation }) {
  const [state, formAction, isPending] = useActionState(cancelReservationFromForm, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input name="reservationId" type="hidden" value={reservation.id} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {timeInSaoPaulo(reservation.startsAtIso)}-{timeInSaoPaulo(reservation.endsAtIso)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Apt {reservation.apartmentNumber}</p>
        </div>
        <button
          className="min-h-10 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Cancelando..." : "Cancelar"}
        </button>
      </div>
      <StateMessage state={state} />
    </form>
  );
}

export function MyReservations({ reservations }: { reservations: ScheduleReservation[] }) {
  if (reservations.length === 0) return null;

  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Meus agendamentos do dia</h2>
      </div>
      {reservations.map((reservation) => (
        <MyReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </section>
  );
}
