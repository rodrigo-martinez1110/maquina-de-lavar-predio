import { describe, expect, it, vi } from "vitest";
import {
  acceptTransferUseCase,
  cancelTransferUseCase,
  createTransferUseCase,
} from "../../src/lib/actions/transfers";

describe("transfer actions", () => {
  it("blocks duplicate open requests in the same week", async () => {
    await expect(
      createTransferUseCase({
        apartmentId: "apt-5",
        kind: "request",
        weekStart: "2026-07-13",
        totalMinutes: 120,
        findExistingOpenTransfer: async () => ({ id: "existing-transfer" }),
        getAvailableMinutes: async () => 360,
        createTransfer: async (row) => row,
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Ja existe um pedido aberto nesta semana");
  });

  it("creates a request when there is no open request in the week", async () => {
    const createTransfer = vi.fn(async () => ({ id: "transfer-1" }));

    await createTransferUseCase({
      apartmentId: "apt-5",
      kind: "request",
      weekStart: "2026-07-13",
      totalMinutes: 120,
      findExistingOpenTransfer: async () => null,
      getAvailableMinutes: async () => 360,
      createTransfer,
      audit: async () => undefined,
    });

    expect(createTransfer).toHaveBeenCalledWith({
      apartmentId: "apt-5",
      kind: "request",
      weekStart: "2026-07-13",
      totalMinutes: 120,
    });
  });

  it("blocks creating offer above the available balance", async () => {
    await expect(
      createTransferUseCase({
        apartmentId: "apt-5",
        kind: "offer",
        weekStart: "2026-07-13",
        totalMinutes: 120,
        findExistingOpenTransfer: async () => null,
        getAvailableMinutes: async () => 60,
        createTransfer: async (row) => ({ id: row.apartmentId }),
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Saldo insuficiente para ceder horas");
  });

  it("lets the owner cancel an open transfer", async () => {
    const updateTransfer = vi.fn(async (row) => row);

    await cancelTransferUseCase({
      transfer: {
        id: "transfer-1",
        apartmentId: "apt-5",
        kind: "request",
        weekStart: "2026-07-13",
        remainingMinutes: 120,
      },
      actorApartmentId: "apt-5",
      updateTransfer,
      audit: async () => undefined,
    });

    expect(updateTransfer).toHaveBeenCalledWith({
      transferId: "transfer-1",
      remainingMinutes: 120,
      status: "cancelled",
    });
  });

  it("blocks cancelling another apartment transfer", async () => {
    await expect(
      cancelTransferUseCase({
        transfer: {
          id: "transfer-1",
          apartmentId: "apt-5",
          kind: "request",
          weekStart: "2026-07-13",
          remainingMinutes: 120,
        },
        actorApartmentId: "apt-6",
        updateTransfer: async (row) => row,
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Nao e possivel cancelar pedido de outro apartamento");
  });

  it("accepts part of an open request", async () => {
    const notify = vi.fn(async () => undefined);
    const audit = vi.fn(async () => undefined);

    const result = await acceptTransferUseCase({
      transfer: {
        id: "transfer-1",
        apartmentId: "apt-requester",
        kind: "request",
        weekStart: "2026-07-13",
        remainingMinutes: 180,
      },
      actorApartmentId: "apt-helper",
      minutes: 60,
      insertAcceptance: async (row) => row,
      updateTransfer: async (row) => row,
      updateBalances: async (row) => row,
      getAvailableMinutes: async () => 360,
      notify,
      audit,
    });

    expect(result).toEqual({ remainingMinutes: 120, status: "partially_filled" });
    expect(notify).toHaveBeenCalledWith("apt-requester", 60);
    expect(audit).toHaveBeenCalledWith("transfer-1", 60);
  });

  it("moves accepted request minutes from helper to requester balance", async () => {
    const updateBalances = vi.fn(async (row) => row);

    await acceptTransferUseCase({
      transfer: {
        id: "transfer-1",
        apartmentId: "apt-requester",
        kind: "request",
        weekStart: "2026-07-13",
        remainingMinutes: 60,
      },
      actorApartmentId: "apt-helper",
      minutes: 60,
      insertAcceptance: async (row) => row,
      updateTransfer: async (row) => row,
      updateBalances,
      getAvailableMinutes: async () => 360,
      notify: async () => undefined,
      audit: async () => undefined,
    });

    expect(updateBalances).toHaveBeenCalledWith({
      fromApartmentId: "apt-helper",
      toApartmentId: "apt-requester",
      weekStart: "2026-07-13",
      minutes: 60,
    });
  });

  it("blocks accepted offer when owner no longer has enough balance", async () => {
    await expect(
      acceptTransferUseCase({
        transfer: {
          id: "transfer-1",
          apartmentId: "apt-owner",
          kind: "offer",
          weekStart: "2026-07-13",
          remainingMinutes: 120,
        },
        actorApartmentId: "apt-receiver",
        minutes: 120,
        insertAcceptance: async (row) => row,
        updateTransfer: async (row) => row,
        updateBalances: async (row) => row,
        getAvailableMinutes: async () => 60,
        notify: async () => undefined,
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Saldo insuficiente para ceder horas");
  });
});
