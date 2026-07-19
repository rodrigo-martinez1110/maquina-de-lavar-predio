import clsx from "clsx";
import type { DaySlot } from "../lib/domain/schedule";

export function ReservationTimeline({ slots }: { slots: DaySlot[] }) {
  return (
    <section className="grid gap-2" aria-label="Grade de horarios do dia">
      {slots.map((slot) => (
        <button
          key={slot.time}
          className={clsx(
            "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm font-medium shadow-sm transition",
            slot.status === "free"
              ? "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              : "border-rose-100 bg-rose-50 text-rose-950",
          )}
          type="button"
        >
          <span>
            {slot.time} - {slot.status === "free" ? "disponivel" : "ocupado"}
          </span>
          <span
            className={clsx(
              "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
              slot.status === "free"
                ? "bg-slate-100 text-slate-500"
                : "bg-white text-rose-700 ring-1 ring-rose-100",
            )}
          >
            {slot.status === "free" ? "30 min" : `Apt ${slot.apartmentNumber}`}
          </span>
        </button>
      ))}
    </section>
  );
}
