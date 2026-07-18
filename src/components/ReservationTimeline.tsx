export function ReservationTimeline({ slots }: { slots: string[] }) {
  return (
    <div className="grid gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          className="min-h-12 rounded border p-3 text-left text-sm"
          type="button"
        >
          {slot} - disponivel
        </button>
      ))}
    </div>
  );
}
