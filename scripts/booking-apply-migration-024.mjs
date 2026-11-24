/**
 * Apply migration 024 (guest manage RPCs) — allowlisted DB only.
 *
 * BOOKING_APPLY_MIGRATION_024=1 BOOKING_ALLOW_REMOTE_TESTS=1 \
 *   node --env-file=.env.booking.test.local scripts/booking-apply-migration-024.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { assertBookingDatabaseTarget, assertBookingExplicitSandboxEnv, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIG_FILE = "024_booking_public_guest_manage.sql";

function sha256File(absPath) {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

async function migration024Applied(client) {
  const r = await client.query(
    `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_get_guest_appointment' limit 1`,
  );
  return r.rowCount > 0;
}

async function preflight(client) {
  assertBookingDatabaseTarget(getSupabaseEnv().url);

  const migPath = resolve(__dirname, `../supabase/migrations/${MIG_FILE}`);
  const hash = sha256File(migPath);
  console.log(`Migration 024 hash: ${hash}`);

  const who = await client.query("select current_user");
  if (who.rows[0]?.current_user !== "postgres") {
    throw new Error(`current_user must be postgres (got ${who.rows[0]?.current_user})`);
  }

  const createFn = await client.query(
    `select pg_get_function_result(p.oid) as result
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_create_appointment' limit 1`,
  );
  const resultType = createFn.rows[0]?.result ?? "";
  if (resultType.includes("manage_token")) {
    console.log("SKIP  booking_public_create_appointment already returns manage_token");
    return { skipApply: true, hash };
  }

  const slotFn = await client.query(
    `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_validate_public_slot' limit 1`,
  );
  if (slotFn.rowCount === 0) {
    throw new Error("Migration 015 not applied: booking_validate_public_slot missing");
  }

  return { skipApply: false, hash, migPath };
}

async function main() {
  if (process.env.BOOKING_APPLY_MIGRATION_024 !== "1") {
    console.log("Skip: set BOOKING_APPLY_MIGRATION_024=1");
    process.exit(0);
  }

  assertBookingExplicitSandboxEnv();

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    console.error("FAIL  Set SUPABASE_DB_PASSWORD or DATABASE_URL for DDL apply.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const pre = await preflight(client);
    if (pre.skipApply) {
      if (await migration024Applied(client)) {
        console.log("PASS  Migration 024 already applied.");
        process.exit(0);
      }
    }

    const sql = readFileSync(pre.migPath, "utf8");
    console.log("Applying 024_booking_public_guest_manage.sql …");
    await client.query(sql);

    const ok = await migration024Applied(client);
    if (!ok) throw new Error("Post-apply: booking_public_get_guest_appointment missing");

  const ret = await client.query(
    `select pg_get_function_result(p.oid) as result
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_create_appointment' limit 1`,
  );
  if (!String(ret.rows[0]?.result).includes("manage_token")) {
    throw new Error("create_appointment return type missing manage_token");
  }

    console.log("PASS  Migration 024 applied.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});