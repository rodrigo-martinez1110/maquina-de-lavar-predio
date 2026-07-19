import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { assertReservationAllowed, type ReservationWindow } from "../domain/reservations";
import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "../domain/time";
export { availableMinutesFromWeeklyBalance } from "../domain/weekly-balances";

type ReservationKind = "wash" | "dry" | "wash_dry" | "custom";
const RESERVATION_KINDS: ReadonlySet<string> = new Set(["wash", "dry", "wash_dry", "custom"]);

export function buildReservationWindowFromForm(input: {
  date: FormDataEntryValue | null;
  startTime: FormDataEntryValue | null;
  durationMinutes: FormDataEntryValue | null;
}) {
  const date = String(input.date ?? "");
  const startTime = String(input.startTime ?? "");
  const durationMinutes = Number(input.durationMinutes);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(startTime);

  if (!dateMatch || !timeMatch) throw new Error("Data ou horario invalido");
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 30 ||
    durationMinutes > 240 ||
    durationMinutes % 30 !== 0
  ) {
    throw new Error("Duracao invalida");
  }

  const startHour = Number(timeMatch[1]);
  const startMinute = Number(timeMatch[2]);
  if (startHour > 23 || startMinute > 59) throw new Error("Data ou horario invalido");

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  if (endTotalMinutes > 23 * 60) throw new Error("Reservas devem terminar ate 23:00");

  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;

  return {
    startIso: `${date}T${startTime}:00-03:00`,
    endIso: `${date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00-03:00`,
  };
}

export async function createReservationUseCase(input: {
  apartmentId: string;
  kind: ReservationKind;
  startIso: string;
  endIso: string;
  availableMinutes: number;
  findConflicts: (window: ReservationWindow) => Promise<Array<{ id: string }>>;
  insertReservation: (row: {
    apartmentId: string;
    kind: ReservationKind;
    startIso: string;
    endIso: string;
    estimatedMinutes: number;
  }) => Promise<{ id: string }>;
  audit: (action: string, entityId: string) => Promise<void>;
}) {
  assertReservationAllowed(input);

  const conflicts = await input.findConflicts({ startIso: input.startIso, endIso: input.endIso });
  if (conflicts.length > 0) throw new Error("Horario indisponivel");

  const reservation = await input.insertReservation({
    apartmentId: input.apartmentId,
    kind: input.kind,
    startIso: input.startIso,
    endIso: input.endIso,
    estimatedMinutes: minutesBetween(input.startIso, input.endIso),
  });

  await input.audit("reservation.created", reservation.id);

  return reservation;
}

export async function createReservationActionUseCase(input: {
  apartmentId: string;
  formData: FormData;
  createReservationAtomically: (row: {
    apartmentId: string;
    kind: ReservationKind;
    startIso: string;
    endIso: string;
    estimatedMinutes: number;
  }) => Promise<{ id: string }>;
}) {
  const startIso = String(input.formData.get("startIso") ?? "");
  const endIso = String(input.formData.get("endIso") ?? "");
  const kindText = String(input.formData.get("kind") ?? "");

  if (!RESERVATION_KINDS.has(kindText)) throw new Error("Tipo de reserva invalido");

  const kind = kindText as ReservationKind;
  assertReservationWindowShape(startIso, endIso);
  const estimatedMinutes = minutesBetween(startIso, endIso);

  try {
    return await input.createReservationAtomically({
      apartmentId: input.apartmentId,
      kind,
      startIso,
      endIso,
      estimatedMinutes,
    });
  } catch (error) {
    throw mapReservationDatabaseError(error) ?? error;
  }
}

function assertReservationWindowShape(startIso: string, endIso: string) {
  assertReservableWindow(startIso, endIso);
  const duration = minutesBetween(startIso, endIso);
  if (duration < 30) throw new Error("Reserva minima de 30 minutos");
  if (duration > 240) throw new Error("Reserva maxima de 4 horas");
  if (duration % 30 !== 0) throw new Error("Reservas devem usar blocos de 30 minutos");
}

export function calculateCancellationRefund(input: {
  startsAtIso: string;
  cancelledAtIso: string;
  reservedMinutes: number;
}) {
  const minutesBeforeStart = minutesBetween(input.cancelledAtIso, input.startsAtIso);
  return minutesBeforeStart >= 60 ? input.reservedMinutes : 0;
}

export function calculateReleaseRefund(input: { endsAtIso: string; releasedAtIso: string }) {
  const unusedMinutes = minutesBetween(input.releasedAtIso, input.endsAtIso);
  return Math.max(0, Math.floor(unusedMinutes / 30) * 30);
}

export function calculateLatePenalty(input: { endsAtIso: string; finishedAtIso: string }) {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.endsAtIso, input.finishedAtIso));
}

export function mapReservationDatabaseError(error: unknown): Error | null {
  if (!error || typeof error !== "object") return null;
  const maybePostgresError = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = `${String(maybePostgresError.message ?? "")} ${String(maybePostgresError.details ?? "")}`;

  if (maybePostgresError.code === "23P01" || text.includes("reservations_active_no_overlap")) {
    return new Error("Horario indisponivel");
  }

  return null;
}

export async function createReservationAction(formData: FormData) {
  "use server";

  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");

  const { createReservationWithBalance } = await import("../repositories/reservations");

  await createReservationActionUseCase({
    apartmentId: session.apartmentId,
    formData,
    createReservationAtomically: createReservationWithBalance,
  });

  revalidatePath("/reservations");
}
