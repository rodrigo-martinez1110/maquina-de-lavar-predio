import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { assertReservationAllowed, type ReservationWindow } from "../domain/reservations";
import { minutesBetween } from "../domain/time";
export { availableMinutesFromWeeklyBalance } from "../domain/weekly-balances";

type ReservationKind = "wash" | "dry" | "wash_dry" | "custom";

type ReservationAuditMetadata = {
  kind: ReservationKind;
  startIso: string;
  endIso: string;
  estimatedMinutes: number;
};

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
  getAvailableMinutes: (input: { apartmentId: string; startIso: string }) => Promise<number>;
  findConflicts: (window: ReservationWindow) => Promise<Array<{ id: string }>>;
  insertReservation: (row: {
    apartmentId: string;
    kind: ReservationKind;
    startIso: string;
    endIso: string;
    estimatedMinutes: number;
  }) => Promise<{ id: string }>;
  auditReservationCreated: (entry: {
    apartmentId: string;
    reservationId: string;
    metadata: ReservationAuditMetadata;
  }) => Promise<void>;
}) {
  const startIso = String(input.formData.get("startIso") ?? "");
  const endIso = String(input.formData.get("endIso") ?? "");
  const kind = String(input.formData.get("kind") ?? "") as ReservationKind;
  const availableMinutes = await input.getAvailableMinutes({ apartmentId: input.apartmentId, startIso });
  const estimatedMinutes = minutesBetween(startIso, endIso);

  return createReservationUseCase({
    apartmentId: input.apartmentId,
    kind,
    startIso,
    endIso,
    availableMinutes,
    findConflicts: input.findConflicts,
    insertReservation: input.insertReservation,
    audit: async (_action, reservationId) => {
      await input.auditReservationCreated({
        apartmentId: input.apartmentId,
        reservationId,
        metadata: {
          kind,
          startIso,
          endIso,
          estimatedMinutes,
        },
      });
    },
  });
}

export async function createReservationAction(formData: FormData) {
  "use server";

  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");

  const { writeReservationCreatedAudit } = await import("../repositories/audit-logs");
  const { findReservationConflicts, getAvailableReservationMinutes, insertReservation } = await import(
    "../repositories/reservations"
  );

  await createReservationActionUseCase({
    apartmentId: session.apartmentId,
    formData,
    getAvailableMinutes: getAvailableReservationMinutes,
    findConflicts: findReservationConflicts,
    insertReservation,
    auditReservationCreated: writeReservationCreatedAudit,
  });

  revalidatePath("/reservations");
}
