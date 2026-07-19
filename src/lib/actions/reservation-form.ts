"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { messageFromUnknownError } from "../domain/action-errors";
import {
  buildReservationWindowFromForm,
  createReservationActionUseCase,
} from "./reservations";

export type ReservationFormState = {
  error?: string;
  success?: string;
};

export async function createReservationFromForm(
  _previousState: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const session = await getApartmentSession();
  if (!session) return { error: "Sessao expirada" };

  try {
    const { startIso, endIso } = buildReservationWindowFromForm({
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      durationMinutes: formData.get("durationMinutes"),
    });
    const actionFormData = new FormData();
    actionFormData.set("kind", String(formData.get("kind") ?? ""));
    actionFormData.set("startIso", startIso);
    actionFormData.set("endIso", endIso);

    const { createReservationWithBalance } = await import("../repositories/reservations");

    await createReservationActionUseCase({
      apartmentId: session.apartmentId,
      formData: actionFormData,
      createReservationAtomically: createReservationWithBalance,
    });
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }

  revalidatePath("/reservations");
  revalidatePath("/");
  return { success: "Reserva criada com sucesso" };
}
