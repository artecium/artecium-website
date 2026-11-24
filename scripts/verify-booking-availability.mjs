/**
 * Unit checks for booking slot generation (no DB).
 * Usage: npm run verify:booking-availability
 */

import {
  blockRangeForService,
  generateUtcSlotStarts,
  parseLocalTimeToMinutes,
} from "../src/lib/booking/availability.ts";

/** @typedef {{ name: string; pass: boolean; detail: string }} CheckResult */
/** @type {CheckResult[]} */
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  const dayStart = Date.parse("2026-06-02T09:00:00.000Z");
  const service = {
    durationMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
  };

  check(
    "parseLocalTimeToMinutes",
    parseLocalTimeToMinutes("09:30") === 570,
    "09:30",
  );

  const block = blockRangeForService(dayStart + 60 * 60_000, service);
  check(
    "buffer after extends block",
    block.endMs - block.startMs === (30 + 15) * 60_000,
    String(block.endMs - block.startMs),
  );

  const existingStart = dayStart + 2 * 60 * 60_000;
  const slots = generateUtcSlotStarts({
    blockedUtc: [
      blockRangeForService(existingStart, service),
    ],
    workingWindows: [{ dayOfWeek: 1, startMinutes: 0, endMinutes: 8 * 60 }],
    breaks: [{ dayOfWeek: 1, startMinutes: 120, endMinutes: 150 }],
    service,
    slotIntervalMinutes: 15,
    windowStartMs: dayStart,
    windowEndMs: dayStart + 24 * 60 * 60_000,
    nowMs: dayStart - 60_000,
    minNoticeMinutes: 0,
  });

  check("generates slots", slots.length > 0, String(slots.length));
  check(
    "excludes overlapping slot",
    !slots.includes(existingStart),
    String(existingStart),
  );
  check(
    "excludes break start",
    !slots.includes(dayStart + 120 * 60_000),
    "break",
  );

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
