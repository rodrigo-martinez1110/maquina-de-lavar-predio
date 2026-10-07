import { describe, expect, it } from "vitest";
import { calculateWeeklyQuotaMinutes, calculateAvailableMinutes } from "../../src/lib/domain/credits";

describe("credit domain", () => {
  it("gives 15h to one resident", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 1, manualAdjustmentMinutes: 0 })).toBe(900);
  });

  it("gives 15h to two residents", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 2, manualAdjustmentMinutes: 0 })).toBe(900);
  });

  it("applies manual admin adjustment", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 2, manualAdjustmentMinutes: 30 })).toBe(930);
  });

  it("calculates weekly available balance", () => {
    expect(
      calculateAvailableMinutes({
        quotaMinutes: 390,
        receivedMinutes: 120,
        sentMinutes: 60,
        reservedMinutes: 180,
        refundedMinutes: 30,
        penaltyMinutes: 30,
      }),
    ).toBe(270);
  });
});
