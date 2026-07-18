"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  validateApartmentSettingsInput,
  validatePinResetInput,
} from "../domain/admin-apartments";

export async function updateApartment(formData: FormData) {
  const { apartmentId, residentCount, manualAdjustmentMinutes } =
    validateApartmentSettingsInput({
      apartmentId: formData.get("apartmentId"),
      residentCount: formData.get("residentCount"),
      manualAdjustmentMinutes: formData.get("manualAdjustmentMinutes"),
    });
  const { updateApartmentSettings } = await import("../repositories/apartments");
  await updateApartmentSettings({ apartmentId, residentCount, manualAdjustmentMinutes });
  revalidatePath("/admin/apartments");
}

export async function resetApartmentPin(formData: FormData) {
  const { apartmentId, pin } = validatePinResetInput({
    apartmentId: formData.get("apartmentId"),
    pin: formData.get("pin"),
  });
  const pinHash = await bcrypt.hash(pin, 10);
  const { updateApartmentSettings } = await import("../repositories/apartments");
  await updateApartmentSettings({ apartmentId, pinHash });
  revalidatePath("/admin/apartments");
}
