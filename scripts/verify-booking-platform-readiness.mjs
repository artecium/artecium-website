/**
 * Static tests for booking-readiness-lib and read-only script contracts (no database).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOKING_RPC_CHECKS,
  BOOKING_TABLE_CHECKS,
  PLATFORM_TABLE_CHECKS,
  isMissingColumn,
  isMissingRelation,
  isMissingRpc,
  summarizeBookingBaseline,
  pgCatalogChecksUnknown,
  splitByVerifiability,
  summarizeByMigration,
} from "./booking-readiness-lib.mjs";
import { sanitizeBookingLoginNext, sanitizeLoginNext } from "../src/lib/auth/login-redirect.ts";
import { assertBookingDatabaseTarget } from "./booking-test-guards.mjs";
import { BOOKING_ALLOWLISTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PLATFORM_READINESS_ENV = "BOOKING_PLATFORM_READINESS";

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

function main() {
  if (isMissingRelation({ code: "PGRST205", message: "schema cache" })) {
    pass("isMissingRelation — PGRST205");
  } else fail("isMissingRelation — PGRST205");

  if (!isMissingRelation({ code: "42501", message: "permission denied" })) {
    pass("isMissingRelation — not for permission denied");
  } else fail("isMissingRelation — not for permission denied");

  if (isMissingColumn({ code: "PGRST204", message: "column id does not exist" })) {
    pass("isMissingColumn — PGRST204");
  } else fail("isMissingColumn — PGRST204");

  if (!isMissingRelation({ code: "PGRST204", message: "column id does not exist on staff_company_assignments" })) {
    pass("isMissingRelation — not for missing column");
  } else fail("isMissingRelation — not for missing column");

  const staff = PLATFORM_TABLE_CHECKS.find((c) => c.name === "staff_company_assignments");
  if (staff?.columns === "user_id,company_id") {
    pass("staff_company_assignments probe uses composite key columns");
  } else {
    fail("staff_company_assignments probe uses composite key columns");
  }

  const baseline = summarizeBookingBaseline([
    { migration: "012", name: "booking_businesses", method: "rest", status: "missing" },
    { migration: "012", name: "rpc:booking_public_get_business", method: "rest", status: "missing" },
  ]);
  if (baseline.coreBookingAbsent && baseline.confirmedAbsent.includes("booking_businesses")) {
    pass("summarizeBookingBaseline — core absent");
  } else {
    fail("summarizeBookingBaseline — core absent");
  }

  if (isMissingRpc({ message: "Could not find the function public.foo" })) {
    pass("isMissingRpc — function not found");
  } else fail("isMissingRpc — function not found");

  const sample = [
    { migration: "001", name: "profiles", method: "rest", status: "ok" },
    { migration: "012", name: "booking_businesses", method: "rest", status: "missing" },
    { migration: "012", name: "extension:btree_gist", method: "pg", status: "unknown" },
  ];
  const summary = summarizeByMigration(sample);
  if (summary["001"]?.ok === 1 && summary["012"]?.missing === 1 && summary["012"]?.unknown === 1) {
    pass("summarizeByMigration");
  } else fail("summarizeByMigration");

  const buckets = splitByVerifiability(sample);
  if (buckets.confirmedPresent.length === 1 && buckets.confirmedAbsent.length === 1 && buckets.notVerifiable.length === 1) {
    pass("splitByVerifiability");
  } else fail("splitByVerifiability");

  const unknowns = pgCatalogChecksUnknown();
  if (unknowns.length > 0 && unknowns.every((c) => c.status === "unknown")) {
    pass("pgCatalogChecksUnknown — all unknown");
  } else fail("pgCatalogChecksUnknown");

  if (sanitizeBookingLoginNext("/booking/admin/appointments") === "/booking/admin/appointments") {
    pass("sanitizeBookingLoginNext — booking path");
  } else fail("sanitizeBookingLoginNext — booking path");

  if (sanitizeBookingLoginNext("//evil") === "/booking/admin/dashboard") {
    pass("sanitizeBookingLoginNext — blocks unsafe");
  } else fail("sanitizeBookingLoginNext — blocks unsafe");

  if (
    sanitizeBookingLoginNext("/client/booking/team") === "/client/booking/team"
  ) {
    pass("sanitizeBookingLoginNext — client booking team");
  } else fail("sanitizeBookingLoginNext — client booking team");

  if (sanitizeLoginNext("/client/invoices") === "/client/invoices") {
    pass("sanitizeLoginNext — client path");
  } else fail("sanitizeLoginNext — client path");

  if (PLATFORM_TABLE_CHECKS.length >= 9 && BOOKING_TABLE_CHECKS.length >= 5 && BOOKING_RPC_CHECKS.length >= 4) {
    pass("probe catalog lists populated");
  } else fail("probe catalog lists populated");

  const allowlisted = BOOKING_ALLOWLISTED_PROJECT_REFS[0];
  process.env.BOOKING_ALLOW_REMOTE_TESTS = "1";
  assertBookingDatabaseTarget(`https://${allowlisted}.supabase.co`);
  pass("allowlisted project passes guard");

  const platformScript = readFileSync(resolve(ROOT, "scripts/booking-platform-dependencies-readiness.mjs"), "utf8");
  const libScript = readFileSync(resolve(ROOT, "scripts/booking-readiness-lib.mjs"), "utf8");

  const writePatterns = [
    /\.insert\s*\(/,
    /\.update\s*\(/,
    /\.upsert\s*\(/,
    /\.delete\s*\(/,
  ];

  for (const re of writePatterns) {
    if (!re.test(platformScript)) {
      pass(`platform script has no ${re.source}`);
    } else {
      fail(`platform script must not use ${re.source}`);
    }
  }

  if (
    platformScript.includes("assertBookingDatabaseTarget") &&
    platformScript.includes(PLATFORM_READINESS_ENV)
  ) {
    pass("platform script uses guards and explicit env flag");
  } else {
    fail("platform script uses guards and explicit env flag");
  }

  if (libScript.includes("select 1 from pg_extension") && !libScript.match(/client\.query\s*\(\s*["'`]\s*(insert|update|delete|drop|alter|create)/i)) {
    pass("pg helper uses SELECT-only DML check");
  } else {
    fail("pg helper SELECT-only");
  }

  if (platformScript.includes("probeTableRest") && libScript.includes(".select(columns).limit(0)")) {
    pass("read-only REST probes use select limit 0");
  } else {
    fail("read-only REST probes use select limit 0");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
