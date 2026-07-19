import { describe, expect, it } from "vitest";
import { buildDaySlots, buildFreeWindows } from "../../src/lib/domain/schedule";

describe("schedule domain", () => {
  it("builds every reservable 30 minute slot in the day", () => {
    const slots = buildDaySlots({ date: "2026-07-19", reservations: [] });

    expect(slots).toHaveLength(32);
    expect(slots[0]).toMatchObject({ time: "07:00", status: "free" });
    expect(slots.at(-1)).toMatchObject({ time: "22:30", status: "free" });
  });

  it("marks slots covered by another apartment reservation as busy", () => {
    const slots = buildDaySlots({
      date: "2026-07-19",
      reservations: [
        {
          id: "reservation-1",
          apartmentNumber: 1,
          kind: "wash_dry",
          startsAtIso: "2026-07-19T10:00:00-03:00",
          endsAtIso: "2026-07-19T11:00:00-03:00",
        },
      ],
    });

    expect(slots.find((slot) => slot.time === "10:00")).toMatchObject({
      status: "busy",
      apartmentNumber: 1,
      reservationId: "reservation-1",
    });
    expect(slots.find((slot) => slot.time === "10:30")).toMatchObject({
      status: "busy",
      apartmentNumber: 1,
      reservationId: "reservation-1",
    });
    expect(slots.find((slot) => slot.time === "11:00")).toMatchObject({
      status: "free",
    });
  });

  it("groups adjacent free slots into readable windows", () => {
    const slots = buildDaySlots({
      date: "2026-07-19",
      reservations: [
        {
          id: "reservation-1",
          apartmentNumber: 1,
          kind: "wash_dry",
          startsAtIso: "2026-07-19T10:00:00-03:00",
          endsAtIso: "2026-07-19T11:00:00-03:00",
        },
      ],
    });

    expect(buildFreeWindows(slots)).toEqual([
      { startTime: "07:00", endTime: "10:00", durationMinutes: 180 },
      { startTime: "11:00", endTime: "23:00", durationMinutes: 720 },
    ]);
  });
});
