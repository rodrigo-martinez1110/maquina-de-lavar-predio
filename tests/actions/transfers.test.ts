import { describe, expect, it } from "vitest";
import { acceptTransferUseCase } from "../../src/lib/actions/transfers";

describe("transfer actions", () => {
  it("accepts part of an open request", async () => {
    const result = await acceptTransferUseCase({
      transfer: {
        id: "transfer-1",
        apartmentId: "apt-requester",
        kind: "request",
        remainingMinutes: 180,
      },
      actorApartmentId: "apt-helper",
      minutes: 60,
      insertAcceptance: async (row) => row,
      updateTransfer: async (row) => row,
      notify: async () => undefined,
      audit: async () => undefined,
    });

    expect(result).toEqual({ remainingMinutes: 120, status: "partially_filled" });
  });
});
