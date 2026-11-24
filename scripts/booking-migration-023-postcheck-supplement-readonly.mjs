/** Extra read-only fields for 023 postcheck (guard, grants, tables, fixtures). */

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
  const q = async (sql) => (await client.query(sql)).rows;

  const digestBody = (
    await q(
      `select pg_get_functiondef(p.oid) as def
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'phase2_harness' and p.proname = 'compute_cleanup_digest'`,
    )
  )[0]?.def;

  const out = {
    guard: await q(`select id, cleanup_armed, armed_at, armed_by, environment_tag from phase2_harness.deployment_guard`),
    tables: await q(`select tablename from pg_tables where schemaname = 'phase2_harness' order by tablename`),
    privileges: {
      postgres_cleanup_execute: (
        await q(
          `select has_function_privilege('postgres', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
        )
      )[0]?.can,
      authenticated_cleanup_execute: (
        await q(
          `select has_function_privilege('authenticated', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
        )
      )[0]?.can,
      anon_cleanup_execute: (
        await q(
          `select has_function_privilege('anon', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
        )
      )[0]?.can,
      service_role_cleanup_execute: (
        await q(
          `select has_function_privilege('service_role', 'phase2_harness.cleanup_execute(uuid,text,text)', 'EXECUTE') as can`,
        )
      )[0]?.can,
    },
    digest_algorithm_version_3: typeof digestBody === "string" && digestBody.includes('"digest_algorithm_version":3'),
    harness_fixture_customers: (
      await q(
        `select count(*)::int as n from booking_customers where email like 'phase2-notes-fixture%@artecium.test'`,
      )
    )[0]?.n,
    booking_rls_policies_count: (await q(`select count(*)::int as n from pg_policies where schemaname = 'public'`))[0]?.n,
  };

  console.log(JSON.stringify(out, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});