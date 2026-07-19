"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { messageFromUnknownError } from "../domain/action-errors";
import { applyPartialAcceptance, type TransferStatus } from "../domain/transfers";

type TransferRow = {
  id: string;
  apartmentId: string;
  kind: "offer" | "request";
  weekStart: string;
  remainingMinutes: number;
};

export type TransferFormState = {
  error?: string;
  success?: string;
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
  updateBalances: (row: {
    fromApartmentId: string;
    toApartmentId: string;
    weekStart: string;
    minutes: number;
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
  await input.updateBalances({
    fromApartmentId,
    toApartmentId,
    weekStart: input.transfer.weekStart,
    minutes: input.minutes,
  });
  await input.notify(toApartmentId, input.minutes);
  await input.audit(input.transfer.id, input.minutes);
  return next;
}

function readTransferMinutes(formData: FormData): number {
  const minutes = Number(formData.get("minutes"));
  if (!Number.isInteger(minutes) || minutes <= 0 || minutes % 30 !== 0) {
    throw new Error("Quantidade de horas invalida");
  }
  return minutes;
}

function readWeekStart(formData: FormData): string {
  const weekStart = String(formData.get("weekStart") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error("Semana invalida");
  return weekStart;
}

export async function createHourOffer(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const { createTransfer } = await import("../repositories/transfers");
  const { writeAuditLog } = await import("../repositories/audit-logs");
  const transfer = await createTransfer({
    apartmentId: session.apartmentId,
    kind: "offer",
    weekStart: readWeekStart(formData),
    totalMinutes: readTransferMinutes(formData),
  });
  await writeAuditLog({
    actorKind: "apartment",
    actorId: session.apartmentId,
    action: "transfer.offer.created",
    entityType: "credit_transfer",
    entityId: transfer.id,
    metadata: { minutes: readTransferMinutes(formData) },
  });
  revalidatePath("/credits");
}

export async function createHourOfferFromForm(
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  try {
    await createHourOffer(formData);
    return { success: "Oferta criada" };
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }
}

export async function createHourRequest(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const { createTransfer } = await import("../repositories/transfers");
  const { writeAuditLog } = await import("../repositories/audit-logs");
  const transfer = await createTransfer({
    apartmentId: session.apartmentId,
    kind: "request",
    weekStart: readWeekStart(formData),
    totalMinutes: readTransferMinutes(formData),
  });
  await writeAuditLog({
    actorKind: "apartment",
    actorId: session.apartmentId,
    action: "transfer.request.created",
    entityType: "credit_transfer",
    entityId: transfer.id,
    metadata: { minutes: readTransferMinutes(formData) },
  });
  revalidatePath("/credits");
}

export async function createHourRequestFromForm(
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  try {
    await createHourRequest(formData);
    return { success: "Pedido criado" };
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }
}

export async function acceptTransferAction(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");

  const transferId = String(formData.get("transferId") ?? "");
  const minutes = Number(formData.get("minutes"));
  if (!transferId) throw new Error("Transferencia invalida");

  const {
    findOpenTransferById,
    insertTransferAcceptance,
    updateTransferRemaining,
  } = await import("../repositories/transfers");
  const { applyAcceptedTransferToBalances } = await import("../repositories/weekly-balances");
  const { createNotification } = await import("../repositories/notifications");
  const { writeAuditLog } = await import("../repositories/audit-logs");

  const transfer = await findOpenTransferById(transferId);
  if (transfer.apartmentId === session.apartmentId) {
    throw new Error("Nao e possivel aceitar a propria transferencia");
  }

  await acceptTransferUseCase({
    transfer,
    actorApartmentId: session.apartmentId,
    minutes,
    insertAcceptance: insertTransferAcceptance,
    updateTransfer: updateTransferRemaining,
    updateBalances: applyAcceptedTransferToBalances,
    notify: async (apartmentId, acceptedMinutes) => {
      await createNotification({
        apartmentId,
        kind: "transfer",
        title: "Horas transferidas",
        body: `${acceptedMinutes} minutos foram transferidos para o seu apartamento.`,
      });
    },
    audit: async (acceptedTransferId, acceptedMinutes) => {
      await writeAuditLog({
        actorKind: "apartment",
        actorId: session.apartmentId,
        action: "transfer.accepted",
        entityType: "credit_transfer",
        entityId: acceptedTransferId,
        metadata: { minutes: acceptedMinutes },
      });
    },
  });

  revalidatePath("/credits");
  revalidatePath("/");
}

export async function acceptTransferFromForm(
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  try {
    await acceptTransferAction(formData);
    return { success: "Horas transferidas" };
  } catch (error) {
    return { error: messageFromUnknownError(error) };
  }
}
