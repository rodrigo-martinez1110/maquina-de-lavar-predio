"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { createServiceSupabaseClient } from "../supabase/server";

export async function reportMachineAction(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const kind = String(formData.get("kind") ?? "problem");
  const message = String(formData.get("message") ?? "").trim();
  if (!["occupied", "finished", "problem"].includes(kind)) throw new Error("Relato invalido");
  if (message.length < 3 || message.length > 240) throw new Error("Descreva o ocorrido em poucas palavras");
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("machine_reports").insert({
    apartment_id: session.apartmentId,
    kind,
    message,
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/reservations");
}

export async function acknowledgeRulesAction() {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("rule_acknowledgments").upsert({
    apartment_id: session.apartmentId,
    version: "2026-10-18",
    acknowledged_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath("/rules");
}
