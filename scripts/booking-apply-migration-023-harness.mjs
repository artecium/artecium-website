/**
 * Apply migration 023 phase2 harness (v2.6 content) — allowlisted test DB only.
 *
 * BOOKING_APPLY_MIGRATION_023=1 \
 *   node --env-file=.env.booking.sandbox.local scripts/booking-apply-migration-023-harness.mjs
 *
 * Optional: BOOKING_MIGRATION_023_POSTCHECK_ONLY=1 for read-only post-apply verification (no DDL).
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  assertBookingExplicitSandboxEnv,
  extractSupabaseProjectRef,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { BOOKING_SANDBOX_PROJECT_REF } from "./booking-integration-fixtures.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_REF = BOOKING_SANDBOX_PROJECT_REF;
const AUTHORIZED_HASH = "f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36";
const MIG_FILE = "023_phase2_harness_persistent_tracking.sql";

function sha256File(absPath) {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

async function preflight(client) {
  const env = getSupabaseEnv();
  const ref = extractSupabaseProjectRef(env.url);
  if (ref !== EXPECTED_REF) {
    throw new Error(`Project ref mismatch: got ${ref}, expected ${EXPECTED_REF}`);
  }

  const migPath = resolve(__dirname, `../supabase/migrations/${MIG_FILE}`);
  const hash = sha256File(migPath);
  if (hash !== AUTHORIZED_HASH) {
    throw new Error(`Migration file hash mismatch: ${hash}`);
  }

  const who = await client.query("select current_user, session_user, current_database()");
  const user = who.rows[0]?.current_user;
  if (user !== "postgres") {
    throw new Error(`current_user must be postgres (got ${user})`);
  }

  const notes = await client.query(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'booking_customer_internal_notes' limit 1`,
  );
  if (notes.rowCount === 0) {
    throw new Error("Migration 022 not applied: booking_customer_internal_notes missing");
  }

  const fn022 = await client.query(
    `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_is_professional_member' limit 1`,
  );
  if (fn022.rowCount === 0) {
    throw new Error("Migration 022 not applied: booking_is_professional_member missing");
  }

  const harnessSchema = await client.query(
    `select 1 from pg_namespace where nspname = 'phase2_harness' limit 1`,
  );
  if (harnessSchema.rowCount > 0) {
    throw new Error("phase2_harness schema already exists — refusing apply");
  }

  const partial = await client.query(
    `select p.proname from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'phase2_harness' limit 5`,
  );
  if (partial.rowCount > 0) {
    throw new Error(`Partial phase2_harness objects: ${partial.rows.map((r) => r.proname).join(", ")}`);
  }

  return { ref, hash, db_user: user };
}

async function postcheck(client) {
  const out = {};

  out.identity = (await client.query("select current_user, session_user")).rows[0];

  out.schema = await client.query(
    `select nspname from pg_namespace where nspname = 'phase2_harness'`,
  );

  out.tables = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'phase2_harness'
     order by table_name`,
  );

  out.deployment_guard = await client.query(
    `select id, cleanup_armed, armed_at from phase2_harness.deployment_guard`,
  );

  out.key_functions = await client.query(
    `select p.proname from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'phase2_harness'
       and p.proname in (
         'cleanup_execute', 'compute_cleanup_digest', '_cleanup_abort_run',
         'run_start', 'cleanup_preview', 'cleanup_approve'
       )
     order by p.proname`,
  );

  out.digest_v3 = await client.query(
    `select pg_get_functiondef(p.oid) like '%digest_algorithm_version\":3%' as has_v3
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'phase2_harness' and p.proname = 'compute_cleanup_digest' limit 1`,
  );

  out.fn_grants = await client.query(
    `select grantee, privilege_type
     from information_schema.routine_privileges
     where specific_schema = 'phase2_harness' and routine_name = 'cleanup_execute'
     order by grantee, privilege_type`,
  );

  out.auth_execute = await client.query(
    `select has_function_privilege('authenticated', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
  );

  out.table_grants_runs = await client.query(
    `select grantee, privilege_type
     from information_schema.table_privileges
     where table_schema = 'phase2_harness' and table_name = 'runs'
     order by grantee`,
  );

  return out;
}

async function main() {
  const postOnly = process.env.BOOKING_MIGRATION_023_POSTCHECK_ONLY === "1";
  const apply = process.env.BOOKING_APPLY_MIGRATION_023 === "1";

  if (!postOnly && !apply) {
    console.log("Skip: set BOOKING_APPLY_MIGRATION_023=1 or BOOKING_MIGRATION_023_POSTCHECK_ONLY=1");
    process.exit(0);
  }

  assertBookingExplicitSandboxEnv();

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DB_PASSWORD");
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const pre = await preflight(client);
    console.log("PASS  Preflight", JSON.stringify(pre));

    if (apply && !postOnly) {
      const sql = readFileSync(resolve(__dirname, `../supabase/migrations/${MIG_FILE}`), "utf8");
      console.log(`Applying ${MIG_FILE} (${pre.hash.slice(0, 12)}…)…`);
      await client.query(sql);
      console.log("PASS  Migration SQL executed");
    }

    const post = await postcheck(client);
    console.log("POSTCHECK", JSON.stringify(post, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
