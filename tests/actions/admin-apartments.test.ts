import { describe, expect, it } from "vitest";
import {
  validateApartmentSettingsInput,
  validatePinResetInput,
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
});
