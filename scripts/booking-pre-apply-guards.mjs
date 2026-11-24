/**
 * Pre-apply checks before migration 019 (no secrets printed).
 * Usage: node --env-file=.env.booking.test.local scripts/booking-pre-apply-guards.mjs
 */

import { BOOKING_ALLOWLISTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  getSupabaseEnv,
  BOOKING_REMOTE_TESTS_ENV,
} from "./booking-test-guards.mjs";

function decodeJwtRole(token) {
  if (!token?.startsWith("eyJ")) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function main() {
  const env = getSupabaseEnv();
  if (!env.url?.trim()) {
    console.error("FAIL  Missing NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  let target;
  try {
    target = assertBookingDatabaseTarget(env.url);
  } catch (e) {
    console.error(`FAIL  ${e.message}`);
    process.exit(1);
  }

  if (target.kind !== "remote") {
    console.error("FAIL  Expected allowlisted hosted test URL, not local-only for this runbook.");
    process.exit(1);
  }

  const ref = target.projectRef;
  console.log(`PASS  Target project ref: ${ref}`);
  console.log(`PASS  Allowlisted: ${BOOKING_ALLOWLISTED_PROJECT_REFS.includes(ref ?? "")}`);

  if (process.env[BOOKING_REMOTE_TESTS_ENV] !== "1") {
    console.error(`FAIL  Set ${BOOKING_REMOTE_TESTS_ENV}=1 in env file.`);
    process.exit(1);
  }
  console.log(`PASS  ${BOOKING_REMOTE_TESTS_ENV}=1`);

  const expected = process.env.BOOKING_EXPECTED_PROJECT_REF?.trim().toLowerCase();
  if (expected && expected !== ref) {
    console.error(`FAIL  BOOKING_EXPECTED_PROJECT_REF mismatch.`);
    process.exit(1);
  }
  if (expected) console.log(`PASS  BOOKING_EXPECTED_PROJECT_REF matches URL`);

  if (!env.serviceKey?.trim()) {
    console.error("FAIL  SUPABASE_SERVICE_ROLE_KEY not set");
    process.exit(1);
  }

  if (env.serviceKey.startsWith("sb_secret_")) {
    console.log("PASS  Service key format: sb_secret_* (confirm service_role in Dashboard manually)");
  } else if (env.serviceKey.startsWith("eyJ")) {
    const role = decodeJwtRole(env.serviceKey);
    if (role !== "service_role") {
      console.error(`FAIL  JWT role is ${role ?? "unknown"}, expected service_role`);
      process.exit(1);
    }
    console.log("PASS  JWT service_role claim");
  } else {
    console.error("FAIL  Unrecognized service key format");
    process.exit(1);
  }

  if (!env.anonKey?.trim()) {
    console.error("FAIL  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set");
    process.exit(1);
  }
  console.log("PASS  Publishable key present");

  console.log("\nPre-apply guards OK.");
}

main();
