"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { assertReservationAllowed, type ReservationWindow } from "../domain/reservations";
import { minutesBetween } from "../domain/time";

type ReservationKind = "wash" | "dry" | "wash_dry" | "custom";

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

export async function createReservationAction(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");

  const startIso = String(formData.get("startIso"));
  const endIso = String(formData.get("endIso"));
  const kind = String(formData.get("kind")) as ReservationKind;
  const availableMinutes = Number(formData.get("availableMinutes"));
  const { findReservationConflicts, insertReservation } = await import("../repositories/reservations");

  await createReservationUseCase({
    apartmentId: session.apartmentId,
    kind,
    startIso,
    endIso,
    availableMinutes,
    findConflicts: findReservationConflicts,
    insertReservation,
    audit: async () => undefined,
  });

  revalidatePath("/reservations");
}
