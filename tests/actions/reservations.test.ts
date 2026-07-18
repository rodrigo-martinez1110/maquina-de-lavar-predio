import { describe, expect, it } from "vitest";
import {
  availableMinutesFromWeeklyBalance,
  createReservationActionUseCase,
  createReservationUseCase,
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

  it("derives available minutes from server dependency instead of form data", async () => {
    const formData = new FormData();
    formData.set("kind", "wash");
    formData.set("startIso", "2026-07-20T10:00:00-03:00");
    formData.set("endIso", "2026-07-20T11:00:00-03:00");
    formData.set("availableMinutes", "9999");

    await expect(
      createReservationActionUseCase({
        apartmentId: "apt-1",
        formData,
        getAvailableMinutes: async () => 0,
        findConflicts: async () => [],
        insertReservation: async () => ({ id: "res-1" }),
        auditReservationCreated: async () => undefined,
      }),
    ).rejects.toThrow("Saldo insuficiente");
  });

  it("audits reservation creation with server-side context", async () => {
    const formData = new FormData();
    formData.set("kind", "wash_dry");
    formData.set("startIso", "2026-07-20T10:00:00-03:00");
    formData.set("endIso", "2026-07-20T12:00:00-03:00");

    const audits: Array<{
      apartmentId: string;
      reservationId: string;
      metadata: { kind: string; startIso: string; endIso: string; estimatedMinutes: number };
    }> = [];

    await createReservationActionUseCase({
      apartmentId: "apt-1",
      formData,
      getAvailableMinutes: async () => 180,
      findConflicts: async () => [],
      insertReservation: async () => ({ id: "res-1" }),
      auditReservationCreated: async (entry) => {
        audits.push(entry);
      },
    });

    expect(audits).toEqual([
      {
        apartmentId: "apt-1",
        reservationId: "res-1",
        metadata: {
          kind: "wash_dry",
          startIso: "2026-07-20T10:00:00-03:00",
          endIso: "2026-07-20T12:00:00-03:00",
          estimatedMinutes: 120,
        },
      },
    ]);
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
});
