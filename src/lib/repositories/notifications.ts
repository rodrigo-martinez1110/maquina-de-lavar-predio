import { createServiceSupabaseClient } from "../supabase/server";

export type NotificationKind =
  | "late"
  | "transfer"
  | "admin_correction"
  | "impacted_reservation";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export async function createNotification(input: {
  apartmentId: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    apartment_id: input.apartmentId,
    kind: input.kind,
    title: input.title,
    body: input.body,
  });

  if (error) throw error;
}

export async function listApartmentNotifications(apartmentId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, read_at, created_at")
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}
