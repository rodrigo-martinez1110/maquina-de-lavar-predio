import { readFileSync } from "fs";
import { describe, expect, it, vi } from "vitest";
import {
  availableMinutesFromWeeklyBalance,
  createReservationActionUseCase,
  createReservationUseCase,
  mapReservationDatabaseError,
} from "../../src/lib/actions/reservations";

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

  it("rejects invalid kind before repository calls", async () => {
    const formData = new FormData();
    formData.set("kind", "admin");
    formData.set("startIso", "2026-07-20T10:00:00-03:00");
    formData.set("endIso", "2026-07-20T11:00:00-03:00");
    const createReservationAtomically = vi.fn(async () => ({ id: "res-1" }));

    await expect(
      createReservationActionUseCase({
        apartmentId: "apt-1",
        formData,
        createReservationAtomically,
      }),
    ).rejects.toThrow("Tipo de reserva invalido");

    expect(createReservationAtomically).not.toHaveBeenCalled();
  });

  it("uses atomic reservation creation instead of separate balance and audit steps", async () => {
    const formData = new FormData();
    formData.set("kind", "wash_dry");
    formData.set("startIso", "2026-07-20T10:00:00-03:00");
    formData.set("endIso", "2026-07-20T12:00:00-03:00");
    formData.set("availableMinutes", "0");

    const createReservationAtomically = vi.fn(async () => ({ id: "res-1" }));

    const result = await createReservationActionUseCase({
      apartmentId: "apt-1",
      formData,
      createReservationAtomically,
    });

    expect(result).toEqual({ id: "res-1" });
    expect(createReservationAtomically).toHaveBeenCalledWith({
      apartmentId: "apt-1",
      kind: "wash_dry",
      startIso: "2026-07-20T10:00:00-03:00",
      endIso: "2026-07-20T12:00:00-03:00",
      estimatedMinutes: 120,
    });
  });

  it("treats a missing weekly balance as zero available minutes", () => {
    expect(availableMinutesFromWeeklyBalance(null)).toBe(0);
  });

  it("includes manual adjustments in available weekly balance", () => {
    const baseBalance = {
      quota_minutes: 120,
      received_minutes: 30,
      sent_minutes: 15,
      reserved_minutes: 60,
      refunded_minutes: 10,
      penalty_minutes: 5,
    };

    expect(availableMinutesFromWeeklyBalance({ ...baseBalance, manual_adjustment_minutes: 20 })).toBe(100);
    expect(availableMinutesFromWeeklyBalance({ ...baseBalance, manual_adjustment_minutes: -30 })).toBe(50);
  });

  it("maps reservation overlap database errors to the domain message", () => {
    expect(
      mapReservationDatabaseError({
        code: "23P01",
        message: 'conflicting key value violates exclusion constraint "reservations_active_no_overlap"',
      }),
    ).toEqual(new Error("Horario indisponivel"));
  });

  it("defines atomic reservation SQL that locks and increments weekly balance", () => {
    const sql = readFileSync("supabase/migrations/0002_reservation_creation_rpc.sql", "utf8");

    expect(sql).toContain("create or replace function create_reservation_with_balance");
    expect(sql).toContain("for update");
    expect(sql).toContain("reserved_minutes = reserved_minutes + p_estimated_minutes");
    expect(sql).toContain("insert into audit_logs");
    expect(sql).toContain("to service_role");
  });
});
