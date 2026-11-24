/**
 * Apply grant-booking-service-role-trigger-helpers.sql on allowlisted test DB only.
 * BOOKING_DB_READINESS=1 node scripts/booking-apply-integration-service-role-grant.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

async function probe(client) {
  const grants = await client.query(`
    select grantee, privilege_type
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = 'booking_normalize_member_role_text'
    order by grantee`);
  const meta = await client.query(`
    select pg_get_userbyid(p.proowner) as owner,
           p.prolang::regtype::text as lang,
           p.prosecdef as security_definer
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'booking_normalize_member_role_text'`);
  console.log(JSON.stringify({ grants: grants.rows, meta: meta.rows[0] }, null, 2));
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_DB_READINESS");
  const { target } = assertBookingExplicitSandboxEnv();
  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) throw new Error("Set SUPABASE_DB_PASSWORD or DATABASE_URL.");
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}`);

  const grantSql = readFileSync(
    resolve(ROOT, "scripts/grant-booking-service-role-trigger-helpers.sql"),
    "utf8",
  );

  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  console.log("Before grant:");
  await probe(client);

  console.log("\nApplying GRANT...");
  await client.query(grantSql);
  const ok = await client.query(`
    select has_function_privilege('service_role', 'public.booking_normalize_member_role_text(text)', 'EXECUTE') as can`);
  console.log("service_role EXECUTE:", ok.rows[0].can);

  console.log("\nAfter grant:");
  await probe(client);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});