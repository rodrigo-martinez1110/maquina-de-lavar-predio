import { describe, expect, it } from "vitest";
import {
  assertReservationAllowed,
  overlapsReservation,
  refundForEarlyRelease,
  penaltyForLateFinish,
} from "../../src/lib/domain/reservations";

describe("reservation domain", () => {
  it("blocks reservations shorter than 30 minutes", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T10:15:00-03:00",
        availableMinutes: 120,
        existingDailyReservedMinutes: 0,
      }),
    ).toThrow("Reserva minima de 30 minutos");
  });

  it("blocks reservations longer than 4 hours", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T14:30:00-03:00",
        availableMinutes: 300,
        existingDailyReservedMinutes: 0,
      }),
    ).toThrow("Reserva maxima de 4 horas");
  });

  it("blocks reservations that are not 30 minute blocks", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T10:45:00-03:00",
        availableMinutes: 120,
        existingDailyReservedMinutes: 0,
      }),
    ).toThrow("Reservas devem usar blocos de 30 minutos");
  });

  it("blocks reservations without enough balance", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T12:00:00-03:00",
        availableMinutes: 60,
        existingDailyReservedMinutes: 0,
      }),
    ).toThrow("Saldo insuficiente");
  });

  it("allows reservations that reach exactly 7h in the same day", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T15:00:00-03:00",
        endIso: "2026-07-20T17:00:00-03:00",
        availableMinutes: 300,
        existingDailyReservedMinutes: 300,
      }),
    ).not.toThrow();
  });

  it("blocks reservations above 7h in the same day", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T15:00:00-03:00",
        endIso: "2026-07-20T17:00:00-03:00",
        availableMinutes: 300,
        existingDailyReservedMinutes: 360,
      }),
    ).toThrow("Limite diario de 7h atingido");
  });

  it("detects overlapping reservations", () => {
    expect(
      overlapsReservation(
        { startIso: "2026-07-20T10:00:00-03:00", endIso: "2026-07-20T12:00:00-03:00" },
        { startIso: "2026-07-20T11:30:00-03:00", endIso: "2026-07-20T13:00:00-03:00" },
      ),
    ).toBe(true);
  });

  it("refunds unused minutes when machine is released early", () => {
    expect(
      refundForEarlyRelease({
        reservedEndIso: "2026-07-20T12:00:00-03:00",
        releasedAtIso: "2026-07-20T11:10:00-03:00",
      }),
    ).toBe(30);
  });

  it("charges late finish rounded up to 30 minute blocks", () => {
    expect(
      penaltyForLateFinish({
        reservedEndIso: "2026-07-20T12:00:00-03:00",
        finishedAtIso: "2026-07-20T12:01:00-03:00",
      }),
    ).toBe(30);
  });
});
