import { describe, expect, it } from "vitest";
import { availableMinutesFromWeeklyBalanceOrQuota } from "../../src/lib/domain/weekly-balances";

describe("weekly balance domain", () => {
  it("uses the apartment quota when no weekly balance row exists yet", () => {
    expect(
      availableMinutesFromWeeklyBalanceOrQuota({
        balance: null,
        defaultQuotaMinutes: 390,
      }),
    ).toBe(390);
  });

  it("uses the weekly balance when it already exists", () => {
    expect(
      availableMinutesFromWeeklyBalanceOrQuota({
        defaultQuotaMinutes: 390,
        balance: {
          quota_minutes: 390,
          manual_adjustment_minutes: 0,
          received_minutes: 30,
          sent_minutes: 60,
          reserved_minutes: 120,
          refunded_minutes: 30,
          penalty_minutes: 0,
        },
      }),
    ).toBe(270);
  });
});
