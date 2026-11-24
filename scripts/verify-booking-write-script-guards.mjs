/**
 * Static + local guard tests for Booking remote write scripts (no database).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BOOKING_SANDBOX_PROJECT_REF } from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  assertBookingExplicitSandboxEnv,
} from "./booking-test-guards.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)));

/** @type {{ path: string; gate?: string }[]} */
const WRITE_SCRIPTS = [
  { path: "seed-booking-integration.mjs", gate: "BOOKING_SEED" },
  { path: "booking-integration-test.mjs", gate: "BOOKING_INTEGRATION_TEST" },
  { path: "booking-rls-test.mjs", gate: "BOOKING_RLS_TEST" },
  { path: "booking-member-role-integration.mjs", gate: "BOOKING_MEMBER_ROLE_INTEGRATION_TEST" },
  { path: "booking-phase2-incremental-fixtures.mjs", gate: "BOOKING_PHASE2_INCREMENTAL_FIXTURES" },
  { path: "booking-public-e2e-smoke.mjs", gate: "BOOKING_PUBLIC_E2E_SMOKE" },
  { path: "booking-phase2-authorized-execute.mjs", gate: "BOOKING_PHASE2_AUTHORIZED_EXECUTE" },
  { path: "booking-apply-migration-019.mjs", gate: "BOOKING_APPLY_MIGRATION_019" },
  { path: "booking-apply-migration-023-harness.mjs" },
  { path: "booking-apply-migration-024.mjs", gate: "BOOKING_APPLY_MIGRATION_024" },
  { path: "booking-apply-integration-service-role-grant.mjs" },
];

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

function readScript(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

function main() {
  const loadEnv = readScript("booking-load-test-env.mjs");
  const loadCalls = [...loadEnv.matchAll(/load\(resolve\(root,\s*"([^"]+)"\)\)/g)].map((m) => m[1]);
  if (loadCalls.includes(".env.local")) {
    fail("booking-load-test-env must not load .env.local");
  } else {
    pass("booking-load-test-env does not load .env.local");
  }
  if (loadCalls.includes(".env.booking.test.local")) {
    fail("booking-load-test-env must not load .env.booking.test.local");
  } else if (loadCalls.includes(".env.booking.sandbox.local")) {
    pass("booking-load-test-env loads .env.booking.sandbox.local only");
  } else {
    fail("booking-load-test-env missing sandbox load call");
  }

  const e2e = readScript("booking-public-e2e-smoke.mjs");
  if (e2e.includes("booking-load-test-env")) {
    fail("booking-public-e2e-smoke must not import booking-load-test-env");
  } else {
    pass("e2e smoke has no booking-load-test-env import");
  }
  if (!e2e.includes("assertBookingExplicitSandboxEnv")) {
    fail("e2e smoke must call assertBookingExplicitSandboxEnv");
  } else {
    pass("e2e smoke uses assertBookingExplicitSandboxEnv");
  }

  const seed = readScript("seed-booking-integration.mjs");
  if (!seed.includes("acquireBookingSeedLock")) {
    fail("seed must use acquireBookingSeedLock");
  } else {
    pass("seed acquires booking seed lock");
  }
  if (!seed.includes("assertBookingExplicitSandboxEnv")) {
    fail("seed must call assertBookingExplicitSandboxEnv");
  } else {
    pass("seed uses assertBookingExplicitSandboxEnv");
  }

  for (const { path: rel, gate } of WRITE_SCRIPTS) {
    const src = readScript(rel);
    if (!src.includes("assertBookingExplicitSandboxEnv") && !src.includes("assertBookingDatabaseTarget")) {
      fail(`${rel} missing target guard before writes`);
      continue;
    }
    const guarded =
      /assertBookingExplicitSandboxEnv[\s\S]{0,1200}createClient/.test(src) ||
      /assertBookingExplicitSandboxEnv[\s\S]{0,400}resolveReadonlyDatabaseUrl/.test(src) ||
      /assertBookingDatabaseTarget[\s\S]{0,800}createClient/.test(src) ||
      rel.includes("apply-migration") ||
      rel.includes("seed-booking");
    if (!guarded) {
      fail(`${rel} guard may not precede first remote client`);
    } else {
      pass(`${rel} declares explicit target guard`);
    }
    if (gate && !src.includes(gate)) {
      fail(`${rel} missing env gate ${gate}`);
    } else if (gate) {
      pass(`${rel} has gate ${gate}`);
    }
  }

  const prev = { ...process.env };
  try {
    process.env.BOOKING_SANDBOX_ENV_LOADED = "1";
    process.env.BOOKING_ALLOW_REMOTE_TESTS = "1";
    process.env.BOOKING_EXPECTED_PROJECT_REF = BOOKING_SANDBOX_PROJECT_REF;
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://bwxhdoxesqtdqwkxrmom.supabase.co`;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "probe";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "probe";
    try {
      assertBookingExplicitSandboxEnv();
      fail("protected ref must be blocked by assertBookingExplicitSandboxEnv");
    } catch (err) {
      if (String(/** @type {Error} */ (err).message).includes("BLOCKED")) {
        pass("assertBookingExplicitSandboxEnv blocks protected project ref");
      } else {
        fail(`unexpected block error: ${/** @type {Error} */ (err).message}`);
      }
    }

    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${BOOKING_SANDBOX_PROJECT_REF}.supabase.co`;
    delete process.env.BOOKING_SANDBOX_ENV_LOADED;
    try {
      assertBookingExplicitSandboxEnv();
      fail("missing BOOKING_SANDBOX_ENV_LOADED must throw");
    } catch (err) {
      if (String(/** @type {Error} */ (err).message).includes("BOOKING_SANDBOX_ENV_LOADED")) {
        pass("assertBookingExplicitSandboxEnv requires BOOKING_SANDBOX_ENV_LOADED");
      } else {
        fail(`unexpected env error: ${/** @type {Error} */ (err).message}`);
      }
    }

    process.env.BOOKING_SANDBOX_ENV_LOADED = "1";
    assertBookingDatabaseTarget(process.env.NEXT_PUBLIC_SUPABASE_URL);
    pass("sandbox URL passes assertBookingDatabaseTarget with flags");
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();