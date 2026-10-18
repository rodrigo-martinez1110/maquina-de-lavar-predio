"use server";

import { revalidatePath } from "next/cache";
async function reservationId(formData: FormData) {
  const id = String(formData.get("reservationId") ?? "");
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
