export type TransferStatus = "open" | "partially_filled" | "filled" | "cancelled";

export function applyPartialAcceptance(input: {
  remainingMinutes: number;
  acceptedMinutes: number;
}): {
  remainingMinutes: number;
  status: TransferStatus;
} {
  if (input.acceptedMinutes <= 0) throw new Error("Minutos devem ser positivos");
  if (input.acceptedMinutes > input.remainingMinutes) throw new Error("Aceite maior que o restante");
  const remainingMinutes = input.remainingMinutes - input.acceptedMinutes;
  return { remainingMinutes, status: remainingMinutes === 0 ? "filled" : "partially_filled" };
}
