import { describe, expect, it } from "vitest";
import { createReservationUseCase } from "../../src/lib/actions/reservations";

describe("reservation actions", () => {
  it("creates reservation when balance and window are valid", async () => {
    const result = await createReservationUseCase({
      apartmentId: "apt-1",
      kind: "wash_dry",
      startIso: "2026-07-20T10:00:00-03:00",
      endIso: "2026-07-20T12:00:00-03:00",
      availableMinutes: 180,
      findConflicts: async () => [],
      insertReservation: async () => ({ id: "res-1" }),
      audit: async () => undefined,
    });

    expect(result).toEqual({ id: "res-1" });
  });

  it("blocks conflicting reservation", async () => {
    await expect(
      createReservationUseCase({
        apartmentId: "apt-1",
        kind: "wash",
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T11:00:00-03:00",
        availableMinutes: 120,
        findConflicts: async () => [{ id: "res-2" }],
        insertReservation: async () => ({ id: "res-1" }),
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Horario indisponivel");
  });
});
