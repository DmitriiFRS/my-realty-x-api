export function lastDayOfMonth(year: number, monthZeroBased: number) {
  return new Date(year, monthZeroBased + 1, 0).getDate();
}

export function addMonthsSafe(date: Date, months: number, originalDay?: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const dayToTry = originalDay ?? date.getDate();
  const lastDay = lastDayOfMonth(targetYear, targetMonth);
  const day = Math.min(dayToTry, lastDay);

  const ret = new Date(targetYear, targetMonth, day, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return ret;
}

export function computeNextOccurrenceSendAt(
  baseDueDate: Date,
  originalDay: number,
  advanceDays: number,
  monthsToAddStart = 0,
): { nextDue: Date; sendAt: Date } {
  const now = new Date();

  // startMonthOffset 0 или 1. 0 — может использовать сам baseDueDate.
  let offset = monthsToAddStart;
  for (let i = 0; i < 24; i++) {
    const candidateDue = addMonthsSafe(baseDueDate, offset, originalDay);
    // sendAt = candidateDue - advanceDays
    const sendAt = new Date(candidateDue);
    sendAt.setDate(sendAt.getDate() - advanceDays);

    if (sendAt > now) {
      return { nextDue: candidateDue, sendAt };
    }
    offset += 1;
  }

  // Если в течение 24 месяцев не нашли — просто вернем первый следующий месяц (запасной план)
  const fallbackNextDue = addMonthsSafe(baseDueDate, 1, originalDay);
  const fallbackSendAt = new Date(fallbackNextDue);
  fallbackSendAt.setDate(fallbackSendAt.getDate() - advanceDays);
  return { nextDue: fallbackNextDue, sendAt: fallbackSendAt };
}
