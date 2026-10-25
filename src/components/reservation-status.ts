import type { ReservationStatus } from "../lib/domain/schedule";

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  reserved: "Reservada",
  in_use: "Em uso",
  finished: "Concluída",
  released: "Liberada",
  cancelled: "Cancelada",
  unregistered: "Ausente",
  late: "Atrasada",
};
