export function validateApartmentSettingsInput(input: {
  apartmentId: FormDataEntryValue | null;
  residentCount: FormDataEntryValue | null;
  manualAdjustmentMinutes: FormDataEntryValue | null;
}) {
  const apartmentId = String(input.apartmentId ?? "");
  const residentCount = Number(input.residentCount);
  const manualAdjustmentMinutes = Number(input.manualAdjustmentMinutes);

  if (!apartmentId) throw new Error("Apartamento invalido");
  if (!Number.isInteger(residentCount) || residentCount < 1 || residentCount > 2) {
    throw new Error("Quantidade de moradores invalida");
  }
  if (
    !Number.isInteger(manualAdjustmentMinutes) ||
    manualAdjustmentMinutes < -360 ||
    manualAdjustmentMinutes > 360 ||
    manualAdjustmentMinutes % 30 !== 0
  ) {
    throw new Error("Ajuste de minutos invalido");
  }

  return { apartmentId, residentCount, manualAdjustmentMinutes };
}

export function validatePinResetInput(input: {
  apartmentId: FormDataEntryValue | null;
  pin: FormDataEntryValue | null;
}) {
  const apartmentId = String(input.apartmentId ?? "");
  const pin = String(input.pin ?? "");

  if (!apartmentId) throw new Error("Apartamento invalido");
  if (!/^\d{4,8}$/.test(pin)) throw new Error("PIN invalido");

  return { apartmentId, pin };
}
