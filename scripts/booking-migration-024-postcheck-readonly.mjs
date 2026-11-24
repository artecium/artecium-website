/** Read-only post-apply for migration 024. */

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

  const fns = await client.query(
    `select proname from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and proname in (
         'booking_public_manage_token_hash',
         'booking_public_get_guest_appointment',
         'booking_public_cancel_guest_appointment',
         'booking_public_reschedule_guest_appointment'
       )
     order by proname`,
  );

  const ret = await client.query(
    `select pg_get_function_result(p.oid) as result
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_public_create_appointment' limit 1`,
  );

  console.log(
    JSON.stringify(
      {
        ref: getSupabaseEnv().url.match(/https:\/\/([^.]+)/)?.[1],
        guest_rpcs: fns.rows.map((r) => r.proname),
        create_appointment_returns_manage_token: String(ret.rows[0]?.result ?? "").includes("manage_token"),
      },
      null,
      2,
    ),
  );

  await client.end();
  if (fns.rowCount < 4) process.exit(1);
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});