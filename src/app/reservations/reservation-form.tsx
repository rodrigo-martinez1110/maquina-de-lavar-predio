"use client";

import { useActionState } from "react";
import type { ReservationFormState } from "../../lib/actions/reservation-form";

const initialState: ReservationFormState = {};

export function ReservationForm(props: {
  action: (previousState: ReservationFormState, formData: FormData) => Promise<ReservationFormState>;
  defaultDate: string;
  defaultStartTime?: string;
}) {
  const [state, formAction, isPending] = useActionState(props.action, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Dia
          <input
            className="min-h-11 rounded-md border border-slate-300 px-3 text-base outline-none focus:border-slate-900"
            defaultValue={props.defaultDate}
            name="date"
            required
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Inicio
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            defaultValue={props.defaultStartTime ?? "10:00"}
            name="startTime"
            required
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Uso
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            defaultValue="wash_dry"
            name="kind"
            required
          >
            <option value="wash">Lavar</option>
            <option value="dry">Secar</option>
            <option value="wash_dry">Lavar e secar</option>
            <option value="custom">Outro</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Duracao
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            defaultValue="120"
            name="durationMinutes"
            required
          >
            <option value="60">1h</option>
            <option value="90">1h30</option>
            <option value="120">2h</option>
            <option value="150">2h30</option>
            <option value="180">3h</option>
            <option value="240">4h</option>
          </select>
        </label>
      </div>

      {state.error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        className="mt-4 min-h-11 w-full rounded-md bg-slate-950 px-4 font-medium text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Reservando..." : "Reservar horario"}
      </button>
    </form>
  );
}

const timeOptions = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];
