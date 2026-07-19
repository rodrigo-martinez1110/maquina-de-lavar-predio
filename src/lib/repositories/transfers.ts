import { createServiceSupabaseClient } from "../supabase/server";

export type TransferRow = {
  id: string;
  apartmentId: string;
  kind: "offer" | "request";
  weekStart: string;
  remainingMinutes: number;
};

export type OpenTransferListItem = TransferRow & {
  apartmentNumber: number;
  totalMinutes: number;
  status: "open" | "partially_filled";
  createdAt: string;
};

export async function createTransfer(input: {
  apartmentId: string;
  kind: "offer" | "request";
  weekStart: string;
  totalMinutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transfers")
    .insert({
      apartment_id: input.apartmentId,
      kind: input.kind,
      week_start: input.weekStart,
      total_minutes: input.totalMinutes,
      remaining_minutes: input.totalMinutes,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function listOpenTransfersForWeek(weekStart: string): Promise<OpenTransferListItem[]> {
  const supabase = createServiceSupabaseClient();
  const { data: transfers, error } = await supabase
    .from("credit_transfers")
    .select("id, apartment_id, kind, status, week_start, total_minutes, remaining_minutes, created_at")
    .eq("week_start", weekStart)
    .in("status", ["open", "partially_filled"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  const transferRows = transfers ?? [];
  if (transferRows.length === 0) return [];

  const apartmentIds = [...new Set(transferRows.map((transfer) => transfer.apartment_id))];
  const { data: apartments, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id, number")
    .in("id", apartmentIds);

  if (apartmentsError) throw apartmentsError;

  const apartmentNumberById = new Map(
    (apartments ?? []).map((apartment) => [apartment.id, apartment.number]),
  );

  return transferRows.map((transfer) => ({
    id: transfer.id,
    apartmentId: transfer.apartment_id,
    apartmentNumber: apartmentNumberById.get(transfer.apartment_id) ?? 0,
    kind: transfer.kind,
    status: transfer.status as "open" | "partially_filled",
    weekStart: transfer.week_start,
    totalMinutes: transfer.total_minutes,
    remainingMinutes: transfer.remaining_minutes,
    createdAt: transfer.created_at,
  }));
}

export async function findOpenTransferById(transferId: string): Promise<TransferRow> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transfers")
    .select("id, apartment_id, kind, week_start, remaining_minutes")
    .in("status", ["open", "partially_filled"])
    .eq("id", transferId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    apartmentId: data.apartment_id,
    kind: data.kind,
    weekStart: data.week_start,
    remainingMinutes: data.remaining_minutes,
  };
}

export async function insertTransferAcceptance(input: {
  transferId: string;
  fromApartmentId: string;
  toApartmentId: string;
  minutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transfer_acceptances")
    .insert({
      transfer_id: input.transferId,
      from_apartment_id: input.fromApartmentId,
      to_apartment_id: input.toApartmentId,
      minutes: input.minutes,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransferRemaining(input: {
  transferId: string;
  remainingMinutes: number;
  status: "open" | "partially_filled" | "filled" | "cancelled";
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("credit_transfers")
    .update({
      remaining_minutes: input.remainingMinutes,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.transferId);
  if (error) throw error;
}
