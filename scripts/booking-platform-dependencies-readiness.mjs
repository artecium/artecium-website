/**
 * Read-only platform + Booking dependency checks before migrations 012–016.
 *
 * Usage (future, with explicit approval):
 *   BOOKING_PLATFORM_READINESS=1 node --env-file=.env.booking.test.local scripts/booking-platform-dependencies-readiness.mjs
 *
 * No writes: REST .select().limit(0) and optional PostgreSQL SELECT only.
 */

import { createClient } from "@supabase/supabase-js";
import {
  assertBookingDatabaseTarget,
  assertKeysPresent,
  assertLocalBookingTestEnabled,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import {
  BOOKING_RPC_CHECKS,
  BOOKING_TABLE_CHECKS,
  PLATFORM_TABLE_CHECKS,
  pgCatalogChecksUnknown,
  probeRpcRest,
  probeTableRest,
  resolveReadonlyDatabaseUrl,
  runPgCatalogProbes,
  splitByVerifiability,
  summarizeBookingBaseline,
  summarizeByMigration,
} from "./booking-readiness-lib.mjs";

const ENABLE_ENV = "BOOKING_PLATFORM_READINESS";

async function main() {
  assertLocalBookingTestEnabled(ENABLE_ENV);
  const env = getSupabaseEnv();
  const target = assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /** @type {import('./booking-readiness-lib.mjs').ReadinessCheck[]} */
  const checks = [];

  for (const c of PLATFORM_TABLE_CHECKS) {
    const r = await probeTableRest(admin, c.table, c.columns ?? "id");
    checks.push({
      migration: c.migration,
      name: c.name,
      method: "rest-select",
      ...r,
    });
  }

  for (const c of BOOKING_TABLE_CHECKS) {
    const r = await probeTableRest(admin, c.table, c.columns ?? "id");
    checks.push({
      migration: c.migration,
      name: c.name,
      method: "rest-select",
      ...r,
    });
  }

  for (const c of BOOKING_RPC_CHECKS) {
    const role = c.clientRole ?? "anon";
    const client = role === "service_role" ? admin : anon;
    const r = await probeRpcRest(client, c.fn, c.args, {
      expectSuccess: Boolean(c.expectSuccess),
      expectValidationFailure: Boolean(c.expectValidationFailure),
    });
    checks.push({
      migration: c.migration,
      name: c.name ?? `rpc:${c.fn}`,
      method: "rest-rpc-probe",
      clientRole: role,
      outcome: r.outcome,
      ...r,
    });
  }

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (dbUrl) {
    try {
      checks.push(...(await runPgCatalogProbes(dbUrl)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.push({
        migration: "catalog",
        name: "postgres_catalog_probe",
        method: "postgres-select",
        status: "error",
        detail: msg,
      });
    }
  } else {
    checks.push(...pgCatalogChecksUnknown());
  }

  const summary = summarizeByMigration(checks);
  const buckets = splitByVerifiability(checks);

  const bookingBaseline = summarizeBookingBaseline(checks);

  const report = {
    target: target.kind,
    projectRef: target.projectRef,
    bookingBaseline,
    catalogReadOnly:
      dbUrl != null
        ? "postgres-select (extensions, functions, schema_migrations when accessible)"
        : "unavailable — set SUPABASE_DB_PASSWORD or DATABASE_URL; catalog checks are unknown not missing",
    readyForBooking012: buckets.confirmedAbsent.some((c) => c.migration === "012" && c.name === "booking_businesses")
      ? buckets.errors.length === 0 &&
        !PLATFORM_TABLE_CHECKS.some((t) =>
          checks.find((c) => c.name === t.name && c.status === "missing"),
        )
      : false,
    note: "readyForBooking012 is heuristic: platform tables ok, booking_businesses missing, no probe errors",
    summary,
    confirmedPresent: buckets.confirmedPresent.map(({ migration, name, method }) => ({ migration, name, method })),
    confirmedAbsent: buckets.confirmedAbsent.map(({ migration, name, method, detail }) => ({
      migration,
      name,
      method,
      detail,
    })),
    notVerifiable: buckets.notVerifiable.map(({ migration, name, method, detail }) => ({
      migration,
      name,
      method,
      detail,
    })),
    errors: buckets.errors.map(({ migration, name, method, detail }) => ({ migration, name, method, detail })),
    checks,
  };

  console.log(JSON.stringify(report, null, 2));

  const failed =
    buckets.errors.length > 0 ||
    PLATFORM_TABLE_CHECKS.some((t) => checks.find((c) => c.name === t.name)?.status === "missing");

  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
