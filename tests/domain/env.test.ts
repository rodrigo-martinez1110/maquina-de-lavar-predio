import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/lib/env";

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
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      APARTMENT_SESSION_SECRET: "a-long-random-secret",
    });
  });
});
