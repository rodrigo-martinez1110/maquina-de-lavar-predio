import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { changeApartmentPinUseCase } from "../../src/lib/actions/account";

describe("account actions", () => {
  it("changes the apartment PIN when current PIN is valid", async () => {
    const currentHash = await bcrypt.hash("1234", 4);
    const updatePinHash = vi.fn(async () => undefined);

    const result = await changeApartmentPinUseCase({
      apartmentId: "apt-1",
      currentPin: "1234",
      newPin: "749281",
      confirmPin: "749281",
      findApartmentPinHash: async () => currentHash,
      updatePinHash,
      hashPin: async (pin) => `hashed:${pin}`,
    });

    expect(result).toEqual({ ok: true });
    expect(updatePinHash).toHaveBeenCalledWith("apt-1", "hashed:749281");
  });

  it("rejects a mismatched confirmation", async () => {
    await expect(
      changeApartmentPinUseCase({
        apartmentId: "apt-1",
        currentPin: "1234",
        newPin: "749281",
        confirmPin: "749282",
        findApartmentPinHash: async () => "hash",
        updatePinHash: async () => undefined,
        hashPin: async (pin) => pin,
      }),
    ).rejects.toThrow("Confirmacao do PIN nao confere");
  });

  it("rejects a wrong current PIN", async () => {
    const currentHash = await bcrypt.hash("1234", 4);

    await expect(
      changeApartmentPinUseCase({
        apartmentId: "apt-1",
        currentPin: "9999",
        newPin: "749281",
        confirmPin: "749281",
        findApartmentPinHash: async () => currentHash,
        updatePinHash: async () => undefined,
        hashPin: async (pin) => pin,
      }),
    ).rejects.toThrow("PIN atual invalido");
  });
});
