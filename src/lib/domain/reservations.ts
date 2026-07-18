import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "./time";

export type ReservationWindow = {
  startIso: string;
  endIso: string;
};

export type ReservationAllowedInput = ReservationWindow & {
  availableMinutes: number;
};

export function assertReservationAllowed(input: ReservationAllowedInput): void {
  assertReservableWindow(input.startIso, input.endIso);
  const duration = minutesBetween(input.startIso, input.endIso);
  if (duration < 30) throw new Error("Reserva minima de 30 minutos");
  if (duration > 240) throw new Error("Reserva maxima de 4 horas");
  if (duration % 30 !== 0) throw new Error("Reservas devem usar blocos de 30 minutos");
  if (duration > input.availableMinutes) throw new Error("Saldo insuficiente");
}

export function overlapsReservation(left: ReservationWindow, right: ReservationWindow): boolean {
  return new Date(left.startIso) < new Date(right.endIso) && new Date(right.startIso) < new Date(left.endIso);
}

export function refundForEarlyRelease(input: { reservedEndIso: string; releasedAtIso: string }): number {
  const unusedMinutes = minutesBetween(input.releasedAtIso, input.reservedEndIso);
  return Math.max(0, Math.floor(unusedMinutes / 30) * 30);
}

export function penaltyForLateFinish(input: { reservedEndIso: string; finishedAtIso: string }): number {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.reservedEndIso, input.finishedAtIso));
}
