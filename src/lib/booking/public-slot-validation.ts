/**
 * Shared slot rules mirrored by `booking_validate_public_slot` (SQL).
 * Used for unit tests and public UI previews — server RPC is authoritative.
 */

export interface ServiceTiming {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

function blockRangeForService(
  startMs: number,
  service: ServiceTiming,
): { startMs: number; endMs: number } {
  const start = startMs - service.bufferBeforeMinutes * 60_000;
  const end =
    startMs +
    service.durationMinutes * 60_000 +
    service.bufferAfterMinutes * 60_000;
  return { startMs: start, endMs: end };
}

export function localMinutesFromUtcInstant(
  startsAtMs: number,
  timeZone: string,
): { dayOfWeek: number; minutesFromMidnight: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(startsAtMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const weekday = get("weekday");
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = map[weekday] ?? 0;
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  return {
    dayOfWeek,
    minutesFromMidnight: hour * 60 + minute,
    dateKey,
  };
}

export function isAlignedToSlotGrid(
  minutesFromMidnight: number,
  slotIntervalMinutes: number,
): boolean {
  return minutesFromMidnight % slotIntervalMinutes === 0;
}

export function appointmentEndsSameLocalDay(
  startsAtMs: number,
  durationMinutes: number,
  timeZone: string,
): boolean {
  const start = localMinutesFromUtcInstant(startsAtMs, timeZone);
  const end = localMinutesFromUtcInstant(
    startsAtMs + durationMinutes * 60_000,
    timeZone,
  );
  return start.dateKey === end.dateKey;
}

export function slotStartInBreak(
  dayOfWeek: number,
  minutesFromMidnight: number,
  breaks: { dayOfWeek: number; startMinutes: number; endMinutes: number }[],
): boolean {
  return breaks.some(
    (b) =>
      b.dayOfWeek === dayOfWeek &&
      minutesFromMidnight >= b.startMinutes &&
      minutesFromMidnight < b.endMinutes,
  );
}

export function blockedRangeOverlapsTimeOff(
  startsAtMs: number,
  service: ServiceTiming,
  timeOffRanges: { startMs: number; endMs: number }[],
): boolean {
  const block = blockRangeForService(startsAtMs, service);
  return timeOffRanges.some(
    (off) => block.startMs < off.endMs && off.startMs < block.endMs,
  );
}
