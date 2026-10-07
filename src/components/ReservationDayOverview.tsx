import clsx from "clsx";
import type { DaySlot, FreeWindow } from "../lib/domain/schedule";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function ReservationDayOverview(props: {
  date: string;
  slots: DaySlot[];
  freeWindows: FreeWindow[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Visao rapida</p>
          <p className="mt-1 text-xs text-slate-500">08:00-23:00</p>
        </div>
        <div className="flex gap-2 text-xs font-medium">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">livre</span>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">ocupado</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1" aria-label="Mapa compacto do dia">
        {props.slots.map((slot) => (
          <a
            aria-label={
              slot.status === "free"
                ? `${slot.time} livre`
                : `${slot.time} ocupado pelo apartamento ${slot.apartmentNumber}`
            }
            className={clsx(
              "flex min-h-10 flex-col items-center justify-center rounded-md border px-1 text-center text-[11px] font-semibold",
              slot.status === "free"
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-rose-100 bg-rose-50 text-rose-800",
            )}
            href={
              slot.status === "free"
                ? `/reservations?date=${props.date}&start=${encodeURIComponent(slot.time)}`
                : `/reservations?date=${props.date}`
            }
            key={slot.time}
          >
            <span>{slot.time}</span>
            {slot.status === "busy" ? <span>Apt {slot.apartmentNumber}</span> : null}
          </a>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        <p className="text-sm font-semibold text-slate-950">Espacos livres</p>
        {props.freeWindows.length === 0 ? (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-800">
            Nenhum horario livre nesse dia.
          </p>
        ) : (
          props.freeWindows.map((window) => (
            <a
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800"
              href={`/reservations?date=${props.date}&start=${encodeURIComponent(window.startTime)}`}
              key={`${window.startTime}-${window.endTime}`}
            >
              <span>
                {window.startTime}-{window.endTime}
              </span>
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-emerald-700 ring-1 ring-emerald-100">
                {formatDuration(window.durationMinutes)} livre
              </span>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
