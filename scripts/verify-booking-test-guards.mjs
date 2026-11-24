/**
 * Static tests for booking-test-guards (no database).
 */

import {
  assertBookingDatabaseTarget,
  extractSupabaseProjectRef,
  isLocalSupabaseUrl,
} from "./booking-test-guards.mjs";
import {
  BOOKING_ALLOWLISTED_PROJECT_REFS,
  BOOKING_PROTECTED_PROJECT_REFS,
} from "./booking-integration-fixtures.mjs";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`PASS  ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

function expectThrow(fn, msg) {
  try {
    fn();
    fail(msg);
  } catch {
    pass(msg);
  }
}

function main() {
  const allowlisted = BOOKING_ALLOWLISTED_PROJECT_REFS[0];
  const url = `https://${allowlisted}.supabase.co`;

  if (extractSupabaseProjectRef(url) === allowlisted) {
    pass("extractSupabaseProjectRef — allowlisted host");
  } else {
    fail("extractSupabaseProjectRef — allowlisted host");
  }

  if (isLocalSupabaseUrl("http://127.0.0.1:54321")) {
    pass("isLocalSupabaseUrl — loopback");
  } else {
    fail("isLocalSupabaseUrl — loopback");
  }

  assertBookingDatabaseTarget("http://127.0.0.1:54321");
  pass("local URL without remote flag");

  const prevRemote = process.env.BOOKING_ALLOW_REMOTE_TESTS;
  const prevExpected = process.env.BOOKING_EXPECTED_PROJECT_REF;
  delete process.env.BOOKING_ALLOW_REMOTE_TESTS;
  delete process.env.BOOKING_EXPECTED_PROJECT_REF;

  expectThrow(() => assertBookingDatabaseTarget(url), "hosted URL blocked without remote flag");

  process.env.BOOKING_ALLOW_REMOTE_TESTS = "1";
  const target = assertBookingDatabaseTarget(url);
  if (target.projectRef === allowlisted) {
    pass("allowlisted hosted URL with remote flag");
  } else {
    fail("allowlisted hosted URL with remote flag");
  }

  const protectedRef = BOOKING_PROTECTED_PROJECT_REFS[0];
  expectThrow(
    () => assertBookingDatabaseTarget(`https://${protectedRef}.supabase.co`),
    "protected project ref rejected even with remote flag",
  );

  expectThrow(
    () => assertBookingDatabaseTarget("https://abcdefghijklmnopqrst.supabase.co"),
    "non-allowlisted project ref rejected",
  );

  process.env.BOOKING_EXPECTED_PROJECT_REF = "wrongref000000000000";
  expectThrow(() => assertBookingDatabaseTarget(url), "BOOKING_EXPECTED_PROJECT_REF mismatch");

  process.env.BOOKING_EXPECTED_PROJECT_REF = allowlisted;
  assertBookingDatabaseTarget(url);
  pass("BOOKING_EXPECTED_PROJECT_REF matches URL");

  process.env.BOOKING_ALLOW_REMOTE_TESTS = prevRemote;
  if (prevExpected === undefined) delete process.env.BOOKING_EXPECTED_PROJECT_REF;
  else process.env.BOOKING_EXPECTED_PROJECT_REF = prevExpected;

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
