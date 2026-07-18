import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "../env";

const COOKIE_NAME = "apartment_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type ApartmentSession = {
  apartmentId: string;
  apartmentNumber: number;
};

const StoredApartmentSessionSchema = z.object({
  apartmentId: z.string().min(1),
  apartmentNumber: z.number().int().min(1).max(14),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
});

function sign(value: string) {
  return createHmac("sha256", env.APARTMENT_SESSION_SECRET).update(value).digest("base64url");
}

function signaturesMatch(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export async function setApartmentSession(session: ApartmentSession) {
  const cookieStore = await cookies();
  const iat = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      ...session,
      iat,
      exp: iat + SESSION_MAX_AGE_SECONDS,
    }),
  ).toString("base64url");
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getApartmentSession(): Promise<ApartmentSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature || !signaturesMatch(signature, sign(payload))) return null;

  try {
    const parsed = StoredApartmentSessionSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success || parsed.data.exp <= Math.floor(Date.now() / 1000) || parsed.data.iat > parsed.data.exp) {
      return null;
    }

    return { apartmentId: parsed.data.apartmentId, apartmentNumber: parsed.data.apartmentNumber };
  } catch {
    return null;
  }
}
