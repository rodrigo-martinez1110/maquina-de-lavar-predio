import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "../env";

const COOKIE_NAME = "apartment_session";

export type ApartmentSession = {
  apartmentId: string;
  apartmentNumber: number;
};

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
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getApartmentSession(): Promise<ApartmentSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !signaturesMatch(signature, sign(payload))) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ApartmentSession;
  } catch {
    return null;
  }
}
