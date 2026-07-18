const THIRTY_MINUTES = 30;
const CIVIL_ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/;

type CivilDateTime = {
  date: string;
  hour: number;
  minute: number;
};

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function ceilToThirtyMinuteBlocks(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / THIRTY_MINUTES) * THIRTY_MINUTES;
}

function parseCivilDateTime(iso: string): CivilDateTime {
  const match = CIVIL_ISO_PATTERN.exec(iso);
  if (!match) throw new Error("Data invalida");

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error("Data invalida");
  }

  return {
    date: `${yearText}-${monthText}-${dayText}`,
    hour,
    minute,
  };
}

export function assertReservableWindow(startIso: string, endIso: string): void {
  const start = parseCivilDateTime(startIso);
  const end = parseCivilDateTime(endIso);
  const startHour = start.hour + start.minute / 60;
  const endHour = end.hour + end.minute / 60;

  if (startHour < 7) throw new Error("Reservas devem comecar a partir de 07:00");
  if (endHour > 23 || end.date !== start.date) {
    throw new Error("Reservas devem terminar ate 23:00");
  }
}
