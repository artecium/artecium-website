/**
 * Read-only: Phase 2 staff profile_id link prep (no DML).
 *
 * BOOKING_PHASE2_STAFF_LINK_READONLY=1 npx -p pg node --env-file=.env.booking.test.local scripts/booking-phase2-staff-profile-link-readonly.mjs
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import {
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  assertKeysPresent,
  assertLocalBookingTestEnabled,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const STAFF_EMAIL = BOOKING_TEST_USERS.staffMemberA.email;
const TARGET_STAFF_NAME = "Alex Provider";

async function main() {
  assertLocalBookingTestEnabled("BOOKING_PHASE2_STAFF_LINK_READONLY");
  const env = getSupabaseEnv();
  const target = assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userList, error: userErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (userErr) throw new Error(userErr.message);
  const authUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === STAFF_EMAIL.toLowerCase(),
  );
  if (!authUser) {
    console.log(JSON.stringify({ error: "auth_user_not_found", email: STAFF_EMAIL }, null, 2));
    process.exit(1);
  }

  const { data: biz, error: bizErr } = await admin
    .from("booking_businesses")
    .select("id, slug, name")
    .eq("slug", SLUGS.businessA)
    .maybeSingle();
  if (bizErr) throw new Error(bizErr.message);
  if (!biz) {
    console.log(JSON.stringify({ error: "business_not_found", slug: SLUGS.businessA }, null, 2));
    process.exit(1);
  }

  const { data: staffRows, error: staffErr } = await admin
    .from("booking_staff")
    .select("id, business_id, display_name, profile_id, is_active, email, sort_order")
    .eq("business_id", biz.id)
    .order("sort_order");
  if (staffErr) throw new Error(staffErr.message);

  const { data: profileRow, error: profErr } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", authUser.id)
    .maybeSingle();
  if (profErr) throw new Error(profErr.message);

  const staffWithSameProfile = staffRows?.filter(
    (s) => s.profile_id && String(s.profile_id) === String(authUser.id),
  );

  const alex = staffRows?.find((s) => s.display_name === TARGET_STAFF_NAME);

  let catalog = null;
  const dbUrl = resolveReadonlyDatabaseUrl();
  if (dbUrl) {
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();
    const con = await client.query(
      `select pg_get_constraintdef(c.oid) as def
       from pg_constraint c
       join pg_class rel on rel.oid = c.conrelid
       join pg_namespace n on n.oid = rel.relnamespace
       where n.nspname = 'public' and rel.relname = 'booking_staff'
         and c.contype = 'f' and c.conname like '%profile_id%'`,
    );
    const uniq = await client.query(
      `select indexname, indexdef
       from pg_indexes
       where schemaname = 'public' and tablename = 'booking_staff'
         and indexdef ilike '%profile_id%'`,
    );
    await client.end();
    catalog = {
      profile_fk: con.rows,
      profile_indexes: uniq.rows,
    };
  }

  const report = {
    target: { kind: target.kind, projectRef: target.projectRef },
    policy: "read_only_no_dml",
    auth_user: {
      email: STAFF_EMAIL,
      id: authUser.id,
    },
    profile_row: profileRow
      ? { id: profileRow.id, email: profileRow.email, full_name: profileRow.full_name }
      : null,
    business_a: { id: biz.id, slug: biz.slug, name: biz.name },
    staff_on_business_a: (staffRows ?? []).map((s) => ({
      id: s.id,
      display_name: s.display_name,
      profile_id: s.profile_id,
      is_active: s.is_active,
    })),
    staff_already_linked_to_auth_user: staffWithSameProfile ?? [],
    alex_provider: alex
      ? {
          id: alex.id,
          display_name: alex.display_name,
          profile_id: alex.profile_id,
          business_id: alex.business_id,
          belongs_to_business_a: String(alex.business_id) === String(biz.id),
          profile_id_free: alex.profile_id == null,
        }
      : null,
    constraints: catalog,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
