export type UsageSlot = {
  dayOfWeek: number;
  hour: number;
  usedMinutes: number;
};

export type UsageMetricRow = {
  apartmentNumber: number;
  estimatedMinutes: number;
  actualMinutes: number | null;
  status: string;
};

export function usedMinutesForRow(row: UsageMetricRow) {
  return row.actualMinutes ?? row.estimatedMinutes;
}

export function getPeakSlots(slots: UsageSlot[]): UsageSlot[] {
  return [...slots].sort((a, b) => b.usedMinutes - a.usedMinutes);
}

export function summarizeUsageTotals(rows: UsageMetricRow[]) {
  return {
    totalMinutes: rows.reduce((sum, row) => sum + usedMinutesForRow(row), 0),
    reservationCount: rows.length,
    lateCount: rows.filter((row) => row.status === "late").length,
  };
}

export function rankApartmentUsage(rows: UsageMetricRow[]) {
  const byApartment = new Map<number, number>();

  for (const row of rows) {
    byApartment.set(
      row.apartmentNumber,
      (byApartment.get(row.apartmentNumber) ?? 0) + usedMinutesForRow(row),
    );
  }

  return Array.from(byApartment.entries())
    .map(([apartmentNumber, usedMinutes]) => ({ apartmentNumber, usedMinutes }))
    .sort((a, b) => b.usedMinutes - a.usedMinutes || a.apartmentNumber - b.apartmentNumber);
}
