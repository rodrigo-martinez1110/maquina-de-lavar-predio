"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { applyPartialAcceptance, type TransferStatus } from "../domain/transfers";

type TransferRow = {
  id: string;
  apartmentId: string;
  kind: "offer" | "request";
  remainingMinutes: number;
};

export async function acceptTransferUseCase(input: {
  transfer: TransferRow;
  actorApartmentId: string;
  minutes: number;
  insertAcceptance: (row: {
    transferId: string;
    fromApartmentId: string;
    toApartmentId: string;
    minutes: number;
  }) => Promise<unknown>;
  updateTransfer: (row: {
    transferId: string;
    remainingMinutes: number;
    status: TransferStatus;
  }) => Promise<unknown>;
  notify: (apartmentId: string, minutes: number) => Promise<void>;
  audit: (transferId: string, minutes: number) => Promise<void>;
}) {
  const next = applyPartialAcceptance({
    remainingMinutes: input.transfer.remainingMinutes,
    acceptedMinutes: input.minutes,
  });
  const fromApartmentId =
    input.transfer.kind === "request" ? input.actorApartmentId : input.transfer.apartmentId;
  const toApartmentId =
    input.transfer.kind === "request" ? input.transfer.apartmentId : input.actorApartmentId;

  await input.insertAcceptance({
    transferId: input.transfer.id,
    fromApartmentId,
    toApartmentId,
    minutes: input.minutes,
  });
  await input.updateTransfer({
    transferId: input.transfer.id,
    remainingMinutes: next.remainingMinutes,
    status: next.status,
  });
  await input.notify(toApartmentId, input.minutes);
  await input.audit(input.transfer.id, input.minutes);
  return next;
}

export async function createHourOffer(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const { createTransfer } = await import("../repositories/transfers");
  await createTransfer({
    apartmentId: session.apartmentId,
    kind: "offer",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  revalidatePath("/credits");
}

export async function createHourRequest(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const { createTransfer } = await import("../repositories/transfers");
  await createTransfer({
    apartmentId: session.apartmentId,
    kind: "request",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  revalidatePath("/credits");
}
