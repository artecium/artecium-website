/**
 * Read-only: compare schema_migrations vs direct SQL apply of 023.
 *
 * BOOKING_ALLOW_REMOTE_TESTS=1 BOOKING_EXPECTED_PROJECT_REF=bwxhdoxesqtdqwkxrmom \
 *   node --env-file=.env.booking.test.local scripts/booking-migration-023-schema-migrations-readonly.mjs
 */

import pg from "pg";
import { assertBookingDatabaseTarget, extractSupabaseProjectRef, getSupabaseEnv } from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const EXPECTED_REF = "bwxhdoxesqtdqwkxrmom";

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

  const out = { ref, current_user: (await client.query("select current_user")).rows[0]?.current_user };

  try {
    out.schema_migrations_table = await client.query(
      `select 1 from information_schema.tables
       where table_schema = 'supabase_migrations' and table_name = 'schema_migrations' limit 1`,
    );
    out.all_versions = (
      await client.query(`select version, name from supabase_migrations.schema_migrations order by version`)
    ).rows;
    out.has_022 = out.all_versions.some((r) => String(r.version).startsWith("022"));
    out.has_023 = out.all_versions.some((r) => String(r.version).startsWith("023"));
  } catch (e) {
    out.schema_migrations_error = e instanceof Error ? e.message : String(e);
  }

  out.phase2_harness = (
    await client.query(`select 1 from pg_namespace where nspname = 'phase2_harness'`)
  ).rowCount;

  await client.end();
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
