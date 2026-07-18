import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { setApartmentSession } from "../auth/apartment-session";

export const AUTH_ERROR_MESSAGE = "Apartamento ou PIN invalido";

const CredentialsSchema = z.object({
  apartmentNumber: z.coerce.number().int().min(1).max(14),
  pin: z.string().trim().min(4).max(12),
});

export type ApartmentForAuth = {
  id: string;
  number: number;
  pinHash: string;
};

export type LoginApartmentState = {
  error?: string;
};

type RateLimitEntry = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

type RateLimitOptions = {
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
  now?: () => number;
};

export type ApartmentLoginRateLimiter = {
  assertAllowed: (apartmentNumber: number, requestIp?: string | null) => void;
  reset: (apartmentNumber: number, requestIp?: string | null) => void;
};

export function createApartmentLoginRateLimiter(options: RateLimitOptions): ApartmentLoginRateLimiter {
  const attempts = new Map<string, RateLimitEntry>();
  const now = options.now ?? Date.now;

  function keyFor(apartmentNumber: number, requestIp?: string | null) {
    return requestIp ? `${apartmentNumber}:${requestIp}` : String(apartmentNumber);
  }

  return {
    assertAllowed(apartmentNumber, requestIp) {
      const key = keyFor(apartmentNumber, requestIp);
      const currentTime = now();
      const current = attempts.get(key);

      if (current?.blockedUntil && current.blockedUntil > currentTime) {
        throw new Error(AUTH_ERROR_MESSAGE);
      }

      const entry =
        current && currentTime - current.windowStartedAt < options.windowMs
          ? current
          : { attempts: 0, windowStartedAt: currentTime, blockedUntil: null };

      entry.attempts += 1;
      if (entry.attempts > options.maxAttempts) {
        entry.blockedUntil = currentTime + options.blockMs;
        attempts.set(key, entry);
        throw new Error(AUTH_ERROR_MESSAGE);
      }

      attempts.set(key, entry);
    },
    reset(apartmentNumber, requestIp) {
      attempts.delete(keyFor(apartmentNumber, requestIp));
    },
  };
}

const apartmentLoginRateLimiter = createApartmentLoginRateLimiter({
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000,
  blockMs: 60 * 1000,
});

export async function verifyApartmentPin(input: {
  apartmentNumber: number | string;
  pin: string;
  findApartmentByNumber: (number: number) => Promise<ApartmentForAuth | null>;
  requestIp?: string | null;
  rateLimiter?: ApartmentLoginRateLimiter;
}) {
  const credentials = CredentialsSchema.safeParse({
    apartmentNumber: input.apartmentNumber,
    pin: input.pin,
  });
  if (!credentials.success) throw new Error(AUTH_ERROR_MESSAGE);

  const rateLimiter = input.rateLimiter ?? apartmentLoginRateLimiter;
  rateLimiter.assertAllowed(credentials.data.apartmentNumber, input.requestIp);

  const apartment = await input.findApartmentByNumber(credentials.data.apartmentNumber);
  if (!apartment) throw new Error(AUTH_ERROR_MESSAGE);

  const ok = await bcrypt.compare(credentials.data.pin, apartment.pinHash);
  if (!ok) throw new Error(AUTH_ERROR_MESSAGE);

  rateLimiter.reset(credentials.data.apartmentNumber, input.requestIp);
  return { apartmentId: apartment.id, apartmentNumber: apartment.number };
}

function requestIpFromHeaders(headerStore: Headers) {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip");
}

export async function loginApartment(_previousState: LoginApartmentState, formData: FormData): Promise<LoginApartmentState> {
  "use server";

  const pin = String(formData.get("pin") ?? "");
  const apartmentNumber = String(formData.get("apartmentNumber") ?? "");
  const { findApartmentByNumber } = await import("../repositories/apartments");
  const requestIp = requestIpFromHeaders(await headers());

  try {
    const session = await verifyApartmentPin({ apartmentNumber, pin, findApartmentByNumber, requestIp });
    await setApartmentSession(session);
  } catch (error) {
    if (error instanceof Error && error.message === AUTH_ERROR_MESSAGE) {
      return { error: AUTH_ERROR_MESSAGE };
    }
    throw error;
  }

  redirect("/");
}
