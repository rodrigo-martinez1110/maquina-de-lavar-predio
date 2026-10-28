import clsx from "clsx";
import type { DaySlot } from "../lib/domain/schedule";
import { reservationStatusLabel } from "./reservation-status";

export function ReservationTimeline({ slots, date }: { slots: DaySlot[]; date?: string }) {
  const selectedDate = date ?? new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return (
    <section className="grid gap-2" aria-label="Grade de horarios do dia">
      {slots.map((slot) => (
        <a
          key={slot.time}
          className={clsx(
            "flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm font-medium shadow-sm transition",
            slot.status === "free"
              ? "border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-300"
              : slot.status === "busy"
                ? "border-rose-100 bg-rose-50 text-rose-950"
                : "border-slate-200 bg-slate-100 text-slate-700",
          )}
          href={slot.status === "free"
            ? `/reservations?date=${selectedDate}&start=${encodeURIComponent(slot.time)}`
            : `/reservations?date=${selectedDate}`}
        >
          <span>
            {slot.time} - {slot.status === "free"
              ? "disponivel"
              : slot.status === "history"
                ? reservationStatusLabel(slot.reservationStatus, slot.nonUseReason)
                : "ocupado"}
          </span>
          <span
            className={clsx(
              "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
              slot.status === "free"
                ? "bg-white text-emerald-700"
                : slot.status === "busy"
                  ? "bg-white text-rose-700 ring-1 ring-rose-100"
                  : "bg-white text-slate-700 ring-1 ring-slate-200",
            )}
          >
            {slot.status === "free" ? "30 min" : `Apt ${slot.apartmentNumber}`}
          </span>
          {(slot.status === "free" ? slot.historyReservations : slot.additionalReservations)?.map((reservation, index) => (
            <span className="w-full text-xs" key={`${reservation.apartmentNumber}-${reservation.reservationStatus}-${index}`}>
              Apt {reservation.apartmentNumber} · {reservationStatusLabel(reservation.reservationStatus, reservation.nonUseReason)}
            </span>
          ))}
        </a>
      ))}
    </section>
  );
}
