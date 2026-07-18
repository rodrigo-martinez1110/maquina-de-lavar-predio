import type { Json } from "../database.types";
import { createServiceSupabaseClient } from "../supabase/server";

export async function writeAuditLog(input: {
  actorKind: "apartment" | "admin" | "system";
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Json;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_kind: input.actorKind,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}

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
  await writeAuditLog({
    actorKind: "apartment",
    actorId: input.apartmentId,
    action: "reservation.created",
    entityType: "reservation",
    entityId: input.reservationId,
    metadata: input.metadata,
  });
}
