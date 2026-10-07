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

export function validateWeeklyBalanceAdjustmentInput(input: {
  apartmentId: FormDataEntryValue | null;
  minutes: FormDataEntryValue | null;
  reason: FormDataEntryValue | null;
}) {
  const apartmentId = String(input.apartmentId ?? "").trim();
  const minutes = Number(input.minutes);
  const reason = String(input.reason ?? "").trim();

  if (!apartmentId) throw new Error("Apartamento invalido");
  if (!Number.isInteger(minutes) || minutes === 0 || Math.abs(minutes) > 480 || minutes % 30 !== 0) {
    throw new Error("Ajuste de saldo invalido");
  }
  if (!reason) throw new Error("Motivo obrigatorio");
  if (reason.length > 200) throw new Error("Motivo muito longo");

  return { apartmentId, minutes, reason };
}
