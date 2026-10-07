import { describe, expect, it } from "vitest";
import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "../../src/lib/domain/time";

describe("time domain", () => {
  it("allows reservations between 08:00 and 23:00", () => {
    expect(() => assertReservableWindow("2026-07-20T08:00:00-03:00", "2026-07-20T10:00:00-03:00")).not.toThrow();
  });

  it("reports an end-time error for 23:30 in the reservation civil time", () => {
    expect(() => assertReservableWindow("2026-07-20T22:30:00-03:00", "2026-07-20T23:30:00-03:00")).toThrow("Reservas devem terminar ate 23:00");
  });

  it("rejects 07:30 in the reservation civil time", () => {
    expect(() => assertReservableWindow("2026-07-20T07:30:00-03:00", "2026-07-20T08:30:00-03:00")).toThrow("Reservas devem comecar a partir de 08:00");
  });

  it("allows the 08:00 start boundary", () => {
    expect(() => assertReservableWindow("2026-07-20T08:00:00-03:00", "2026-07-20T09:00:00-03:00")).not.toThrow();
  });

  it("allows the 23:00 end boundary", () => {
    expect(() => assertReservableWindow("2026-07-20T22:00:00-03:00", "2026-07-20T23:00:00-03:00")).not.toThrow();
  });

  it("blocks reservations that cross into the next local date", () => {
    expect(() => assertReservableWindow("2026-07-20T22:00:00-03:00", "2026-07-21T00:00:00-03:00")).toThrow("Reservas devem terminar ate 23:00");
  });

  it("throws a deterministic error for invalid reservation dates", () => {
    expect(() => assertReservableWindow("invalid", "2026-07-20T09:00:00-03:00")).toThrow("Data invalida");
  });

  it("rounds extra usage up to 30 minute blocks", () => {
    expect(ceilToThirtyMinuteBlocks(1)).toBe(30);
    expect(ceilToThirtyMinuteBlocks(31)).toBe(60);
  });

  it("calculates minutes between timestamps", () => {
    expect(minutesBetween("2026-07-20T10:00:00-03:00", "2026-07-20T11:30:00-03:00")).toBe(90);
  });
});
