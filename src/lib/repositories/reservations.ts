import type { ReservationWindow } from "../domain/reservations";
import type { ScheduleReservation } from "../domain/schedule";
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

export async function listReservationsForDay(date: string): Promise<ScheduleReservation[]> {
  const supabase = createServiceSupabaseClient();
  const dayStartIso = `${date}T00:00:00-03:00`;
  const nextDate = new Date(`${date}T12:00:00-03:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(nextDate);
  const dayEndIso = `${nextDateText}T00:00:00-03:00`;

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, apartment_id, kind, starts_at, ends_at")
    .lt("starts_at", dayEndIso)
    .gt("ends_at", dayStartIso)
    .in("status", ["reserved", "in_use", "late"])
    .order("starts_at", { ascending: true });

  if (error) throw error;
  const reservationRows = reservations ?? [];
  if (reservationRows.length === 0) return [];

  const apartmentIds = [...new Set(reservationRows.map((reservation) => reservation.apartment_id))];
  const { data: apartments, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id, number")
    .in("id", apartmentIds);

  if (apartmentsError) throw apartmentsError;

  const apartmentNumberById = new Map(
    (apartments ?? []).map((apartment) => [apartment.id, apartment.number]),
  );

  return reservationRows.map((reservation) => ({
    id: reservation.id,
    apartmentNumber: apartmentNumberById.get(reservation.apartment_id) ?? 0,
    kind: reservation.kind,
    startsAtIso: reservation.starts_at,
    endsAtIso: reservation.ends_at,
  }));
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

export async function createReservationWithBalance(row: {
  apartmentId: string;
  kind: "wash" | "dry" | "wash_dry" | "custom";
  startIso: string;
  endIso: string;
  estimatedMinutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("create_reservation_with_balance", {
    p_apartment_id: row.apartmentId,
    p_kind: row.kind,
    p_starts_at: row.startIso,
    p_ends_at: row.endIso,
    p_actor_metadata: {
      kind: row.kind,
      startIso: row.startIso,
      endIso: row.endIso,
    },
  });

  if (error) throw error;

  return { id: data };
}

export async function updateReservationStatus(
  id: string,
  status: "cancelled" | "released" | "finished" | "late",
) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
