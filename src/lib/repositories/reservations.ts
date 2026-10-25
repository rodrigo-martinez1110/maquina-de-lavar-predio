import type { ReservationWindow } from "../domain/reservations";
import type { ScheduleReservation } from "../domain/schedule";
import { availableMinutesFromWeeklyBalance, weekStartForReservation } from "../domain/weekly-balances";
import { refundWeeklyBalanceForReservation } from "./weekly-balances";
import { createServiceSupabaseClient } from "../supabase/server";

export async function getMachineStatus() {
  const supabase = createServiceSupabaseClient();
  const { data: report, error } = await supabase
    .from("machine_reports")
    .select("kind, message, status, created_at")
    .in("status", ["open", "maintenance"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (report?.status === "maintenance") return { label: "Em manutenção", tone: "red", detail: report.message };
  if (report?.status === "open") return { label: "Problema relatado", tone: "amber", detail: report.message };
  const now = new Date();
  const { data: active, error: activeError } = await supabase
    .from("reservations")
    .select("starts_at, ends_at, status")
    .in("status", ["reserved", "in_use", "late"])
    .lte("starts_at", now.toISOString())
    .gt("ends_at", now.toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeError) throw activeError;
  if (active?.status === "late") return { label: "Em uso (atrasada)", tone: "amber", detail: "A reserva atual ultrapassou o horário." };
  if (active?.status === "in_use") return { label: "Em uso", tone: "blue", detail: "A máquina está sendo utilizada agora." };
  if (active?.status === "reserved") return { label: "Reservada", tone: "blue", detail: "A máquina está reservada neste momento." };
  return { label: "Livre", tone: "green", detail: "Nenhuma reserva ou problema ativo." };
}

export async function reconcileReservationStatuses() {
  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const { data: expired, error: expiredError } = await supabase
    .from("reservations")
    .select("id, apartment_id, starts_at, estimated_minutes")
    .eq("status", "reserved")
    .lt("starts_at", cutoff);
  if (expiredError) throw expiredError;
  for (const reservation of expired ?? []) {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "released", released_at: nowIso, updated_at: nowIso })
      .eq("id", reservation.id)
      .eq("status", "reserved");
    if (error) throw error;
    await refundWeeklyBalanceForReservation({
      apartmentId: reservation.apartment_id,
      startIso: reservation.starts_at,
      minutes: reservation.estimated_minutes,
    });
  }
  const { error: lateError } = await supabase
    .from("reservations")
    .update({ status: "late", updated_at: nowIso })
    .eq("status", "in_use")
    .lt("ends_at", nowIso);
  if (lateError) throw lateError;
}

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

export async function listReservationsForDay(
  date: string,
  includeHistory = false,
): Promise<ScheduleReservation[]> {
  const supabase = createServiceSupabaseClient();
  const dayStartIso = `${date}T00:00:00-03:00`;
  const nextDate = new Date(`${date}T12:00:00-03:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(nextDate);
  const dayEndIso = `${nextDateText}T00:00:00-03:00`;

  const reservationsQuery = supabase
    .from("reservations")
    .select("id, apartment_id, kind, starts_at, ends_at, estimated_minutes, status, started_at")
    .lt("starts_at", dayEndIso)
    .gt("ends_at", dayStartIso);
  const filteredQuery = includeHistory
    ? reservationsQuery
    : reservationsQuery.in("status", ["reserved", "in_use", "late"]);
  const { data: reservations, error } = await filteredQuery.order("starts_at", { ascending: true });

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
    apartmentId: reservation.apartment_id,
    apartmentNumber: apartmentNumberById.get(reservation.apartment_id) ?? 0,
    kind: reservation.kind,
    startsAtIso: reservation.starts_at,
    endsAtIso: reservation.ends_at,
    estimatedMinutes: reservation.estimated_minutes,
    status: ["reserved", "in_use", "late"].includes(reservation.status)
      ? (reservation.status as "reserved" | "in_use" | "late")
      : undefined,
    startedAtIso: reservation.started_at,
  }));
}

export async function startReservation(input: { reservationId: string; apartmentId: string }) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status: "in_use", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.reservationId)
    .eq("apartment_id", input.apartmentId)
    .eq("status", "reserved");
  if (error) throw error;
}

export async function finishReservation(input: { reservationId: string; apartmentId: string }) {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reservations")
    .update({ status: "finished", finished_at: now, updated_at: now })
    .eq("id", input.reservationId)
    .eq("apartment_id", input.apartmentId)
    .in("status", ["reserved", "in_use", "late"]);
  if (error) throw error;
}

export async function findActiveReservationById(reservationId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, apartment_id, starts_at, estimated_minutes")
    .eq("id", reservationId)
    .in("status", ["reserved", "in_use", "late"])
    .single();

  if (error) throw error;

  return {
    id: data.id,
    apartmentId: data.apartment_id,
    startsAtIso: data.starts_at,
    estimatedMinutes: data.estimated_minutes,
  };
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

export async function markReservationCancelled(input: {
  reservationId: string;
  cancelledAtIso: string;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancelled_at: input.cancelledAtIso,
      updated_at: input.cancelledAtIso,
    })
    .eq("id", input.reservationId);

  if (error) throw error;
}
