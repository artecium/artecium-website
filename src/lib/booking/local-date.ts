/** YYYY-MM-DD for a calendar date in the business IANA timezone. */
export function formatLocalDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDaysToLocalDateString(isoDate: string, days: number, timeZone: string): string {
  const probe = new Date(`${isoDate}T12:00:00.000Z`);
  probe.setUTCDate(probe.getUTCDate() + days);
  return formatLocalDateInTimezone(probe, timeZone);
}
