"use server";

import { revalidatePath } from "next/cache";
async function reservationId(formData: FormData) {
  const id = String(formData.get("reservationId") ?? "").trim();
  if (!id) throw new Error("Reserva invalida");
  const { getApartmentSession } = await import("../auth/apartment-session");
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  return { id, apartmentId: session.apartmentId };
}

export async function startReservationAction(formData: FormData) {
  const input = await reservationId(formData);
  const { startReservation } = await import("../repositories/reservations");
  await startReservation({ reservationId: input.id, apartmentId: input.apartmentId });
  revalidatePath("/reservations");
}

export async function finishReservationAction(formData: FormData) {
  const input = await reservationId(formData);
  const { finishReservation } = await import("../repositories/reservations");
  await finishReservation({ reservationId: input.id, apartmentId: input.apartmentId });
  revalidatePath("/reservations");
}

export async function markReservationNotUsedAction(formData: FormData) {
  const input = await reservationId(formData);
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim() || null;
  if (reason !== "occupied" && reason !== "machine_problem" && reason !== "other") {
    throw new Error("Motivo invalido");
  }
  if (details !== null && reason !== "other") {
    throw new Error("Detalhes permitidos apenas para o motivo Outro");
  }
  if (details !== null && details.length > 160) {
    throw new Error("Os detalhes devem ter no maximo 160 caracteres");
  }
  const { markReservationNotUsed } = await import("../repositories/reservations");
  await markReservationNotUsed({
    reservationId: input.id,
    apartmentId: input.apartmentId,
    reason,
    details: details ?? undefined,
  });
  revalidatePath("/reservations");
  revalidatePath("/");
}
