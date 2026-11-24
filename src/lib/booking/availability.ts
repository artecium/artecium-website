/**
 * Pure availability helpers for Artecium Booking (Phase 1 foundation).
 * DB RPCs enforce overlap; this module powers UI slot previews and unit tests.
 */

export interface TimeRangeUtc {
  startMs: number;
  endMs: number;
}

export interface LocalWorkingWindow {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

export interface LocalBreakWindow {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

export interface ServiceTiming {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export interface SlotGenerationInput {
  /** UTC instant range already blocked (appointments, time off). */
  blockedUtc: TimeRangeUtc[];
  /** Local windows for the target day (business timezone semantics). */
  workingWindows: LocalWorkingWindow[];
  breaks: LocalBreakWindow[];
  service: ServiceTiming;
  slotIntervalMinutes: number;
  /** Inclusive search window in UTC ms. */
  windowStartMs: number;
  windowEndMs: number;
  nowMs: number;
  minNoticeMinutes: number;
}

function rangesOverlap(a: TimeRangeUtc, b: TimeRangeUtc): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

function isBlocked(startMs: number, endMs: number, blocked: TimeRangeUtc[]): boolean {
  const candidate = { startMs, endMs };
  return blocked.some((range) => rangesOverlap(candidate, range));
}

/** Expand a service slot to include buffers for conflict detection. */
export function blockRangeForService(
  startMs: number,
  service: ServiceTiming,
): TimeRangeUtc {
  const start = startMs - service.bufferBeforeMinutes * 60_000;
  const end =
    startMs +
    service.durationMinutes * 60_000 +
    service.bufferAfterMinutes * 60_000;
  return { startMs: start, endMs: end };
}

/**
 * Generate UTC slot start times that fit working windows and avoid blocked ranges.
 * `workingWindows` / `breaks` must already be filtered to the intended local day.
 */
export function generateUtcSlotStarts(input: SlotGenerationInput): number[] {
  const {
    blockedUtc,
    workingWindows,
    breaks,
    service,
    slotIntervalMinutes,
    windowStartMs,
    windowEndMs,
    nowMs,
    minNoticeMinutes,
  } = input;

  const earliest = nowMs + minNoticeMinutes * 60_000;
  const slots: number[] = [];
  const step = slotIntervalMinutes * 60_000;
  const totalDurationMs = service.durationMinutes * 60_000;

  for (const window of workingWindows) {
    let cursor =
      windowStartMs + window.startMinutes * 60_000;
    const windowEnd =
      windowStartMs + window.endMinutes * 60_000;

    while (cursor + totalDurationMs <= windowEnd) {
      if (cursor >= windowStartMs && cursor + totalDurationMs <= windowEndMs) {
        const localMinutes =
          Math.floor((cursor - windowStartMs) / 60_000);
        const inBreak = breaks.some(
          (b) =>
            b.dayOfWeek === window.dayOfWeek &&
            localMinutes >= b.startMinutes &&
            localMinutes < b.endMinutes,
        );

        const block = blockRangeForService(cursor, service);
        if (
          !inBreak &&
          cursor >= earliest &&
          !isBlocked(block.startMs, block.endMs, blockedUtc)
        ) {
          slots.push(cursor);
        }
      }
      cursor += step;
    }
  }

  return slots;
}

export function parseLocalTimeToMinutes(value: string): number {
  const [h, m] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    throw new Error(`Invalid time: ${value}`);
  }
  return h * 60 + m;
}
