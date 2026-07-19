export function ReservationTimeline({ slots }: { slots: string[] }) {
  return (
    <div className="grid gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          className="flex min-h-14 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          type="button"
        >
          <span>{slot} - disponivel</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
            30 min
          </span>
        </button>
      ))}
    </div>
  );
}
