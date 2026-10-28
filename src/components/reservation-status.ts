import type { ReservationNonUseReason, ReservationStatus } from "../lib/domain/schedule";

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  reserved: "Reservada",
  in_use: "Em uso",
  finished: "Concluída",
  released: "Liberada",
  cancelled: "Cancelada",
  unregistered: "Não conseguiu usar",
  late: "Atrasada",
};

export const reservationNonUseReasonLabels: Record<ReservationNonUseReason, string> = {
  occupied: "Máquina ocupada",
  machine_problem: "Problema na máquina",
  other: "Outro",
};

export function reservationStatusLabel(status: ReservationStatus, reason?: ReservationNonUseReason | null) {
  const label = reservationStatusLabels[status];
  return status === "unregistered" && reason
    ? `${label} · ${reservationNonUseReasonLabels[reason]}`
    : label;
}
