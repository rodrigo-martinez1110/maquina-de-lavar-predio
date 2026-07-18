import { describe, expect, it } from "vitest";
import { verifyApartmentPin } from "../../src/lib/actions/apartment-auth";

describe("apartment auth", () => {
  it("rejects unknown apartment", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 99,
        pin: "1234",
        findApartmentByNumber: async () => null,
      }),
    ).rejects.toThrow("Apartamento ou PIN invalido");
  });

  it("accepts a matching pin", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: "1234",
        findApartmentByNumber: async () => ({
          id: "apt-1",
          number: 1,
          pinHash: "$2b$10$5xs8EjVtYNCeILThCyGQ4.Kn.4foXaqIOnNcklnCJqxeg3FjKkQEa",
        }),
      }),
    ).resolves.toEqual({ apartmentId: "apt-1", apartmentNumber: 1 });
  });
});
