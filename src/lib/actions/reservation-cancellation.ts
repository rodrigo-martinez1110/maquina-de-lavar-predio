"use server";

import { messageFromUnknownError } from "../domain/action-errors";
import { cancelReservationAction } from "./reservations";

export type ReservationCancellationState = {
  error?: string;
  success?: string;
};

export async function cancelReservationFromForm(
  _previousState: ReservationCancellationState,
  formData: FormData,
): Promise<ReservationCancellationState> {
  try {
    await cancelReservationAction(formData);
    return { success: "Agendamento cancelado" };
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }
}
