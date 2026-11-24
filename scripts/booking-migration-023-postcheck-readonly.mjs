/** Read-only extended post-apply for migration 023 (no DDL). */

import pg from "pg";
import { assertBookingDatabaseTarget, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const client = new pg.Client({
  connectionString: resolveReadonlyDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  assertBookingDatabaseTarget(getSupabaseEnv().url);
  await client.connect();
  const q = async (sql, params = []) => (await client.query(sql, params)).rows;

  const out = {
    indexes: await q(
      `select indexname, tablename from pg_indexes where schemaname = 'phase2_harness' order by tablename, indexname`,
    ),
    constraints: await q(
      `select con.conname, rel.relname as table_name
       from pg_constraint con
       join pg_class rel on rel.oid = con.conrelid
       join pg_namespace n on n.oid = rel.relnamespace
       where n.nspname = 'phase2_harness'
       order by rel.relname, con.conname`,
    ),
    fn_count: await q(
      `select count(p.oid)::int as n from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'phase2_harness'`,
    ),
    runs_count: await q(`select count(run_id)::int as n from phase2_harness.runs`),
    anon_exec: await q(
      `select has_function_privilege('anon', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
    ),
    service_exec: await q(
      `select has_function_privilege('service_role', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
    ),
    cleanup_snippets: await q(
      `select
         pg_get_functiondef(p.oid) like '%fixture_customers_incomplete%' as c1,
         pg_get_functiondef(p.oid) like '%digest_mismatch_before_delete%' as pre_delete
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'phase2_harness' and p.proname = 'cleanup_execute'`,
    ),
  };

  try {
    out.mig023 = await q(
      `select version, name from supabase_migrations.schema_migrations
       where version like '%023%' order by version`,
    );
  } catch (e) {
    out.mig023 = [{ error: "schema_migrations query failed" }];
  }

  console.log(JSON.stringify(out, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
