/**
 * Read-only PostgreSQL catalog probe for migration 022 preflight.
 *
 * CLI: npx -p pg node --env-file=.env.booking.test.local scripts/booking-migration-022-pg-probe.mjs
 */

import pg from "pg";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const TRIGGER_022 = "booking_customer_internal_notes_business_match";
const FN_022 = "booking_is_professional_member";
const UNIQUE_022 = "booking_customers_id_business_key";
const FK_022 = "booking_customer_internal_notes_customer_business_fkey";

/** @returns {Promise<Record<string, unknown>>} */
export async function runBookingMigration022PgProbe() {
  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    return { error: "missing_database_url" };
  }

  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  async function q(sql, params = []) {
    const r = await client.query(sql, params);
    return r.rows;
  }

  const out = {};

  out.project = await q("select current_database() as db, current_user as db_user");

  out.fn_normalize = await q(
    `select p.oid::text as oid, pg_get_functiondef(p.oid) is not null as has_def
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_normalize_member_role_text' limit 1`,
  );

  out.trg_member_role = await q(
    `select t.tgname, c.relname as table_name
     from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and t.tgname = 'booking_normalize_member_role'`,
  );

  out.trg_invite_role = await q(
    `select t.tgname, c.relname as table_name
     from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and t.tgname = 'booking_normalize_invite_role'`,
  );

  out.chk_members_role = await q(
    `select con.conname, pg_get_constraintdef(con.oid) as def
     from pg_constraint con
     join pg_class rel on rel.oid = con.conrelid
     join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public' and rel.relname = 'booking_business_members'
       and con.conname = 'booking_business_members_role_check'`,
  );

  out.schema_comment_public = await q(
    `select coalesce(obj_description(n.oid, 'pg_namespace'), '') as descr
     from pg_namespace n where n.nspname = 'public'`,
  );

  out.fn_invite = await q(
    `select prosrc like '%professional%' as invite_mentions_professional
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'booking_create_member_invite' limit 1`,
  );

  out.col_role_comment = await q(
    `select coalesce(col_description('public.booking_business_members'::regclass, a.attnum), '') as descr
     from pg_attribute a
     where a.attrelid = 'public.booking_business_members'::regclass
       and a.attname = 'role' and not a.attisdropped`,
  );

  out.normalize_grants = await q(
    `select grantee, privilege_type
     from information_schema.routine_privileges
     where routine_schema = 'public' and routine_name = 'booking_normalize_member_role_text'
     order by grantee, privilege_type`,
  );

  const requiredTables = [
    "booking_businesses",
    "booking_business_members",
    "booking_appointments",
    "booking_customers",
    "booking_staff",
    "booking_services",
    "booking_time_off",
    "booking_business_subscriptions",
  ];
  out.tables = {};
  for (const t of requiredTables) {
    const rows = await q(
      `select 1 from information_schema.tables
       where table_schema = 'public' and table_name = $1 limit 1`,
      [t],
    );
    out.tables[t] = rows.length > 0;
  }

  out.customers_notes_col = await q(
    `select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'booking_customers' and column_name = 'notes' limit 1`,
  );

  try {
    out.notes_migration_stats = await q(
      `select
         count(*) filter (where notes is not null and trim(notes) <> '') as nonempty_notes,
         count(*) as total_customers
       from public.booking_customers`,
    );
  } catch (e) {
    out.notes_migration_stats = { error: e.message };
  }

  out.internal_notes_table = await q(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'booking_customer_internal_notes' limit 1`,
  );

  out.named_constraints = await q(
    `select con.conname, con.contype, rel.relname as table_name
     from pg_constraint con
     join pg_class rel on rel.oid = con.conrelid
     join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public'
       and con.conname = any($1::text[])`,
    [[UNIQUE_022, FK_022]],
  );

  out.named_triggers = await q(
    `select t.tgname, c.relname as table_name
     from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and t.tgname = $1`,
    [TRIGGER_022],
  );

  out.fn_022 = await q(
    `select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = $1 limit 1`,
    [FN_022],
  );

  out.unique_id_business = await q(
    `select con.conname, con.contype, con.conkey::smallint[] as conkey
     from pg_constraint con
     join pg_class rel on rel.oid = con.conrelid
     join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public' and rel.relname = 'booking_customers' and con.contype = 'u'`,
  );

  await client.end();
  return out;
}

const isMain = process.argv[1]?.includes("booking-migration-022-pg-probe.mjs");
if (isMain) {
  const out = await runBookingMigration022PgProbe();
  console.log(JSON.stringify(out));
  process.exit(out.error ? 1 : 0);
}
