import { describe, expect, it } from "vitest";
import { parseEnv, parsePublicEnv } from "../../src/lib/env";

describe("env", () => {
  it("requires Supabase URL and keys", () => {
    expect(() => parseEnv({})).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("parses required values", () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        APARTMENT_SESSION_SECRET: "a-long-random-secret",
        ADMIN_PASSWORD: "another-secret",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      APARTMENT_SESSION_SECRET: "a-long-random-secret",
      ADMIN_PASSWORD: "another-secret",
    });
  });

  it("parses public values without private secrets", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
  });

  it("rejects invalid public Supabase URLs", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects short apartment session secrets", () => {
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        APARTMENT_SESSION_SECRET: "short",
        ADMIN_PASSWORD: "another-secret",
      }),
    ).toThrow("APARTMENT_SESSION_SECRET");
  });
});
