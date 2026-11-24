/**
 * Public slot validation helpers (no DB).
 * Usage: npm run verify:booking-public-slot
 */

import {
  appointmentEndsSameLocalDay,
  isAlignedToSlotGrid,
  localMinutesFromUtcInstant,
  slotStartInBreak,
  blockedRangeOverlapsTimeOff,
} from "../src/lib/booking/public-slot-validation.ts";

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  const ms = Date.parse("2026-06-02T09:00:00.000Z");
  const local = localMinutesFromUtcInstant(ms, "Europe/Lisbon");
  check("local dow", typeof local.dayOfWeek === "number", String(local.dayOfWeek));
  check("grid 15", isAlignedToSlotGrid(local.minutesFromMidnight, 15));
  check(
    "same day end",
    appointmentEndsSameLocalDay(ms, 30, "Europe/Lisbon"),
  );
  check(
    "break blocks start",
    slotStartInBreak(local.dayOfWeek, 600, [
      { dayOfWeek: local.dayOfWeek, startMinutes: 540, endMinutes: 630 },
    ]),
  );
  check(
    "time off overlaps buffer",
    blockedRangeOverlapsTimeOff(ms, { durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 15 }, [
      { startMs: ms + 20 * 60_000, endMs: ms + 60 * 60_000 },
    ]),
  );

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
