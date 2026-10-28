"use server";

import { revalidatePath } from "next/cache";
import { messageFromUnknownError } from "../domain/action-errors";
async function reservationId(formData: FormData) {
  const id = String(formData.get("reservationId") ?? "").trim();
  if (!id) throw new Error("Reserva invalida");
  const { getApartmentSession } = await import("../auth/apartment-session");
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  return { id, apartmentId: session.apartmentId };
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

export type ReservationNonUseState = {
  error?: string;
  success?: string;
};

export async function markReservationNotUsedFromForm(
  _previousState: ReservationNonUseState,
  formData: FormData,
): Promise<ReservationNonUseState> {
  try {
    await markReservationNotUsedAction(formData);
    return { success: "Não utilização registrada. Os minutos da reserva foram devolvidos." };
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }
}
