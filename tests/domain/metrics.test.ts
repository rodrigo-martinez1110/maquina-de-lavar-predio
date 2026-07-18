import { describe, expect, it } from "vitest";
import {
  getPeakSlots,
  rankApartmentUsage,
  summarizeUsageTotals,
} from "../../src/lib/domain/metrics";

describe("metrics", () => {
  it("sorts slots by usage descending", () => {
    expect(
      getPeakSlots([
        { dayOfWeek: 1, hour: 10, usedMinutes: 60 },
        { dayOfWeek: 2, hour: 19, usedMinutes: 180 },
      ]),
    ).toEqual([
      { dayOfWeek: 2, hour: 19, usedMinutes: 180 },
      { dayOfWeek: 1, hour: 10, usedMinutes: 60 },
    ]);
  });

  it("summarizes actual minutes before estimated minutes", () => {
    expect(
      summarizeUsageTotals([
        { apartmentNumber: 1, estimatedMinutes: 120, actualMinutes: 90, status: "finished" },
        { apartmentNumber: 2, estimatedMinutes: 60, actualMinutes: null, status: "reserved" },
        { apartmentNumber: 3, estimatedMinutes: 30, actualMinutes: 45, status: "late" },
      ]),
    ).toEqual({ totalMinutes: 195, reservationCount: 3, lateCount: 1 });
  });

  it("ranks apartment usage by used minutes", () => {
    expect(
      rankApartmentUsage([
        { apartmentNumber: 2, estimatedMinutes: 60, actualMinutes: null, status: "reserved" },
        { apartmentNumber: 1, estimatedMinutes: 120, actualMinutes: 90, status: "finished" },
        { apartmentNumber: 2, estimatedMinutes: 30, actualMinutes: 20, status: "finished" },
      ]),
    ).toEqual([
      { apartmentNumber: 1, usedMinutes: 90 },
      { apartmentNumber: 2, usedMinutes: 80 },
    ]);
  });
});
