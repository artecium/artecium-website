/**
 * Read-only Booking schema/RPC readiness checks (no writes).
 *
 * Usage (after copying .env.booking.sandbox.local.example):
 *   BOOKING_DB_READINESS=1 node --env-file=.env.booking.sandbox.local scripts/booking-db-readiness.mjs
 *
 * Does not run unless BOOKING_DB_READINESS=1 and guards pass.
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
  probeRpcRest,
  probeTableRest,
  summarizeByMigration,
} from "./booking-readiness-lib.mjs";

function createRoleClients(env) {
  const service = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { service_role: service, anon };
}

function clientForRole(clients, role) {
  if (role === "service_role") return clients.service_role;
  return clients.anon;
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_DB_READINESS");
  const env = getSupabaseEnv();
  const target = assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);

  const clients = createRoleClients(env);

  const checks = [];

  for (const c of BOOKING_TABLE_CHECKS) {
    const r = await probeTableRest(clients.service_role, c.table, c.columns ?? "id", {
      expectPermissionDenied: Boolean(c.serviceRoleExpectPermissionDenied),
    });
    checks.push({
      migration: c.migration,
      name: c.name,
      method: "rest-select",
      clientRole: "service_role",
      outcome: r.outcome,
      ...r,
    });
  }

  for (const c of BOOKING_RPC_CHECKS) {
    const role = c.clientRole ?? "anon";
    const client = clientForRole(clients, role);
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

  const summary = summarizeByMigration(checks);

  console.log(JSON.stringify({ target: target.kind, projectRef: target.projectRef, checks, summary }, null, 2));

  const anyMissing = checks.some((r) => r.status === "missing");
  const anyError = checks.some((r) => r.status === "error");
  if (anyMissing || anyError) process.exit(1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
