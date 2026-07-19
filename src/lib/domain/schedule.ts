export type ScheduleReservation = {
  id: string;
  apartmentId: string;
  apartmentNumber: number;
  kind: "wash" | "dry" | "wash_dry" | "custom";
  startsAtIso: string;
  endsAtIso: string;
  estimatedMinutes: number;
};

export type DaySlot =
  | {
      time: string;
      status: "free";
    }
  | {
      time: string;
      status: "busy";
      apartmentNumber: number;
      reservationId: string;
      kind: ScheduleReservation["kind"];
    };

export type FreeWindow = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

const FIRST_SLOT_MINUTES = 7 * 60;
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

  for (
    let slotMinutes = FIRST_SLOT_MINUTES;
    slotMinutes <= LAST_SLOT_START_MINUTES;
    slotMinutes += SLOT_MINUTES
  ) {
    const reservation = input.reservations.find((candidate) => {
      const startsAt = minutesOfDayFromIso(candidate.startsAtIso);
      const endsAt = minutesOfDayFromIso(candidate.endsAtIso);
      return dateInSaoPauloFromIso(candidate.startsAtIso) === input.date && startsAt <= slotMinutes && slotMinutes < endsAt;
    });

    if (reservation) {
      slots.push({
        time: timeFromMinutes(slotMinutes),
        status: "busy",
        apartmentNumber: reservation.apartmentNumber,
        reservationId: reservation.id,
        kind: reservation.kind,
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
