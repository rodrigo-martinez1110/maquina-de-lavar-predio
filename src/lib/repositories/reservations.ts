import type { ReservationWindow } from "../domain/reservations";
import { availableMinutesFromWeeklyBalance, weekStartForReservation } from "../domain/weekly-balances";
import { createServiceSupabaseClient } from "../supabase/server";

export async function findReservationConflicts(window: ReservationWindow): Promise<Array<{ id: string }>> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .lt("starts_at", window.endIso)
    .gt("ends_at", window.startIso)
    .in("status", ["reserved", "in_use", "late"]);

  if (error) throw error;

  return data ?? [];
}

export async function insertReservation(row: {
  apartmentId: string;
  kind: "wash" | "dry" | "wash_dry" | "custom";
  startIso: string;
  endIso: string;
  estimatedMinutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      apartment_id: row.apartmentId,
      kind: row.kind,
      starts_at: row.startIso,
      ends_at: row.endIso,
      estimated_minutes: row.estimatedMinutes,
    })
    .select("id")
    .single();

  if (error) throw error;

  return data;
}

export async function getAvailableReservationMinutes(input: { apartmentId: string; startIso: string }): Promise<number> {
  const supabase = createServiceSupabaseClient();
  const weekStart = weekStartForReservation(input.startIso);
  const { data, error } = await supabase
    .from("weekly_balances")
    .select(
      "quota_minutes, manual_adjustment_minutes, received_minutes, sent_minutes, reserved_minutes, refunded_minutes, penalty_minutes",
    )
    .eq("apartment_id", input.apartmentId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) throw error;

  return availableMinutesFromWeeklyBalance(data);
}
