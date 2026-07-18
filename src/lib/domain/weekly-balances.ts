type WeeklyBalanceForAvailability = {
  quota_minutes: number;
  manual_adjustment_minutes: number;
  received_minutes: number;
  sent_minutes: number;
  reserved_minutes: number;
  refunded_minutes: number;
  penalty_minutes: number;
};

export function availableMinutesFromWeeklyBalance(balance: WeeklyBalanceForAvailability | null): number {
  if (!balance) return 0;

  return (
    balance.quota_minutes +
    balance.manual_adjustment_minutes +
    balance.received_minutes -
    balance.sent_minutes -
    balance.reserved_minutes +
    balance.refunded_minutes -
    balance.penalty_minutes
  );
}

export function weekStartForReservation(startIso: string): string {
  const dateText = startIso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) throw new Error("Data invalida");

  const [, yearText, monthText, dayText] = match;
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)));
  const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (isoWeekday - 1));

  return date.toISOString().slice(0, 10);
}
