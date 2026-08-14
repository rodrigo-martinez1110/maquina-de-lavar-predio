import { describe, expect, it } from "vitest";
import {
  validateApartmentSettingsInput,
  validatePinResetInput,
  validateWeeklyBalanceAdjustmentInput,
} from "../../src/lib/domain/admin-apartments";

describe("admin apartment actions", () => {
  it("normalizes apartment settings from form values", () => {
    expect(
      validateApartmentSettingsInput({
        apartmentId: "apt-1",
        residentCount: "2",
        manualAdjustmentMinutes: "30",
      }),
    ).toEqual({
      apartmentId: "apt-1",
      residentCount: 2,
      manualAdjustmentMinutes: 30,
    });
  });

  it("rejects invalid resident count", () => {
    expect(() =>
      validateApartmentSettingsInput({
        apartmentId: "apt-1",
        residentCount: "4",
        manualAdjustmentMinutes: "0",
      }),
    ).toThrow("Quantidade de moradores invalida");
  });

  it("requires numeric pins between four and eight digits", () => {
    expect(validatePinResetInput({ apartmentId: "apt-1", pin: "123456" })).toEqual({
      apartmentId: "apt-1",
      pin: "123456",
    });

    expect(() => validatePinResetInput({ apartmentId: "apt-1", pin: "12a4" })).toThrow(
      "PIN invalido",
    );
  });
  it("normalizes a positive current-week balance adjustment", () => {
    expect(
      validateWeeklyBalanceAdjustmentInput({
        apartmentId: "apt-1",
        minutes: "60",
        reason: "Compensacao por atraso",
      }),
    ).toEqual({
      apartmentId: "apt-1",
      minutes: 60,
      reason: "Compensacao por atraso",
    });
  });

  it("allows negative current-week balance adjustments", () => {
    expect(
      validateWeeklyBalanceAdjustmentInput({
        apartmentId: "apt-1",
        minutes: "-30",
        reason: "Correcao de credito",
      }).minutes,
    ).toBe(-30);
  });

  it("rejects current-week adjustments outside 30-minute blocks", () => {
    expect(() =>
      validateWeeklyBalanceAdjustmentInput({
        apartmentId: "apt-1",
        minutes: "15",
        reason: "Correcao",
      }),
    ).toThrow("Ajuste de saldo invalido");
  });

  it("requires a reason for current-week adjustments", () => {
    expect(() =>
      validateWeeklyBalanceAdjustmentInput({
        apartmentId: "apt-1",
        minutes: "30",
        reason: " ",
      }),
    ).toThrow("Motivo obrigatorio");
  });
});
