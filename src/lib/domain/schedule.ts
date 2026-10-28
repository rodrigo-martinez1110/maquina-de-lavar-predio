import type { Database } from "../database.types";

export type ReservationStatus = Database["public"]["Enums"]["reservation_status"];
export type ReservationNonUseReason = "occupied" | "machine_problem" | "other";

export type ScheduleReservation = {
  id: string;
  apartmentId: string;
  apartmentNumber: number;
  kind: "wash" | "dry" | "wash_dry" | "custom";
  status: ReservationStatus;
  startsAtIso: string;
  endsAtIso: string;
  estimatedMinutes: number;
  startedAtIso?: string | null;
  nonUseReason?: ReservationNonUseReason | null;
};

export type DaySlot =
  | {
      time: string;
      status: "free";
      historyReservations?: Array<{
        apartmentNumber: number;
        reservationStatus: ReservationStatus;
        nonUseReason: ReservationNonUseReason | null;
      }>;
    }
  | {
      time: string;
      status: "busy";
      apartmentNumber: number;
      reservationId: string;
      kind: ScheduleReservation["kind"];
      reservationStatus: ReservationStatus;
      nonUseReason?: ReservationNonUseReason | null;
      additionalReservations?: Array<{
        apartmentNumber: number;
        reservationStatus: ReservationStatus;
        nonUseReason?: ReservationNonUseReason | null;
      }>;
    }
  | {
      time: string;
      status: "history";
      apartmentNumber: number;
      reservationId: string;
      kind: ScheduleReservation["kind"];
      reservationStatus: ReservationStatus;
      nonUseReason?: ReservationNonUseReason | null;
      additionalReservations?: Array<{
        apartmentNumber: number;
        reservationStatus: ReservationStatus;
        nonUseReason?: ReservationNonUseReason | null;
      }>;
    };

export type FreeWindow = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

const FIRST_SLOT_MINUTES = 8 * 60;
const LAST_SLOT_START_MINUTES = 22 * 60 + 30;
const SLOT_MINUTES = 30;

function timeFromMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function minutesOfDayFromIso(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function dateInSaoPauloFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function minutesFromTime(time: string): number {
  const [hourText, minuteText] = time.split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

export function buildDaySlots(input: {
  date: string;
  reservations: ScheduleReservation[];
}): DaySlot[] {
  const slots: DaySlot[] = [];
  const now = new Date();
  const today = dateInSaoPauloFromIso(now.toISOString());

  for (
    let slotMinutes = FIRST_SLOT_MINUTES;
    slotMinutes <= LAST_SLOT_START_MINUTES;
    slotMinutes += SLOT_MINUTES
  ) {
    const matchingReservations = input.reservations.filter((candidate) => {
      const startsAt = minutesOfDayFromIso(candidate.startsAtIso);
      const endsAt = minutesOfDayFromIso(candidate.endsAtIso);
      return dateInSaoPauloFromIso(candidate.startsAtIso) === input.date && startsAt <= slotMinutes && slotMinutes < endsAt;
    });

    if (matchingReservations.length > 0) {
      const activeReservation = matchingReservations.find((candidate) =>
        ["reserved", "in_use", "late"].includes(candidate.status),
      );
      const time = timeFromMinutes(slotMinutes);
      if (
        input.date === today &&
        !activeReservation &&
        matchingReservations.some((candidate) => candidate.status === "unregistered") &&
        new Date(`${input.date}T${time}:00-03:00`).getTime() >= now.getTime()
      ) {
        slots.push({
          time,
          status: "free",
          historyReservations: matchingReservations.map((candidate) => ({
            apartmentNumber: candidate.apartmentNumber,
            reservationStatus: candidate.status,
            nonUseReason: candidate.nonUseReason ?? null,
          })),
        });
        continue;
      }
      const reservation = activeReservation ?? matchingReservations[0];
      const isActive = Boolean(activeReservation) && input.date >= today;
      slots.push({
        time,
        status: isActive ? "busy" : "history",
        apartmentNumber: reservation.apartmentNumber,
        reservationId: reservation.id,
        kind: reservation.kind,
        reservationStatus: reservation.status,
        nonUseReason: reservation.nonUseReason ?? null,
        additionalReservations: matchingReservations
          .filter((candidate) => candidate.id !== reservation.id)
          .map((candidate) => ({
            apartmentNumber: candidate.apartmentNumber,
            reservationStatus: candidate.status,
            nonUseReason: candidate.nonUseReason ?? null,
          })),
      });
    } else {
      slots.push({
        time: timeFromMinutes(slotMinutes),
        status: "free",
      });
    }
  }

  return slots;
}

export function buildFreeWindows(slots: DaySlot[]): FreeWindow[] {
  const windows: FreeWindow[] = [];
  let windowStartMinutes: number | null = null;
  let lastFreeSlotMinutes: number | null = null;

  for (const slot of slots) {
    const slotMinutes = minutesFromTime(slot.time);
    if (slot.status === "free") {
      windowStartMinutes ??= slotMinutes;
      lastFreeSlotMinutes = slotMinutes;
      continue;
    }

    if (windowStartMinutes !== null && lastFreeSlotMinutes !== null) {
      const endMinutes = lastFreeSlotMinutes + SLOT_MINUTES;
      windows.push({
        startTime: timeFromMinutes(windowStartMinutes),
        endTime: timeFromMinutes(endMinutes),
        durationMinutes: endMinutes - windowStartMinutes,
      });
      windowStartMinutes = null;
      lastFreeSlotMinutes = null;
    }
  }

  if (windowStartMinutes !== null && lastFreeSlotMinutes !== null) {
    const endMinutes = lastFreeSlotMinutes + SLOT_MINUTES;
    windows.push({
      startTime: timeFromMinutes(windowStartMinutes),
      endTime: timeFromMinutes(endMinutes),
      durationMinutes: endMinutes - windowStartMinutes,
    });
  }

  return windows;
}
