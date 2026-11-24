/**
 * Read-only checklist for migrations 024, 025, 026 on a **production** Supabase project.
 * Does not apply DDL. Blocks integration-test project ref.
 *
 * BOOKING_PROD_READONLY=1 node scripts/booking-migration-prod-preflight-readonly.mjs
 */

import "./booking-load-prod-env.mjs";
import pg from "pg";
import {
  assertBookingProdReadonlyTarget,
  getBookingProdEnv,
} from "./booking-prod-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

function analyzeCreateAppointmentBody(def) {
  const slot = def.indexOf("booking_validate_public_slot");
  const existingLookup = def.indexOf("and a.idempotency_key = v_key");
  return {
    has_manage_token_hash: def.includes("manage_token_hash"),
    idempotency_lookup_before_slot:
      existingLookup >= 0 && slot >= 0 && existingLookup < slot,
    looks_like_024_order: slot >= 0 && existingLookup >= 0 && slot < existingLookup,
    looks_like_025_order: existingLookup >= 0 && slot >= 0 && existingLookup < slot,
  };
}

function checklist(items) {
  let fail = 0;
  for (const { id, ok, detail } of items) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? ` — ${detail}` : ""}`);
    if (!ok) fail += 1;
  }
  return fail;
}

async function main() {
  const env = getBookingProdEnv();
  const target = assertBookingProdReadonlyTarget(env.url);
  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    throw new Error("Set SUPABASE_DB_PASSWORD or DATABASE_URL in .env.booking.prod.local");
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const versions = [];
  let migrationsTable = true;
  try {
    const rows = await client.query(
      `select version, name from supabase_migrations.schema_migrations order by version`,
    );
    versions.push(...rows.rows);
  } catch (e) {
    migrationsTable = false;
  }

  const has024 = versions.some((r) => String(r.version).startsWith("024"));
  const has025 = versions.some((r) => String(r.version).startsWith("025"));
  const has026 = versions.some((r) => String(r.version).startsWith("026"));

  const guestRpc = await client.query(
    `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in (
       'booking_public_manage_token_hash',
       'booking_public_get_guest_appointment',
       'booking_public_cancel_guest_appointment',
       'booking_public_reschedule_guest_appointment'
     )`,
  );
  const guestRpcCount = guestRpc.rows[0]?.n ?? 0;

  const defRow = await client.query(
    `select pg_get_functiondef(p.oid) as def
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_create_appointment' limit 1`,
  );
  const def = defRow.rows[0]?.def ?? "";
  const createFn = analyzeCreateAppointmentBody(def);

  const manageCol = await client.query(
    `select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'booking_appointments'
       and column_name = 'manage_token_hash' limit 1`,
  );

  const grant = await client.query(
    `select
       has_function_privilege('service_role', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as service_role,
       has_function_privilege('anon', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as anon,
       has_function_privilege('authenticated', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as authenticated`,
  );
  const g = grant.rows[0] ?? {};

  const publicCreateGrant = await client.query(
    `select has_function_privilege('anon', 'public.booking_public_create_appointment(text, uuid, uuid, timestamptz, text, text, text, text)', 'EXECUTE') as anon`,
  );

  await client.end();

  console.log(`\nTarget: production ref ${target.projectRef}\n--- Migration 024 ---`);
  const fail024 = checklist([
    { id: "024.guest_manage_rpcs_present", ok: guestRpcCount === 4, detail: `${guestRpcCount}/4` },
    { id: "024.manage_token_hash_column", ok: manageCol.rowCount > 0 },
    {
      id: "024.create_appointment_returns_manage_token_semantics",
      ok: createFn.has_manage_token_hash,
    },
    {
      id: "024.schema_migrations_row",
      ok: migrationsTable ? has024 : true,
      detail: migrationsTable ? (has024 ? "listed" : "missing row") : "table not visible (probe objects instead)",
    },
  ]);

  console.log("\n--- Migration 025 ---");
  const fail025 = checklist([
    {
      id: "025.idempotency_before_slot_validation",
      ok: createFn.looks_like_025_order,
      detail: createFn.looks_like_024_order ? "still 024 order" : "OK",
    },
    {
      id: "025.schema_migrations_row",
      ok: migrationsTable ? has025 : true,
      detail: migrationsTable ? (has025 ? "listed" : "missing row") : "table not visible",
    },
    { id: "025.public_create_still_anon_executable", ok: publicCreateGrant.rows[0]?.anon === true },
  ]);

  console.log("\n--- Migration 026 ---");
  const fail026 = checklist([
    { id: "026.service_role_execute_on_normalize_helper", ok: g.service_role === true },
    { id: "026.anon_not_granted", ok: g.anon === false },
    { id: "026.authenticated_not_granted", ok: g.authenticated === false },
    {
      id: "026.schema_migrations_row",
      ok: migrationsTable ? has026 : true,
      detail: migrationsTable ? (has026 ? "listed" : "missing row") : "table not visible",
    },
  ]);

  const total = fail024 + fail025 + fail026;
  console.log(`\nPreflight summary: ${total === 0 ? "READY (read-only)" : `BLOCKED (${total} checks failed)`}`);
  process.exit(total === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});