import { createServiceSupabaseClient } from "../supabase/server";

export type TransferRow = {
  id: string;
  apartmentId: string;
  kind: "offer" | "request";
  remainingMinutes: number;
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
