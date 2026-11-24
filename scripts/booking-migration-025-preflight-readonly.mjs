/**
 * Read-only preflight for migration 025 publication (schema_migrations + function order).
 *
 * BOOKING_ALLOW_REMOTE_TESTS=1 BOOKING_EXPECTED_PROJECT_REF=bwxhdoxesqtdqwkxrmom \
 *   node --env-file=.env.booking.test.local scripts/booking-migration-025-preflight-readonly.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { assertBookingDatabaseTarget, extractSupabaseProjectRef, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_REF = "bwxhdoxesqtdqwkxrmom";

function sha256File(rel) {
  const abs = resolve(__dirname, "../supabase/migrations", rel);
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

function analyzeCreateAppointmentBody(def) {
  const slot = def.indexOf("booking_validate_public_slot");
  const existingLookup = def.indexOf("and a.idempotency_key = v_key");
  const manageToken = def.includes("manage_token_hash");
  return {
    has_manage_token_fields: manageToken,
    idempotency_lookup_before_slot:
      existingLookup >= 0 && slot >= 0 && existingLookup < slot,
    looks_like_024_order: slot >= 0 && existingLookup >= 0 && slot < existingLookup,
    looks_like_025_order: existingLookup >= 0 && slot >= 0 && existingLookup < slot,
  };
}

async function main() {
  const env = getSupabaseEnv();
  assertBookingDatabaseTarget(env.url);
  const ref = extractSupabaseProjectRef(env.url);
  if (ref !== EXPECTED_REF) throw new Error(`ref mismatch: ${ref}`);

  const client = new pg.Client({
    connectionString: resolveReadonlyDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const out = {
    ref,
    migration_file_hashes: {
      "024_booking_public_guest_manage.sql": sha256File("024_booking_public_guest_manage.sql"),
      "025_booking_public_create_idempotency_before_slot.sql": sha256File(
        "025_booking_public_create_idempotency_before_slot.sql",
      ),
    },
  };

  try {
    const rows = (
      await client.query(`select version, name from supabase_migrations.schema_migrations order by version`)
    ).rows;
    out.schema_migrations = rows;
    out.has_024 = rows.some((r) => String(r.version).startsWith("024"));
    out.has_025 = rows.some((r) => String(r.version).startsWith("025"));
    out.has_026 = rows.some((r) => String(r.version).startsWith("026"));
  } catch (e) {
    out.schema_migrations_error = e instanceof Error ? e.message : String(e);
  }

  const defRow = await client.query(
    `select pg_get_functiondef(p.oid) as def
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_create_appointment' limit 1`,
  );
  const def = defRow.rows[0]?.def ?? "";
  out.booking_public_create_appointment = analyzeCreateAppointmentBody(def);

  const grant = await client.query(
    `select
       has_function_privilege('service_role', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as service_role,
       has_function_privilege('anon', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as anon,
       has_function_privilege('authenticated', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as authenticated`,
  );
  out.booking_normalize_member_role_text_execute = grant.rows[0];

  await client.end();
  console.log(JSON.stringify(out, null, 2));

  const order = out.booking_public_create_appointment;
  if (!order.idempotency_lookup_before_slot) process.exit(2);
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});