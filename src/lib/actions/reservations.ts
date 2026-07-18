import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { assertReservationAllowed, type ReservationWindow } from "../domain/reservations";
import { assertReservableWindow, minutesBetween } from "../domain/time";
export { availableMinutesFromWeeklyBalance } from "../domain/weekly-balances";

type ReservationKind = "wash" | "dry" | "wash_dry" | "custom";
const RESERVATION_KINDS: ReadonlySet<string> = new Set(["wash", "dry", "wash_dry", "custom"]);

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
