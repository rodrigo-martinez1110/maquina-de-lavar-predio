import { calculateWeeklyQuotaMinutes } from "../domain/credits";
import {
  availableMinutesFromWeeklyBalanceOrQuota,
  weekStartForReservation,
} from "../domain/weekly-balances";
import { createServiceSupabaseClient } from "../supabase/server";

export async function getApartmentWeeklyAvailableMinutes(input: {
  apartmentId: string;
  date: string;
}): Promise<number> {
  const supabase = createServiceSupabaseClient();
  const weekStart = weekStartForReservation(`${input.date}T12:00:00-03:00`);

  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("resident_count, manual_adjustment_minutes")
    .eq("id", input.apartmentId)
    .single();

  if (apartmentError) throw apartmentError;

  const defaultQuotaMinutes = calculateWeeklyQuotaMinutes({
    residentCount: apartment.resident_count,
    manualAdjustmentMinutes: apartment.manual_adjustment_minutes,
  });

  const { data: balance, error: balanceError } = await supabase
    .from("weekly_balances")
    .select(
      "quota_minutes, manual_adjustment_minutes, received_minutes, sent_minutes, reserved_minutes, refunded_minutes, penalty_minutes",
    )
    .eq("apartment_id", input.apartmentId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (balanceError) throw balanceError;

  return availableMinutesFromWeeklyBalanceOrQuota({
    balance,
    defaultQuotaMinutes,
  });
}
