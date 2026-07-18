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
  const { writeAuditLog } = await import("../repositories/audit-logs");
  const transfer = await createTransfer({
    apartmentId: session.apartmentId,
    kind: "offer",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  await writeAuditLog({
    actorKind: "apartment",
    actorId: session.apartmentId,
    action: "transfer.offer.created",
    entityType: "credit_transfer",
    entityId: transfer.id,
    metadata: { minutes: Number(formData.get("minutes")) },
  });
  revalidatePath("/credits");
}

export async function createHourRequest(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const { createTransfer } = await import("../repositories/transfers");
  const { writeAuditLog } = await import("../repositories/audit-logs");
  const transfer = await createTransfer({
    apartmentId: session.apartmentId,
    kind: "request",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  await writeAuditLog({
    actorKind: "apartment",
    actorId: session.apartmentId,
    action: "transfer.request.created",
    entityType: "credit_transfer",
    entityId: transfer.id,
    metadata: { minutes: Number(formData.get("minutes")) },
  });
  revalidatePath("/credits");
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
}
