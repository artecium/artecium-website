/**
 * Public booking helpers (no DB).
 * Usage: npm run verify:booking-public-flow
 */

import { publicBookingErrorKey, isSupabaseConfigured } from "../src/lib/booking/public-errors.ts";
import { isValidPublicIdempotencyKey } from "../src/lib/booking/public-idempotency.ts";

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  check(
    "maps slot error",
    publicBookingErrorKey({ code: "23505", message: "slot no longer available" }) ===
      "booking.public.errors.slotUnavailable",
  );
  check(
    "maps idempotency",
    publicBookingErrorKey({ message: "idempotency key reused" }) ===
      "booking.public.errors.idempotency",
  );
  check(
    "maps generic",
    publicBookingErrorKey({ message: "internal secret detail" }) ===
      "booking.public.errors.generic",
  );
  check("valid idempotency key", isValidPublicIdempotencyKey("abcd1234_abcd1234"));
  check("invalid short key", !isValidPublicIdempotencyKey("short"));
  check(
    "isSupabaseConfigured is boolean",
    typeof isSupabaseConfigured() === "boolean",
  );

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
