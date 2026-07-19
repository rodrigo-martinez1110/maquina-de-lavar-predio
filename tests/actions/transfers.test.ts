import { describe, expect, it, vi } from "vitest";
import { acceptTransferUseCase } from "../../src/lib/actions/transfers";

describe("transfer actions", () => {
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
});
