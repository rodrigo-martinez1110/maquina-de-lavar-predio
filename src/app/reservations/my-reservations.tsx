"use client";

import { useActionState, useEffect, useState } from "react";
import { reservationNonUseReasonLabels, reservationStatusLabel } from "../../components/reservation-status";
import {
  cancelReservationFromForm,
  type ReservationCancellationState,
} from "../../lib/actions/reservation-cancellation";
import type { ScheduleReservation } from "../../lib/domain/schedule";
import {
  finishReservationAction,
  markReservationNotUsedFromForm,
  type ReservationNonUseState,
} from "../../lib/actions/reservation-usage";

const initialState: ReservationCancellationState = {};
const initialNonUseState: ReservationNonUseState = {};

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

function MyReservationCard({ reservation, now }: { reservation: ScheduleReservation; now: number }) {
  const [state, formAction, isPending] = useActionState(cancelReservationFromForm, initialState);
  const [nonUseState, nonUseAction, isNonUsePending] = useActionState(
    markReservationNotUsedFromForm,
    initialNonUseState,
  );
  const [reason, setReason] = useState("");
  const startsAt = new Date(reservation.startsAtIso).getTime();
  const endsAt = new Date(reservation.endsAtIso).getTime();
  const isActive = ["reserved", "in_use", "late"].includes(reservation.status);
  const isDuringReservation = startsAt <= now && now < endsAt;
  const canReportNonUse = isActive && isDuringReservation && !nonUseState.success;
  const canFinish = isActive && !nonUseState.success && (
    isDuringReservation || (reservation.status === "late" && now >= endsAt)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {timeInSaoPaulo(reservation.startsAtIso)}-{timeInSaoPaulo(reservation.endsAtIso)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Apt {reservation.apartmentNumber}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {reservationStatusLabel(reservation.status, reservation.nonUseReason)}
          </p>
        </div>
        {isActive && !nonUseState.success ? (
          <form action={formAction}>
            <input name="reservationId" type="hidden" value={reservation.id} />
            <button
              className="min-h-10 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
              disabled={isPending || isNonUsePending}
              type="submit"
            >
              {isPending ? "Cancelando..." : "Cancelar"}
            </button>
          </form>
        ) : null}
      </div>
      <StateMessage state={state} />
      <StateMessage state={nonUseState} />
      {canFinish ? (
        <form action={finishReservationAction} className="mt-3">
          <input name="reservationId" type="hidden" value={reservation.id} />
          <button disabled={isPending || isNonUsePending} className="min-h-10 w-full rounded-md bg-slate-800 px-3 text-sm font-semibold text-white disabled:opacity-50" type="submit">
            Terminei de usar
          </button>
        </form>
      ) : null}
      {canReportNonUse ? (
        <form action={nonUseAction} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <input name="reservationId" type="hidden" value={reservation.id} />
          <label className="block text-sm font-semibold text-slate-800" htmlFor={`nonuse-reason-${reservation.id}`}>
            Não conseguiu usar?
          </label>
          <select
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
            disabled={isPending || isNonUsePending}
            id={`nonuse-reason-${reservation.id}`}
            name="reason"
            onChange={(event) => setReason(event.target.value)}
            required
            value={reason}
          >
            <option disabled value="">Selecione o motivo</option>
            {Object.entries(reservationNonUseReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {reason === "other" ? (
            <label className="block text-sm text-slate-700">
              Detalhe opcional (até 160 caracteres)
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-slate-300 p-3"
                disabled={isPending || isNonUsePending}
                maxLength={160}
                name="details"
              />
            </label>
          ) : null}
          <button
            className="min-h-10 w-full rounded-md bg-amber-500 px-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            disabled={isPending || isNonUsePending}
            type="submit"
          >
            {isNonUsePending ? "Registrando..." : "Não conseguiu usar"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function MyReservations({ reservations, nowIso }: { reservations: ScheduleReservation[]; nowIso?: string }) {
  const [now, setNow] = useState(nowIso ? new Date(nowIso).getTime() : 0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (reservations.length === 0) return null;

  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Meus agendamentos do dia</h2>
      </div>
      {reservations.map((reservation) => (
        <MyReservationCard key={reservation.id} now={now} reservation={reservation} />
      ))}
    </section>
  );
}
