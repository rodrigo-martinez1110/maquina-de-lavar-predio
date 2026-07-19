import { createServiceSupabaseClient } from "../supabase/server";
import type { ApartmentForAuth } from "../actions/apartment-auth";

export type ApartmentAdminRow = {
  id: string;
  number: number;
  residentCount: number;
  manualAdjustmentMinutes: number;
  isActive: boolean;
};

export async function findApartmentByNumber(number: number): Promise<ApartmentForAuth | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("id, number, pin_hash")
    .eq("number", number)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return { id: data.id, number: data.number, pinHash: data.pin_hash };
}

export async function findApartmentPinHashById(apartmentId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("pin_hash")
    .eq("id", apartmentId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return data.pin_hash;
}

export async function listApartmentsForAdmin(): Promise<ApartmentAdminRow[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("id, number, resident_count, manual_adjustment_minutes, is_active")
    .order("number", { ascending: true });

  if (error) throw error;

  return data.map((apartment) => ({
    id: apartment.id,
    number: apartment.number,
    residentCount: apartment.resident_count,
    manualAdjustmentMinutes: apartment.manual_adjustment_minutes,
    isActive: apartment.is_active,
  }));
}

export async function updateApartmentSettings(input: {
  apartmentId: string;
  residentCount?: number;
  manualAdjustmentMinutes?: number;
  pinHash?: string;
}) {
  const supabase = createServiceSupabaseClient();
  const patch: {
    resident_count?: number;
    manual_adjustment_minutes?: number;
    pin_hash?: string;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.residentCount !== undefined) patch.resident_count = input.residentCount;
  if (input.manualAdjustmentMinutes !== undefined) {
    patch.manual_adjustment_minutes = input.manualAdjustmentMinutes;
  }
  if (input.pinHash !== undefined) patch.pin_hash = input.pinHash;

  const { error } = await supabase.from("apartments").update(patch).eq("id", input.apartmentId);

  if (error) throw error;
}

export async function updateApartmentPinHash(apartmentId: string, pinHash: string) {
  await updateApartmentSettings({ apartmentId, pinHash });
}
