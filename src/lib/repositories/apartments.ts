import { createServiceSupabaseClient } from "../supabase/server";
import type { ApartmentForAuth } from "../actions/apartment-auth";

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
