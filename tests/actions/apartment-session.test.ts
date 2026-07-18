import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
const setCookieOptions = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      cookieJar.set(name, value);
      setCookieOptions.set(name, options);
    },
  })),
}));

import { getApartmentSession, setApartmentSession } from "../../src/lib/auth/apartment-session";

describe("apartment session", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.APARTMENT_SESSION_SECRET = "test-secret-at-least-16";
    cookieJar.clear();
    setCookieOptions.clear();
    vi.useRealTimers();
  });

  it("sets an expiring signed cookie and reads the trusted session", async () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00.000Z"));

    await setApartmentSession({ apartmentId: "apt-1", apartmentNumber: 1 });

    expect(setCookieOptions.get("apartment_session")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    await expect(getApartmentSession()).resolves.toEqual({ apartmentId: "apt-1", apartmentNumber: 1 });
  });

  it("returns null for a tampered signed cookie", async () => {
    await setApartmentSession({ apartmentId: "apt-1", apartmentNumber: 1 });
    const value = cookieJar.get("apartment_session");
    expect(value).toBeTruthy();

    const [, signature] = value!.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        apartmentId: "apt-2",
        apartmentNumber: 2,
        iat: 1_785_025_600,
        exp: 1_785_630_400,
      }),
    ).toString("base64url");
    cookieJar.set("apartment_session", `${tamperedPayload}.${signature}`);

    await expect(getApartmentSession()).resolves.toBeNull();
  });

  it("returns null for an expired signed cookie", async () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00.000Z"));
    await setApartmentSession({ apartmentId: "apt-1", apartmentNumber: 1 });

    vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"));

    await expect(getApartmentSession()).resolves.toBeNull();
  });
});
