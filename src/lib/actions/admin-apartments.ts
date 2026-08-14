"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  validateApartmentSettingsInput,
  validatePinResetInput,
  validateWeeklyBalanceAdjustmentInput,
} from "../domain/admin-apartments";
import { getAdminSession } from "../auth/admin-session";

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

export async function adjustCurrentWeeklyBalance(formData: FormData) {
  const session = await getAdminSession();
  if (!session) throw new Error("Sessao de admin expirada");

  const { apartmentId, minutes, reason } = validateWeeklyBalanceAdjustmentInput({
    apartmentId: formData.get("apartmentId"),
    minutes: formData.get("minutes"),
    reason: formData.get("reason"),
  });
  const { adjustCurrentWeeklyBalance: adjustBalance } = await import("../repositories/weekly-balances");
  const { writeAuditLog } = await import("../repositories/audit-logs");

  const { weekStart } = await adjustBalance({ apartmentId, minutes });
  await writeAuditLog({
    actorKind: "admin",
    actorId: null,
    action: "weekly_balance.adjusted",
    entityType: "apartment",
    entityId: apartmentId,
    metadata: { minutes, reason, weekStart },
  });

  revalidatePath("/admin/apartments");
  revalidatePath("/");
  revalidatePath("/credits");
}
