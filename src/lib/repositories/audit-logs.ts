import { createServiceSupabaseClient } from "../supabase/server";

export async function writeReservationCreatedAudit(input: {
  apartmentId: string;
  reservationId: string;
  metadata: {
    kind: "wash" | "dry" | "wash_dry" | "custom";
    startIso: string;
    endIso: string;
    estimatedMinutes: number;
  };
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_kind: "apartment",
    actor_id: input.apartmentId,
    action: "reservation.created",
    entity_type: "reservation",
    entity_id: input.reservationId,
    metadata: input.metadata,
  });

  if (error) throw error;
}
