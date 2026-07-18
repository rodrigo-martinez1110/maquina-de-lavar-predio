import {
  getPeakSlots,
  type UsageMetricRow,
  type UsageSlot,
} from "../domain/metrics";
import { createServiceSupabaseClient } from "../supabase/server";

export type AdminUsageMetrics = {
  rows: UsageMetricRow[];
  peakSlots: UsageSlot[];
};

export async function getAdminUsageMetrics(): Promise<AdminUsageMetrics> {
  const supabase = createServiceSupabaseClient();
  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("apartment_id, starts_at, estimated_minutes, actual_minutes, status");
  if (reservationsError) throw reservationsError;

  const { data: apartments, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id, number");
  if (apartmentsError) throw apartmentsError;

  const apartmentNumbers = new Map(apartments.map((apartment) => [apartment.id, apartment.number]));
  const rows = reservations.map((reservation) => ({
    apartmentNumber: apartmentNumbers.get(reservation.apartment_id) ?? 0,
    estimatedMinutes: reservation.estimated_minutes,
    actualMinutes: reservation.actual_minutes,
    status: reservation.status,
  }));

  return {
    rows,
    peakSlots: getPeakSlots(toUsageSlots(reservations)),
  };
}

function toUsageSlots(
  reservations: Array<{
    starts_at: string;
    estimated_minutes: number;
    actual_minutes: number | null;
  }>,
) {
  const slots = new Map<string, UsageSlot>();

  for (const reservation of reservations) {
    const startsAt = new Date(reservation.starts_at);
    const dayOfWeek = startsAt.getDay();
    const hour = startsAt.getHours();
    const key = `${dayOfWeek}-${hour}`;
    const usedMinutes = reservation.actual_minutes ?? reservation.estimated_minutes;
    const current = slots.get(key);
    slots.set(key, {
      dayOfWeek,
      hour,
      usedMinutes: (current?.usedMinutes ?? 0) + usedMinutes,
    });
  }

  return Array.from(slots.values());
}
