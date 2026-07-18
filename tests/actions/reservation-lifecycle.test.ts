import { describe, expect, it } from "vitest";
import {
  calculateCancellationRefund,
  calculateLatePenalty,
  calculateReleaseRefund,
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
});
