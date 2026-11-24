/**
 * Full read-only Supabase database audit (SELECT / catalog only).
 * Loads .env.booking.test.local then .env.local (same order as integration tests).
 *
 * BOOKING_ALLOW_REMOTE_TESTS=1 node scripts/supabase-full-db-audit-readonly.mjs
 */

import "./booking-load-test-env.mjs";
import pg from "pg";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSupabaseProjectRef, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function refOnly() {
  const env = getSupabaseEnv();
  const ref = extractSupabaseProjectRef(env.url);
  return { ref, hasUrl: Boolean(env.url) };
}

async function main() {
  const { ref, hasUrl } = refOnly();
  if (!ref || !hasUrl) {
    console.error(JSON.stringify({ error: "Missing or invalid NEXT_PUBLIC_SUPABASE_URL" }));
    process.exit(1);
  }

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    console.error(JSON.stringify({ error: "No DATABASE_URL or SUPABASE_DB_PASSWORD for read-only connection" }));
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
  });
  await client.connect();

  const out = {
    audited_at: new Date().toISOString(),
    project_ref: ref,
    current_user: (await client.query("select current_user, session_user")).rows[0],
    database: (await client.query("select current_database() as name")).rows[0]?.name,
  };

  out.extensions = (
    await client.query(
      `select e.extname, n.nspname as schema
       from pg_extension e join pg_namespace n on n.oid = e.extnamespace
       order by 1`,
    )
  ).rows;

  out.schemas = (
    await client.query(
      `select nspname from pg_namespace
       where nspname not like 'pg_%' and nspname <> 'information_schema'
       order by 1`,
    )
  ).rows.map((r) => r.nspname);

  out.tables = (
    await client.query(
      `select
         n.nspname as schema,
         c.relname as name,
         c.relkind as kind,
         c.relrowsecurity as rls_enabled,
         c.relforcerowsecurity as rls_forced,
         coalesce(s.n_live_tup, 0)::bigint as estimate_rows,
         pg_total_relation_size(c.oid) as total_bytes
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       left join pg_stat_user_tables s on s.relid = c.oid
       where c.relkind in ('r', 'p', 'm', 'v')
         and n.nspname not like 'pg_%'
         and n.nspname <> 'information_schema'
       order by 1, 2`,
    )
  ).rows;

  out.row_counts = {};
  const countTargets = out.tables.filter((t) => t.kind === "r" && ["public", "phase2_harness", "auth", "storage"].includes(t.schema));
  for (const t of countTargets) {
    try {
      const r = await client.query({
        text: `select count(*)::bigint as c from ${quoteIdent(t.schema)}.${quoteIdent(t.name)}`,
      });
      out.row_counts[`${t.schema}.${t.name}`] = Number(r.rows[0]?.c ?? 0);
    } catch (e) {
      out.row_counts[`${t.schema}.${t.name}`] = { error: String(e.message ?? e).slice(0, 120) };
    }
  }

  out.columns_public = (
    await client.query(
      `select table_name, column_name, data_type, is_nullable, column_default
       from information_schema.columns
       where table_schema = 'public'
       order by table_name, ordinal_position`,
    )
  ).rows;

  out.foreign_keys = (
    await client.query(
      `select
         tc.constraint_name,
         tc.table_schema,
         tc.table_name,
         kcu.column_name,
         ccu.table_schema as foreign_table_schema,
         ccu.table_name as foreign_table_name,
         ccu.column_name as foreign_column_name
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu
         on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
       join information_schema.constraint_column_usage ccu
         on ccu.constraint_name = tc.constraint_name
       where tc.constraint_type = 'FOREIGN KEY'
         and tc.table_schema in ('public', 'phase2_harness')
       order by tc.table_schema, tc.table_name`,
    )
  ).rows;

  out.rls_policies = (
    await client.query(
      `select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
       from pg_policies
       where schemaname in ('public', 'phase2_harness', 'storage')
       order by 1, 2, 3`,
    )
  ).rows;

  out.tables_rls_no_policies = (
    await client.query(
      `select n.nspname as schema, c.relname as table_name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where c.relkind = 'r'
         and c.relrowsecurity = true
         and n.nspname in ('public', 'phase2_harness', 'storage')
         and not exists (
           select 1 from pg_policies p
           where p.schemaname = n.nspname and p.tablename = c.relname
         )
       order by 1, 2`,
    )
  ).rows;

  out.public_tables_no_rls = (
    await client.query(
      `select n.nspname as schema, c.relname as table_name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where c.relkind = 'r'
         and c.relrowsecurity = false
         and n.nspname = 'public'
       order by 2`,
    )
  ).rows;

  out.functions_public = (
    await client.query(
      `select
         p.proname as name,
         pg_get_function_identity_arguments(p.oid) as args,
         p.prosecdef as security_definer,
         p.provolatile as volatility,
         pg_get_userbyid(p.proowner) as owner
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
       order by 1, 2`,
    )
  ).rows;

  out.triggers_public = (
    await client.query(
      `select event_object_table as table_name, trigger_name, action_timing, event_manipulation
       from information_schema.triggers
       where trigger_schema = 'public'
       order by 1, 2`,
    )
  ).rows;

  out.grants_public_tables = (
    await client.query(
      `select grantee, table_name, privilege_type
       from information_schema.role_table_grants
       where table_schema = 'public'
         and grantee in ('anon', 'authenticated', 'service_role', 'postgres', 'PUBLIC')
       order by table_name, grantee, privilege_type`,
    )
  ).rows;

  try {
    out.schema_migrations = (
      await client.query(`select version, name from supabase_migrations.schema_migrations order by version`)
    ).rows;
  } catch (e) {
    out.schema_migrations = { error: String(e.message ?? e) };
  }

  try {
    out.storage_buckets = (await client.query(`select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by name`)).rows;
  } catch (e) {
    out.storage_buckets = { error: String(e.message ?? e) };
  }

  try {
    out.auth_users_count = (await client.query(`select count(*)::bigint as c from auth.users`)).rows[0]?.c;
  } catch (e) {
    out.auth_users_count = { error: String(e.message ?? e) };
  }

  // payments/invoices: no deleted_at column (001_initial_schema); do not filter soft-delete here.
  out.aggregates = {};
  const aggQueries = {
    companies: `select count(*)::bigint as c from public.companies where deleted_at is null`,
    companies_all: `select count(*)::bigint as c from public.companies`,
    company_users: `select count(*)::bigint as c from public.company_users`,
    profiles: `select count(*)::bigint as c from public.profiles`,
    client_subscriptions_by_status: `select status, count(*)::bigint as c from public.client_subscriptions where deleted_at is null group by status order by 1`,
    client_subscriptions_by_service: `select s.slug, count(*)::bigint as c from public.client_subscriptions cs join public.services s on s.id = cs.service_id where cs.deleted_at is null group by s.slug order by 1`,
    payments_by_status: `select status, count(*)::bigint as c from public.payments group by status order by 1`,
    invoices_by_status: `select status, count(*)::bigint as c from public.invoices group by status order by 1`,
    projects_active: `select count(*)::bigint as c from public.projects where deleted_at is null`,
    domains: `select count(*)::bigint as c from public.domains where deleted_at is null`,
    hosting: `select count(*)::bigint as c from public.hosting where deleted_at is null`,
    booking_businesses: `select count(*)::bigint as c from public.booking_businesses`,
    booking_businesses_no_company: `select count(*)::bigint as c from public.booking_businesses where company_id is null`,
    booking_members: `select count(*)::bigint as c from public.booking_business_members`,
    booking_appointments: `select count(*)::bigint as c from public.booking_appointments`,
    booking_services: `select count(*)::bigint as c from public.booking_services`,
    booking_staff: `select count(*)::bigint as c from public.booking_staff`,
    booking_member_invites: `select greatest(c.reltuples::bigint, 0) as c from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='booking_member_invites'`,
    orphans_profiles_no_company: `select count(*)::bigint as c from public.profiles p where not exists (select 1 from public.company_users cu where cu.user_id = p.id)`,
    phase2_harness_runs: `select count(*)::bigint as c from phase2_harness.runs`,
  };

  for (const [key, sql] of Object.entries(aggQueries)) {
    try {
      const r = await client.query(sql);
      out.aggregates[key] = r.rows;
    } catch (e) {
      out.aggregates[key] = { error: String(e.message ?? e).slice(0, 160) };
    }
  }

  out.test_markers = {};
  try {
    out.test_markers.booking_integration_businesses = (
      await client.query(
        `select count(*)::bigint as c from public.booking_businesses where slug like 'integration-%' or settings::text like '%artecium-booking-integration%'`,
      )
    ).rows[0]?.c;
    out.test_markers.test_domain_emails = (
      await client.query(
        `select count(*)::bigint as c from public.profiles where email like '%@artecium.test' or email like '%@example.com'`,
      )
    ).rows[0]?.c;
  } catch (e) {
    out.test_markers.error = String(e.message ?? e);
  }

  const migDir = resolve(__dirname, "../supabase/migrations");
  const repoMigrations = readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => ({
      file: f,
      version: f.split("_")[0],
      sha256: createHash("sha256").update(readFileSync(resolve(migDir, f))).digest("hex"),
    }));
  out.repo_migration_files = repoMigrations.length;
  out.repo_migration_versions = [...new Set(repoMigrations.map((m) => m.version))].sort();

  const dbTables = new Set(out.tables.filter((t) => t.schema === "public" && t.kind === "r").map((t) => t.name));
  const codeTables = scanCodeTables();
  out.code_table_refs_not_in_db = [...codeTables].filter((t) => !dbTables.has(t)).sort();
  out.db_public_tables_not_in_code = [...dbTables].filter((t) => !codeTables.has(t)).sort();

  await client.end();
  console.log(JSON.stringify(out, null, 2));
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function scanCodeTables() {
  const roots = [resolve(__dirname, "../src"), resolve(__dirname)];
  const tables = new Set();
  const re = /\.from\s*\(\s*["'`]([a-z_][a-z0-9_]*)["'`]/gi;
  for (const root of roots) {
    walk(root, (path) => {
      if (!/\.(ts|tsx|mjs|js)$/.test(path)) return;
      if (path.includes("node_modules")) return;
      const text = readFileSync(path, "utf8");
      let m;
      while ((m = re.exec(text))) tables.add(m[1]);
    });
  }
  return tables;
}

function walk(dir, fn) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) walk(p, fn);
    else fn(p);
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: String(e.message ?? e) }));
  process.exit(1);
});