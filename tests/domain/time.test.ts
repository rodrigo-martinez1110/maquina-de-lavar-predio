import { describe, expect, it } from "vitest";
import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "../../src/lib/domain/time";

describe("time domain", () => {
  it("allows reservations between 07:00 and 23:00", () => {
    expect(() => assertReservableWindow("2026-07-20T07:00:00-03:00", "2026-07-20T09:00:00-03:00")).not.toThrow();
  });

  it("blocks reservations that end after 23:00", () => {
    expect(() => assertReservableWindow("2026-07-20T22:30:00-03:00", "2026-07-20T23:30:00-03:00")).toThrow("Reservas devem terminar ate 23:00");
  });

  it("blocks reservations before 07:00", () => {
    expect(() => assertReservableWindow("2026-07-20T06:30:00-03:00", "2026-07-20T07:30:00-03:00")).toThrow("Reservas devem comecar a partir de 07:00");
  });

  it("rounds extra usage up to 30 minute blocks", () => {
    expect(ceilToThirtyMinuteBlocks(1)).toBe(30);
    expect(ceilToThirtyMinuteBlocks(31)).toBe(60);
  });

  it("calculates minutes between timestamps", () => {
    expect(minutesBetween("2026-07-20T10:00:00-03:00", "2026-07-20T11:30:00-03:00")).toBe(90);
  });
});
