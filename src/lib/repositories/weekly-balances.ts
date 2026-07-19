import { calculateWeeklyQuotaMinutes } from "../domain/credits";
import {
  availableMinutesFromWeeklyBalanceOrQuota,
  weekStartForReservation,
} from "../domain/weekly-balances";
import { createServiceSupabaseClient } from "../supabase/server";

async function ensureWeeklyBalance(input: { apartmentId: string; weekStart: string }) {
  const supabase = createServiceSupabaseClient();
  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("resident_count, manual_adjustment_minutes")
    .eq("id", input.apartmentId)
    .single();

  if (apartmentError) throw apartmentError;

  const quotaMinutes = calculateWeeklyQuotaMinutes({
    residentCount: apartment.resident_count,
    manualAdjustmentMinutes: 0,
  });

  const { error } = await supabase
    .from("weekly_balances")
    .insert({
      apartment_id: input.apartmentId,
      week_start: input.weekStart,
      quota_minutes: quotaMinutes,
      manual_adjustment_minutes: apartment.manual_adjustment_minutes,
    })
    .select("id")
    .single();

  if (error && error.code !== "23505") throw error;
}

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

export async function applyAcceptedTransferToBalances(input: {
  fromApartmentId: string;
  toApartmentId: string;
  weekStart: string;
  minutes: number;
}) {
  const supabase = createServiceSupabaseClient();

  await ensureWeeklyBalance({
    apartmentId: input.fromApartmentId,
    weekStart: input.weekStart,
  });
  await ensureWeeklyBalance({
    apartmentId: input.toApartmentId,
    weekStart: input.weekStart,
  });

  const { data: fromBalance, error: fromError } = await supabase
    .from("weekly_balances")
    .select("id, sent_minutes")
    .eq("apartment_id", input.fromApartmentId)
    .eq("week_start", input.weekStart)
    .single();
  if (fromError) throw fromError;

  const { data: toBalance, error: toError } = await supabase
    .from("weekly_balances")
    .select("id, received_minutes")
    .eq("apartment_id", input.toApartmentId)
    .eq("week_start", input.weekStart)
    .single();
  if (toError) throw toError;

  const { error: sentError } = await supabase
    .from("weekly_balances")
    .update({
      sent_minutes: fromBalance.sent_minutes + input.minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fromBalance.id);
  if (sentError) throw sentError;

  const { error: receivedError } = await supabase
    .from("weekly_balances")
    .update({
      received_minutes: toBalance.received_minutes + input.minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", toBalance.id);
  if (receivedError) throw receivedError;
}

export async function refundWeeklyBalanceForReservation(input: {
  apartmentId: string;
  startIso: string;
  minutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const weekStart = weekStartForReservation(input.startIso);
  const { data: balance, error: balanceError } = await supabase
    .from("weekly_balances")
    .select("id, refunded_minutes")
    .eq("apartment_id", input.apartmentId)
    .eq("week_start", weekStart)
    .single();

  if (balanceError) throw balanceError;

  const { error } = await supabase
    .from("weekly_balances")
    .update({
      refunded_minutes: balance.refunded_minutes + input.minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", balance.id);

  if (error) throw error;
}
