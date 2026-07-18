"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { setApartmentSession } from "../auth/apartment-session";

export type ApartmentForAuth = {
  id: string;
  number: number;
  pinHash: string;
};

export async function verifyApartmentPin(input: {
  apartmentNumber: number;
  pin: string;
  findApartmentByNumber: (number: number) => Promise<ApartmentForAuth | null>;
}) {
  const apartment = await input.findApartmentByNumber(input.apartmentNumber);
  if (!apartment) throw new Error("Apartamento ou PIN invalido");

  const ok = await bcrypt.compare(input.pin, apartment.pinHash);
  if (!ok) throw new Error("Apartamento ou PIN invalido");

  return { apartmentId: apartment.id, apartmentNumber: apartment.number };
}

export async function loginApartment(formData: FormData) {
  const { findApartmentByNumber } = await import("../repositories/apartments");
  const apartmentNumber = Number(formData.get("apartmentNumber"));
  const pin = String(formData.get("pin") ?? "");
  const session = await verifyApartmentPin({ apartmentNumber, pin, findApartmentByNumber });
  await setApartmentSession(session);
  redirect("/");
}
