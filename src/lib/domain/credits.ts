export type WeeklyQuotaInput = {
  residentCount: number;
  manualAdjustmentMinutes: number;
};

export type AvailableMinutesInput = {
  quotaMinutes: number;
  receivedMinutes: number;
  sentMinutes: number;
  reservedMinutes: number;
  refundedMinutes: number;
  penaltyMinutes: number;
};

export function calculateWeeklyQuotaMinutes(input: WeeklyQuotaInput): number {
  const extraResidents = Math.max(0, input.residentCount - 1);
  return 900 + extraResidents * 30 + input.manualAdjustmentMinutes;
}

export function calculateAvailableMinutes(input: AvailableMinutesInput): number {
  return (
    input.quotaMinutes +
    input.receivedMinutes -
    input.sentMinutes -
    input.reservedMinutes +
    input.refundedMinutes -
    input.penaltyMinutes
  );
}
