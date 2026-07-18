const THIRTY_MINUTES = 30;

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function ceilToThirtyMinuteBlocks(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / THIRTY_MINUTES) * THIRTY_MINUTES;
}

export function assertReservableWindow(startIso: string, endIso: string): void {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  if (startHour < 7) throw new Error("Reservas devem comecar a partir de 07:00");
  if (endHour > 23 || end.toDateString() !== start.toDateString()) {
    throw new Error("Reservas devem terminar ate 23:00");
  }
}
