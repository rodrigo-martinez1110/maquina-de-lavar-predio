"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";

export type ChangePinState = {
  error?: string;
  success?: string;
};

export async function changeApartmentPinUseCase(input: {
  apartmentId: string;
  currentPin: string;
  newPin: string;
  confirmPin: string;
  findApartmentPinHash: (apartmentId: string) => Promise<string | null>;
  updatePinHash: (apartmentId: string, pinHash: string) => Promise<void>;
  hashPin?: (pin: string) => Promise<string>;
}) {
  const currentPin = input.currentPin.trim();
  const newPin = input.newPin.trim();
  const confirmPin = input.confirmPin.trim();

  if (!/^\d{4,8}$/.test(newPin)) throw new Error("Novo PIN invalido");
  if (newPin !== confirmPin) throw new Error("Confirmacao do PIN nao confere");
  if (currentPin === newPin) throw new Error("Novo PIN deve ser diferente do atual");

  const currentHash = await input.findApartmentPinHash(input.apartmentId);
  if (!currentHash) throw new Error("Apartamento nao encontrado");

  const currentPinMatches = await bcrypt.compare(currentPin, currentHash);
  if (!currentPinMatches) throw new Error("PIN atual invalido");

  const hashPin = input.hashPin ?? ((pin: string) => bcrypt.hash(pin, 10));
  await input.updatePinHash(input.apartmentId, await hashPin(newPin));

  return { ok: true };
}

export async function changeApartmentPin(
  _previousState: ChangePinState,
  formData: FormData,
): Promise<ChangePinState> {
  const session = await getApartmentSession();
  if (!session) return { error: "Sessao expirada" };

  const { findApartmentPinHashById, updateApartmentPinHash } = await import(
    "../repositories/apartments"
  );

  try {
    await changeApartmentPinUseCase({
      apartmentId: session.apartmentId,
      currentPin: String(formData.get("currentPin") ?? ""),
      newPin: String(formData.get("newPin") ?? ""),
      confirmPin: String(formData.get("confirmPin") ?? ""),
      findApartmentPinHash: findApartmentPinHashById,
      updatePinHash: updateApartmentPinHash,
    });
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  revalidatePath("/account");
  return { success: "PIN atualizado com sucesso" };
}
