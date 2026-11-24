/**
 * Authorized Phase 2 execute: staff link (A) + migration 022 (B) + validation (C).
 *
 * BOOKING_PHASE2_AUTHORIZED_EXECUTE=1 npx -p pg node --env-file=.env.booking.test.local scripts/booking-phase2-authorized-execute.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
  extractSupabaseProjectRef,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";
import { runBookingMigration022PgProbe } from "./booking-migration-022-pg-probe.mjs";
import {
  MIGRATION_022_FILE,
  PHASE2_RLS_CASES,
  readMigration022Sql,
} from "./booking-professional-rls-phase2-lib.mjs";
import {
  runRemoteP2Check,
  resolveIntegrationBusyRpcRange,
} from "./booking-phase2-p2-harness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_REF = "bwxhdoxesqtdqwkxrmom";
const APPROVED_M022_SHA256_PREFIX = "961bb64ae6c71b3d";

const STAFF_ID = "2da5cb1f-c6a1-4e3c-8877-0aa489693d55";
const BIZ_A_ID = "370f57ab-3a74-404e-a4b2-dfeee78f8f3e";
const PROFILE_ID = "c58c645b-1603-467c-bf46-9c4fa3f879ab";

/** @type {Record<string, 'PASS'|'FAIL'|'SKIP'|'BLOCKED'>} */
const p2Results = {};

function shaPrefix(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function phaseA(client) {
  console.log("\n=== FASE A — Ligação professional ↔ staff ===\n");
  await client.query("BEGIN");
  try {
    const before = await client.query(
      `select id, business_id, display_name, profile_id
       from public.booking_staff
       where id = $1::uuid for update`,
      [STAFF_ID],
    );
    if (before.rowCount !== 1) {
      await client.query("ROLLBACK");
      throw new Error(`FASE A: expected 1 staff row, got ${before.rowCount}`);
    }
    const row = before.rows[0];
    console.log("BEFORE", JSON.stringify(row));
    if (String(row.business_id) !== BIZ_A_ID || row.display_name !== "Alex Provider") {
      await client.query("ROLLBACK");
      throw new Error("FASE A: staff row identity mismatch");
    }
    if (row.profile_id != null) {
      await client.query("ROLLBACK");
      throw new Error("FASE A: profile_id not NULL — abort without change");
    }

    const upd = await client.query(
      `update public.booking_staff
       set profile_id = $1::uuid
       where id = $2::uuid
         and business_id = $3::uuid
         and profile_id is null`,
      [PROFILE_ID, STAFF_ID, BIZ_A_ID],
    );
    if (upd.rowCount !== 1) {
      await client.query("ROLLBACK");
      throw new Error(`FASE A: UPDATE rowCount=${upd.rowCount}, expected 1`);
    }

    const after = await client.query(
      `select id, business_id, display_name, profile_id
       from public.booking_staff where id = $1::uuid`,
      [STAFF_ID],
    );
    console.log("AFTER ", JSON.stringify(after.rows[0]));
    if (String(after.rows[0].profile_id) !== PROFILE_ID) {
      await client.query("ROLLBACK");
      throw new Error("FASE A: profile_id after UPDATE mismatch");
    }

    await client.query("COMMIT");
    console.log("FASE A OK — COMMIT (1 row updated)\n");
    return { ok: true, before: row, after: after.rows[0] };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }
}

async function phaseBPreflight(env, client) {
  console.log("\n=== FASE B — Pré-checks ===\n");
  const ref = extractSupabaseProjectRef(env.url);
  if (ref !== EXPECTED_REF) throw new Error(`Project ref ${ref} !== ${EXPECTED_REF}`);
  console.log(`PASS  project ref ${ref}`);

  const sql = readMigration022Sql();
  const prefix = shaPrefix(sql);
  if (prefix !== APPROVED_M022_SHA256_PREFIX) {
    throw new Error(`Migration 022 SHA prefix ${prefix} !== approved ${APPROVED_M022_SHA256_PREFIX}`);
  }
  console.log(`PASS  local 022 SHA prefix ${prefix}`);

  const probe = await runBookingMigration022PgProbe();
  if (!(probe.fn_normalize?.length > 0) || !(probe.trg_member_role?.length > 0)) {
    throw new Error("FASE B: migration 020 catalog objects missing");
  }
  if (!(probe.col_role_comment?.[0]?.descr ?? "").toLowerCase().includes("professional")) {
    throw new Error("FASE B: migration 021 column comment missing");
  }
  console.log("PASS  migrations 020/021 (catalog)");

  const fn022 = await client.query(
    `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_is_professional_member' limit 1`,
  );
  if (fn022.rowCount > 0) {
    throw new Error("FASE B: 022 appears already applied (booking_is_professional_member exists)");
  }
  console.log("PASS  022 not yet applied");
}

async function phaseBApply(client) {
  console.log("\n=== FASE B — Apply migration 022 SQL ===\n");
  const path = resolve(__dirname, "../supabase/migrations", MIGRATION_022_FILE);
  const sql = readFileSync(path, "utf8");
  await client.query(sql);
  console.log("FASE B OK — 022 SQL executed as single session statement batch\n");
}

async function phaseCValidation(client, env, password) {
  console.log("\n=== FASE C — Validação catálogo ===\n");
  const checks = [
    ["booking_is_professional_member", "function"],
    ["booking_staff_ids_for_auth_user", "function"],
    ["booking_customer_internal_notes", "table"],
    ["booking_customers_member", "view"],
    ["booking_time_off_availability", "view"],
  ];
  for (const [name, kind] of checks) {
    let ok = false;
    if (kind === "function") {
      const r = await client.query(
        `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = $1 limit 1`,
        [name],
      );
      ok = r.rowCount > 0;
    } else if (kind === "table") {
      const r = await client.query(
        `select 1 from information_schema.tables
         where table_schema = 'public' and table_name = $1 limit 1`,
        [name],
      );
      ok = r.rowCount > 0;
    } else {
      const r = await client.query(
        `select 1 from information_schema.views
         where table_schema = 'public' and table_name = $1 limit 1`,
        [name],
      );
      ok = r.rowCount > 0;
    }
    console.log(`${ok ? "PASS" : "FAIL"}  ${kind} ${name}`);
    if (!ok) throw new Error(`Missing ${kind} ${name}`);
  }

  const trig = await client.query(
    `select t.tgname from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
     where c.relname = 'booking_customer_internal_notes'
       and not t.tgisinternal and t.tgname = 'booking_customer_internal_notes_business_match'`,
  );
  console.log(`${trig.rowCount ? "PASS" : "FAIL"}  trigger booking_customer_internal_notes_business_match`);

  const notesCol = await client.query(
    `select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'booking_customers' and column_name = 'notes'`,
  );
  console.log(`${notesCol.rowCount === 0 ? "PASS" : "FAIL"}  booking_customers.notes dropped`);

  const uniq = await client.query(
    `select conname from pg_constraint con
     join pg_class rel on rel.oid = con.conrelid
     where rel.relname = 'booking_customers' and conname = 'booking_customers_id_business_key'`,
  );
  console.log(`${uniq.rowCount ? "PASS" : "FAIL"}  UNIQUE booking_customers_id_business_key`);

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function signIn(email) {
    const anon = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`);
    return createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    });
  }

  const staffClient = await signIn(BOOKING_TEST_USERS.staffMemberA.email);
  const ownerClient = await signIn(BOOKING_TEST_USERS.ownerA.email);
  const managerClient = await signIn(BOOKING_TEST_USERS.managerA.email);
  const ownerBClient = await signIn(BOOKING_TEST_USERS.ownerB.email);

  const { data: bizA } = await admin.from("booking_businesses").select("id").eq("slug", SLUGS.businessA).single();
  const { data: bizB } = await admin.from("booking_businesses").select("id").eq("slug", SLUGS.businessB).single();
  const { data: staffAlex } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Alex Provider")
    .single();
  const { data: staffSam } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Sam Provider")
    .single();

  const { data: aptSeed } = await admin
    .from("booking_appointments")
    .select("starts_at")
    .eq("business_id", bizA.id)
    .eq("public_reference", "bk_seed_confirmed")
    .maybeSingle();
  const seedMondayIso = aptSeed?.starts_at ? aptSeed.starts_at.slice(0, 10) : null;
  const range = resolveIntegrationBusyRpcRange({ seedMondayIso });

  const { data: rpcStaffIds, error: rpcErr } = await staffClient.rpc("booking_staff_ids_for_auth_user", {
    p_business_id: bizA.id,
  });
  const idsOk =
    !rpcErr &&
    Array.isArray(rpcStaffIds) &&
    rpcStaffIds.length === 1 &&
    String(rpcStaffIds[0]) === String(staffAlex.id);
  console.log(`${idsOk ? "PASS" : "FAIL"}  booking_staff_ids_for_auth_user → Alex for professional A`);
  if (!idsOk) console.log("       ", rpcErr?.message ?? JSON.stringify(rpcStaffIds));

  await runP2Tests({
    admin,
    staffClient,
    ownerClient,
    managerClient,
    bizA: bizA.id,
    bizB: bizB.id,
    staffAlexId: staffAlex.id,
    staffSamId: staffSam.id,
    password,
    env,
    range,
  });
}

async function runP2Tests(ctx) {
  console.log("\n=== FASE C — Testes P2-01 … P2-23 ===\n");

  for (const c of PHASE2_RLS_CASES) {
    if (!c.remote) {
      p2Results[c.id] = "SKIP";
      console.log(`SKIP  ${c.id}  ${c.title} (local-only — see verify harness)`);
      continue;
    }
    try {
      const result = await runRemoteP2Check(c.id, ctx.staffClient, ctx);
      p2Results[c.id] = result.status;
      console.log(
        `${result.status.padEnd(7)}  ${c.id}  ${c.title}${result.detail ? ` — ${result.detail}` : ""}`,
      );
    } catch (e) {
      p2Results[c.id] = "FAIL";
      console.log(`FAIL    ${c.id}  ${c.title}: ${e.message ?? e}`);
    }
  }
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_PHASE2_AUTHORIZED_EXECUTE");
  const { env } = assertBookingExplicitSandboxEnv();
  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password) throw new Error(`Missing ${BOOKING_TEST_PASSWORD_ENV}`);

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) throw new Error("Missing DB URL / SUPABASE_DB_PASSWORD");

  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  const phaseAResult = await phaseA(client);
  await phaseBPreflight(env, client);
  await phaseBApply(client);
  await phaseCValidation(client, env, password);

  await client.end();

  console.log("\n=== RESUMO P2 ===");
  for (const c of PHASE2_RLS_CASES) {
    const st = p2Results[c.id] ?? "?";
    console.log(`${st.padEnd(5)} ${c.id}  ${c.title}`);
  }

  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIP: 0 };
  for (const v of Object.values(p2Results)) counts[v] = (counts[v] ?? 0) + 1;
  console.log("\nP2 counts:", counts);
  process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nABORT:", e.message ?? e);
  process.exit(1);
});
