import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_ERROR_MESSAGE,
  createApartmentLoginRateLimiter,
  verifyApartmentPin,
} from "../../src/lib/actions/apartment-auth";

const matchingApartment = {
  id: "apt-1",
  number: 1,
  pinHash: "$2b$10$5xs8EjVtYNCeILThCyGQ4.Kn.4foXaqIOnNcklnCJqxeg3FjKkQEa",
};

describe("apartment auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unknown apartment", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 99,
        pin: "1234",
        findApartmentByNumber: async () => null,
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGE);
  });

  it("rejects a wrong pin", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: "9999",
        findApartmentByNumber: async () => matchingApartment,
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGE);
  });

  it("rejects malformed apartment and pin input generically", async () => {
    const findApartmentByNumber = vi.fn(async () => matchingApartment);

    await expect(
      verifyApartmentPin({
        apartmentNumber: 15,
        pin: "1234",
        findApartmentByNumber,
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGE);

    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: "1234567890123",
        findApartmentByNumber,
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGE);

    expect(findApartmentByNumber).not.toHaveBeenCalled();
  });

  it("accepts a matching pin", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: " 1234 ",
        findApartmentByNumber: async () => matchingApartment,
      }),
    ).resolves.toEqual({ apartmentId: "apt-1", apartmentNumber: 1 });
  });

  it("rate limits before bcrypt comparison after the threshold", async () => {
    const rateLimiter = createApartmentLoginRateLimiter({
      maxAttempts: 2,
      windowMs: 60_000,
      blockMs: 60_000,
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(
        verifyApartmentPin({
          apartmentNumber: 1,
          pin: "9999",
          requestIp: "203.0.113.10",
          findApartmentByNumber: async () => matchingApartment,
          rateLimiter,
        }),
      ).rejects.toThrow(AUTH_ERROR_MESSAGE);
    }

    const findApartmentByNumber = vi.fn(async () => matchingApartment);

    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: "1234",
        requestIp: "203.0.113.10",
        findApartmentByNumber,
        rateLimiter,
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGE);

    expect(findApartmentByNumber).not.toHaveBeenCalled();
  });
});
