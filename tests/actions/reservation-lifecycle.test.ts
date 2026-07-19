import { describe, expect, it, vi } from "vitest";
import {
  calculateCancellationRefund,
  calculateLatePenalty,
  calculateReleaseRefund,
  cancelReservationUseCase,
} from "../../src/lib/actions/reservations";

describe("reservation lifecycle", () => {
  it("refunds cancellation more than 1h before start", () => {
    expect(
      calculateCancellationRefund({
        startsAtIso: "2026-07-20T12:00:00-03:00",
        cancelledAtIso: "2026-07-20T10:30:00-03:00",
        reservedMinutes: 120,
      }),
    ).toBe(120);
  });

  it("does not refund late cancellation", () => {
    expect(
      calculateCancellationRefund({
        startsAtIso: "2026-07-20T12:00:00-03:00",
        cancelledAtIso: "2026-07-20T11:30:00-03:00",
        reservedMinutes: 120,
      }),
    ).toBe(0);
  });

  it("refunds early release remainder in complete blocks", () => {
    expect(
      calculateReleaseRefund({
        endsAtIso: "2026-07-20T12:00:00-03:00",
        releasedAtIso: "2026-07-20T11:10:00-03:00",
      }),
    ).toBe(30);
  });

  it("penalizes late finish rounded up", () => {
    expect(
      calculateLatePenalty({
        endsAtIso: "2026-07-20T12:00:00-03:00",
        finishedAtIso: "2026-07-20T12:31:00-03:00",
      }),
    ).toBe(60);
  });

  it("cancels own future reservation and refunds when more than 1h before start", async () => {
    const updateReservation = vi.fn(async (row) => row);
    const refundBalance = vi.fn(async (row) => row);

    await cancelReservationUseCase({
      actorApartmentId: "apt-1",
      nowIso: "2026-07-20T10:30:00-03:00",
      reservation: {
        id: "reservation-1",
        apartmentId: "apt-1",
        startsAtIso: "2026-07-20T12:00:00-03:00",
        estimatedMinutes: 120,
      },
      updateReservation,
      refundBalance,
      audit: async () => undefined,
    });

    expect(updateReservation).toHaveBeenCalledWith({
      reservationId: "reservation-1",
      cancelledAtIso: "2026-07-20T10:30:00-03:00",
    });
    expect(refundBalance).toHaveBeenCalledWith({
      apartmentId: "apt-1",
      startIso: "2026-07-20T12:00:00-03:00",
      minutes: 120,
    });
  });

  it("blocks cancellation of another apartment reservation", async () => {
    await expect(
      cancelReservationUseCase({
        actorApartmentId: "apt-2",
        nowIso: "2026-07-20T10:30:00-03:00",
        reservation: {
          id: "reservation-1",
          apartmentId: "apt-1",
          startsAtIso: "2026-07-20T12:00:00-03:00",
          estimatedMinutes: 120,
        },
        updateReservation: async (row) => row,
        refundBalance: async (row) => row,
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Nao e possivel cancelar reserva de outro apartamento");
  });
});
