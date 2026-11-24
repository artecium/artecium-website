/**
 * Phase 3 read-only audit: migrations reconciliation, RLS, SECURITY DEFINER, OAuth/harness.
 * Migration probes use catalog/pg_policies (not data SELECT) where RLS would block the audit role.
 * BOOKING_ALLOW_REMOTE_TESTS=1 node scripts/supabase-phase3-audit-readonly.mjs
 */

import "./booking-load-test-env.mjs";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { extractSupabaseProjectRef, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "docs", "audit");

const MIGRATION_PROBES = [
  { v: "001", file: "001_initial_schema.sql", probes: [{ sql: "select 1 from public.roles limit 1", label: "roles" }, { sql: "select 1 from public.profiles limit 1", label: "profiles" }] },
  { v: "002", file: "002_services_plans_subscriptions.sql", probes: [{ sql: "select 1 from public.service_features limit 1", label: "service_features" }, { sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_subscription_entitlements'", label: "fn:get_subscription_entitlements" }] },
  { v: "003", file: "003_platform_hardening.sql", probes: [{ sql: "select 1 from public.staff_company_assignments limit 1", label: "staff_company_assignments" }, { sql: "select 1 from information_schema.columns where table_schema='public' and table_name='companies' and column_name='deleted_at'", label: "companies.deleted_at" }] },
  { v: "004", file: "004_security_hardening.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='staff_can_access_project'", label: "fn:staff_can_access_project" }] },
  { v: "005", file: "005_security_followup.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='set_updated_at'", label: "fn:set_updated_at" }] },
  { v: "006", file: "006_authenticated_select_grants.sql", probes: [{ sql: "select 1 from information_schema.role_table_grants where table_schema='public' and table_name='companies' and grantee='authenticated' and privilege_type='SELECT'", label: "grant:companies:authenticated:SELECT" }] },
  { v: "007", file: "007_storage_documents.sql", probes: [{ sql: "select 1 from storage.buckets where id='platform-documents'", label: "storage:platform-documents" }] },
  { v: "008", file: "008_auth_role_grants.sql", probes: [{ sql: "select 1 from information_schema.role_table_grants where table_schema='public' and table_name='user_roles' and grantee='authenticated'", label: "grant:user_roles:authenticated" }] },
  { v: "009", file: "009_service_role_company_payment_providers.sql", probes: [{ sql: "select 1 from information_schema.role_table_grants where table_schema='public' and table_name='company_payment_providers' and grantee='service_role'", label: "grant:company_payment_providers:service_role" }] },
  { v: "010", file: "010_payments_transaction_reference_unique.sql", probes: [{ sql: "select 1 from pg_indexes where schemaname='public' and indexname='idx_payments_transaction_reference_unique'", label: "idx_payments_transaction_reference_unique" }] },
  { v: "011", file: "011_service_plan_features_authenticated_select.sql", probes: [{ sql: "select 1 from information_schema.role_table_grants where table_schema='public' and table_name='service_plan_features' and grantee='authenticated' and privilege_type='SELECT'", label: "grant:service_plan_features:SELECT" }] },
  { v: "012", file: "012_booking_foundation.sql", probes: [{ sql: "select 1 from pg_extension where extname='btree_gist'", label: "ext:btree_gist" }, { sql: "select 1 from public.booking_businesses limit 1", label: "booking_businesses" }] },
  {
    v: "013",
    file: "013_booking_security_invites.sql",
    probes: [
      {
        sql: "select 1 from information_schema.tables where table_schema='public' and table_name='booking_member_invites'",
        label: "table:booking_member_invites",
      },
      {
        sql: "select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='booking_member_invites' and c.relrowsecurity",
        label: "rls:booking_member_invites",
      },
      {
        sql: "select (count(*)::int >= 2) as ok from pg_policies where schemaname='public' and tablename='booking_member_invites' and policyname in ('Booking managers read invites', 'Booking managers write invites')",
        label: "policies:booking_member_invites",
      },
      {
        sql: "select 1 from information_schema.columns where table_schema='public' and table_name='booking_appointments' and column_name='blocked_starts_at'",
        label: "blocked_starts_at",
      },
    ],
  },
  { v: "014", file: "014_booking_membership_hardening.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_accept_member_invite'", label: "fn:booking_accept_member_invite" }] },
  { v: "015", file: "015_booking_public_rpc_hardening.sql", probes: [{ sql: "select 1 from information_schema.columns where table_schema='public' and table_name='booking_appointments' and column_name='idempotency_request_hash'", label: "idempotency_request_hash" }] },
  { v: "016", file: "016_booking_public_catalog_slots.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_public_list_day_slots'", label: "fn:booking_public_list_day_slots" }] },
  { v: "017", file: "017_booking_public_idempotency_pgcrypto.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_public_idempotency_request_hash'", label: "fn:booking_public_idempotency_request_hash" }] },
  { v: "018", file: "018_google_oauth_tokens.sql", probes: [{ sql: "select 1 from information_schema.tables where table_schema='public' and table_name='google_oauth_tokens'", label: "google_oauth_tokens" }] },
  { v: "019", file: "019_booking_service_role_grants.sql", probes: [{ sql: "select has_table_privilege('service_role','public.booking_appointments','DELETE') as ok", label: "service_role:booking_appointments:DELETE" }] },
  { v: "020", file: "020_booking_member_role_professional_compat.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_normalize_member_role_text'", label: "fn:booking_normalize_member_role_text" }] },
  {
    v: "021",
    file: "021_booking_member_role_phase1_meta.sql",
    probes: [
      {
        sql: "select not has_function_privilege('public', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as revoked",
        label: "revoke public role EXECUTE on normalize helper",
      },
      {
        sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_description d on d.objoid=p.oid and d.objsubid=0 where n.nspname='public' and p.proname='booking_normalize_member_role_text' and d.description like 'Internal:%'",
        label: "comment:booking_normalize_member_role_text",
      },
    ],
  },
  { v: "022", file: "022_booking_professional_rls_scope.sql", probes: [{ sql: "select 1 from information_schema.tables where table_schema='public' and table_name='booking_customer_internal_notes'", label: "booking_customer_internal_notes" }] },
  { v: "023", file: "023_phase2_harness_persistent_tracking.sql", probes: [{ sql: "select 1 from pg_namespace where nspname='phase2_harness'", label: "schema:phase2_harness" }] },
  { v: "024", file: "024_booking_public_guest_manage.sql", probes: [{ sql: "select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_public_get_guest_appointment'", label: "fn:guest_get" }, { sql: "select 1 from information_schema.columns where table_schema='public' and table_name='booking_appointments' and column_name='manage_token_hash'", label: "manage_token_hash" }] },
  { v: "025", file: "025_booking_public_create_idempotency_before_slot.sql", probes: [{ sql: "select (position('and a.idempotency_key = v_key' in pg_get_functiondef(p.oid)) < position('booking_validate_public_slot' in pg_get_functiondef(p.oid))) as order_ok from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='booking_public_create_appointment'", label: "idempotency before slot" }] },
  { v: "026", file: "026_booking_service_role_member_role_helper_execute.sql", probes: [{ sql: "select has_function_privilege('service_role','public.booking_normalize_member_role_text(text)','EXECUTE') as ok", label: "grant service_role EXECUTE normalize" }] },
];

async function probe(client, sql) {
  try {
    const r = await client.query(sql);
    const row = r.rows[0];
    if (row && typeof row === "object" && Object.keys(row).length === 1) {
      const val = Object.values(row)[0];
      return { ok: Boolean(val) || val === 1 || val === "1" || val === true };
    }
    return { ok: r.rowCount > 0 };
  } catch (e) {
    return { ok: false, error: String(e.message ?? e).slice(0, 200) };
  }
}

async function main() {
  const ref = extractSupabaseProjectRef(getSupabaseEnv().url ?? "");
  if (ref !== "bwxhdoxesqtdqwkxrmom") {
    throw new Error(`Unexpected project ref: ${ref}`);
  }

  const client = new pg.Client({
    connectionString: resolveReadonlyDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    statement_timeout: 180000,
  });
  await client.connect();

  const out = { project_ref: ref, audited_at: new Date().toISOString() };

  out.schema_migrations = (
    await client.query(`select version, name from supabase_migrations.schema_migrations order by version`).catch(
      (e) => ({ error: String(e.message) }),
    )
  );

  const migDir = resolve(ROOT, "supabase/migrations");
  const allFiles = readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  out.migration_files_extra_023 = allFiles.filter((f) => f.startsWith("023_"));

  out.reconciliation = [];
  for (const row of MIGRATION_PROBES) {
    const results = [];
    for (const p of row.probes) {
      const r = await probe(client, p.sql);
      results.push({ ...p, ...r });
    }
    const allOk = results.filter((x) => !x.optional).every((x) => x.ok);
    const anyOk = results.some((x) => x.ok);
    let state = "not_applied";
    if (allOk) state = "applied";
    else if (anyOk) state = "partially_applied";
    const listed =
      Array.isArray(out.schema_migrations) && out.schema_migrations.some((m) => String(m.version) === row.v);
    out.reconciliation.push({
      version: row.v,
      file: row.file,
      schema_migrations_listed: listed,
      probes: results,
      state,
    });
  }

  const payCols = await client.query(
    `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='payments' order by ordinal_position`,
  );
  const invCols = await client.query(
    `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='invoices' order by ordinal_position`,
  );
  out.payments_invoices = {
    payments_columns: payCols.rows,
    invoices_columns: invCols.rows,
    payments_has_deleted_at: payCols.rows.some((c) => c.column_name === "deleted_at"),
    invoices_has_deleted_at: invCols.rows.some((c) => c.column_name === "deleted_at"),
  };

  const rlsFinance = await client.query(
    `select schemaname, tablename, policyname, cmd, roles, qual, with_check from pg_policies where tablename in ('payments','invoices') order by tablename, policyname`,
  );
  out.payments_invoices.rls_policies = rlsFinance.rows;

  out.payments_invoices.functions_referencing_payments_deleted_at = [];

  out.rls_policies = (
    await client.query(
      `select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname in ('public','storage','phase2_harness') order by schemaname, tablename, policyname`,
    )
  ).rows;

  out.rls_enabled_no_policy = (
    await client.query(
      `select n.nspname as schema, c.relname as table_name
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where c.relkind='r' and c.relrowsecurity=true
         and n.nspname in ('public','storage','phase2_harness')
         and not exists (select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname)`,
    )
  ).rows;

  const definerRows = await client.query(
    `select n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args,
            p.prosecdef as security_definer, pg_get_userbyid(p.proowner) as owner,
            p.proconfig as config
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where p.prosecdef and n.nspname in ('public','storage')
     order by 1,2,3`,
  );
  const grants = await client.query(
    `select grantee, routine_schema, routine_name, privilege_type
     from information_schema.routine_privileges
     where routine_schema='public' and grantee in ('anon','authenticated','service_role','PUBLIC')
     order by routine_name, grantee`,
  );
  const grantByFn = new Map();
  for (const g of grants.rows) {
    const k = `${g.routine_schema}.${g.routine_name}`;
    if (!grantByFn.has(k)) grantByFn.set(k, []);
    grantByFn.get(k).push(`${g.grantee}:${g.privilege_type}`);
  }
  out.security_definer = definerRows.rows.map((f) => ({
    ...f,
    execute_grants: grantByFn.get(`${f.schema}.${f.name}`) ?? [],
    anon_execute: (grantByFn.get(`public.${f.name}`) ?? []).some((x) => x.startsWith("anon:EXECUTE")),
    authenticated_execute: (grantByFn.get(`public.${f.name}`) ?? []).some((x) =>
      x.startsWith("authenticated:EXECUTE"),
    ),
  }));

  const sensitiveTables = [
    "google_oauth_tokens",
    "google_oauth_authorization_states",
    "phase2_harness.runs",
    "phase2_harness.deployment_guard",
    "phase2_harness.run_tracking",
    "phase2_harness.cleanup_audit_snapshots",
  ];
  out.sensitive_tables = {};
  for (const t of sensitiveTables) {
    const [schema, table] = t.includes(".") ? t.split(".") : ["public", t];
    const rls = await client.query(
      `select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=$1 and c.relname=$2`,
      [schema, table],
    );
    const pol = await client.query(
      `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname=$1 and tablename=$2`,
      [schema, table],
    );
    const tblGrants = await client.query(
      `select grantee, privilege_type from information_schema.role_table_grants where table_schema=$1 and table_name=$2 and grantee in ('anon','authenticated','service_role') order by grantee`,
      [schema, table],
    );
    const cnt = await client.query(`select count(*)::int as c from ${schema === "public" ? "public" : schema}.${table}`);
    out.sensitive_tables[t] = {
      rls_enabled: rls.rows[0]?.relrowsecurity ?? null,
      policies: pol.rows,
      table_grants: tblGrants.rows,
      row_count: cnt.rows[0]?.c,
      postgrest_exposure_risk:
        tblGrants.rows.some((g) => ["anon", "authenticated"].includes(g.grantee) && g.privilege_type !== "TRIGGER"),
    };
  }

  out.auth_profile_integrity = (
    await client.query(`
      select
        (select count(*)::int from auth.users) as auth_users,
        (select count(*)::int from public.profiles) as profiles,
        (select count(*)::int from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)) as auth_without_profile,
        (select count(*)::int from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)) as profiles_without_auth`)
  ).rows[0];

  await client.end();

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = resolve(OUT_DIR, "phase3-audit-raw.json");
  writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");

  const rlsPath = resolve(OUT_DIR, "RLS_INVENTORY.json");
  writeFileSync(rlsPath, JSON.stringify(out.rls_policies, null, 2), "utf8");

  console.log(JSON.stringify({
    project_ref: out.project_ref,
    reconciliation_summary: out.reconciliation.map((r) => ({ v: r.version, state: r.state, listed: r.schema_migrations_listed })),
    rls_policy_count: out.rls_policies.length,
    security_definer_count: out.security_definer.length,
    auth_integrity: out.auth_profile_integrity,
    payments_has_deleted_at: out.payments_invoices.payments_has_deleted_at,
    output: { jsonPath, rlsPath },
  }, null, 2));
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});