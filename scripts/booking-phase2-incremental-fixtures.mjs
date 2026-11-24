/**
 * Non-destructive Phase 2 fixture top-up on existing integration seed.
 * Does NOT delete businesses, staff, or appointments. Preserves Alex ↔ staffMemberA link.
 *
 * Dry-run: node scripts/booking-phase2-incremental-fixtures.mjs --dry-run
 * Apply (authorized): BOOKING_PHASE2_INCREMENTAL_FIXTURES=1 + guards + env file
 */

import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_INTEGRATION_MEMBERSHIP_ROWS,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  PHASE2_SAM_TIME_OFF_LABEL,
  SLUGS,
  computeSamTimeOffInterval,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const add = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** @param {unknown} data @param {{ message?: string } | null} error @param {string} context */
function requireOk(data, error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
  return data;
}

/** @param {import("@supabase/supabase-js").SupabaseClient} admin @param {string} email */
async function findAuthUserIdByEmail(admin, email) {
  const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  requireOk(list, error, "listUsers");
  const hit = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return hit?.id ?? null;
}

/** @param {import("@supabase/supabase-js").SupabaseClient} admin @param {string} email @param {string} password */
async function createAuthUser(admin, email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

function isoEqual(a, b) {
  if (!a || !b) return false;
  return new Date(a).toISOString() === new Date(b).toISOString();
}

function printDryRunPlan() {
  console.log("=== Phase 2 incremental fixtures (DRY RUN — no network) ===\n");
  console.log("Preserves: integration-salon-a/b/inactive, all UUIDs, Alex profile_id link.");
  console.log("No DELETE on booking_businesses or integration data.\n");
  console.log("Pre-validation (before Auth create when possible):");
  console.log("  - business A slug + integration_marker");
  console.log("  - exactly one Alex Provider on A");
  console.log("  - Alex profile_id matches staffMemberA auth user (read-only check)");
  console.log("  - Sam Provider present; compute expected time_off window");
  console.log("  - global booking_staff scan if unlinked user already exists\n");
  console.log("Operations when authorized:\n");
  console.log("1. createAuthUser(professionalUnlinkedA) only if pre-checks pass and user missing");
  console.log("2. Abort if ANY booking_staff.profile_id = unlinked user (all businesses)");
  console.log("3. Upsert membership on A; SELECT and require role = professional exactly");
  console.log("4. Sam time_off: require exact staff_id, label, starts_at, ends_at or INSERT");
  console.log("   (abort if label matches but interval differs, or interval matches wrong label)");
  console.log("\nIntegration seed membership rows (full re-seed):", BOOKING_INTEGRATION_MEMBERSHIP_ROWS);
}

async function main() {
  if (
    process.argv.includes("--dry-run") ||
    process.env.BOOKING_PHASE2_INCREMENTAL_FIXTURES_DRY_RUN === "1"
  ) {
    printDryRunPlan();
    return;
  }

  assertLocalBookingTestEnabled("BOOKING_PHASE2_INCREMENTAL_FIXTURES");
  const { env } = assertBookingExplicitSandboxEnv();

  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password || password.length < 12) {
    throw new Error(`Set ${BOOKING_TEST_PASSWORD_ENV} (min 12 chars).`);
  }

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /** @type {Record<string, unknown>} */
  const report = { steps: [] };

  const unlinkedEmail = BOOKING_TEST_USERS.professionalUnlinkedA.email;
  const staffMemberEmail = BOOKING_TEST_USERS.staffMemberA.email;

  const { data: bizA, error: bizErr } = await admin
    .from("booking_businesses")
    .select("id, slug, settings")
    .eq("slug", SLUGS.businessA)
    .single();
  requireOk(bizA, bizErr, "load integration-salon-a");
  if (bizA.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
    throw new Error("business A is not integration seed (marker mismatch)");
  }
  report.business_a_id = bizA.id;

  const { data: alexRows, error: alexErr } = await admin
    .from("booking_staff")
    .select("id, profile_id, display_name, business_id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Alex Provider");
  requireOk(alexRows, alexErr, "list Alex Provider on business A");
  if ((alexRows?.length ?? 0) !== 1) {
    throw new Error(
      `expected exactly one Alex Provider on business A, found ${alexRows?.length ?? 0}`,
    );
  }
  const alex = alexRows[0];
  report.alex_before = { staff_id: alex.id, profile_id: alex.profile_id };

  const staffMemberUserIdBefore = await findAuthUserIdByEmail(admin, staffMemberEmail);
  if (!staffMemberUserIdBefore) {
    throw new Error(
      `${staffMemberEmail} auth user missing — integration seed/auth required before incremental fixtures`,
    );
  }
  if (alex.profile_id !== staffMemberUserIdBefore) {
    throw new Error(
      `Alex ↔ staffMemberA mismatch: Alex.profile_id=${alex.profile_id ?? "null"} expected ${staffMemberUserIdBefore} (not modified by this script)`,
    );
  }
  report.alex_staff_member_link = {
    staff_id: alex.id,
    profile_id: alex.profile_id,
    staff_member_auth_user_id: staffMemberUserIdBefore,
    status: "verified_unchanged",
  };

  const { data: sam, error: samErr } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Sam Provider")
    .maybeSingle();
  requireOk(sam, samErr, "load Sam Provider");
  if (!sam) throw new Error("Sam Provider staff row missing on business A");
  report.sam_staff_id = sam.id;

  const { data: aptSeed, error: aptErr } = await admin
    .from("booking_appointments")
    .select("starts_at")
    .eq("business_id", bizA.id)
    .eq("public_reference", "bk_seed_confirmed")
    .maybeSingle();
  requireOk(aptSeed, aptErr, "load bk_seed_confirmed anchor");
  const anchor = aptSeed?.starts_at ? new Date(aptSeed.starts_at) : nextMonday();
  const expectedSamOff = computeSamTimeOffInterval(anchor);
  report.expected_sam_time_off = expectedSamOff;

  const { data: samTimeOffRows, error: toListErr } = await admin
    .from("booking_time_off")
    .select("id, staff_id, label, starts_at, ends_at")
    .eq("staff_id", sam.id);
  requireOk(samTimeOffRows, toListErr, "list Sam time_off rows");

  let timeOffInserted = 0;
  let matchedTimeOffId = null;
  const exactMatch = (samTimeOffRows ?? []).find(
    (r) =>
      r.staff_id === sam.id &&
      r.label === expectedSamOff.label &&
      isoEqual(r.starts_at, expectedSamOff.starts_at) &&
      isoEqual(r.ends_at, expectedSamOff.ends_at),
  );
  if (exactMatch) {
    matchedTimeOffId = exactMatch.id;
  } else {
    for (const row of samTimeOffRows ?? []) {
      if (row.label === expectedSamOff.label) {
        throw new Error(
          `Sam time_off label "${PHASE2_SAM_TIME_OFF_LABEL}" exists but interval differs (starts_at=${row.starts_at}, ends_at=${row.ends_at}); expected ${expectedSamOff.starts_at} → ${expectedSamOff.ends_at}`,
        );
      }
      if (
        isoEqual(row.starts_at, expectedSamOff.starts_at) &&
        isoEqual(row.ends_at, expectedSamOff.ends_at)
      ) {
        throw new Error(
          `Sam time_off interval matches fixture but label="${row.label}" !== "${expectedSamOff.label}"`,
        );
      }
    }
    const { data: inserted, error: toErr } = await admin
      .from("booking_time_off")
      .insert({
        staff_id: sam.id,
        starts_at: expectedSamOff.starts_at,
        ends_at: expectedSamOff.ends_at,
        label: expectedSamOff.label,
      })
      .select("id, staff_id, label, starts_at, ends_at")
      .single();
    requireOk(inserted, toErr, "insert Sam time_off");
    timeOffInserted = 1;
    matchedTimeOffId = inserted.id;
    report.sam_time_off_after = inserted;
  }
  report.sam_time_off_before_count = samTimeOffRows?.length ?? 0;
  report.sam_time_off_inserted = timeOffInserted;
  report.sam_time_off_id = matchedTimeOffId;

  let unlinkedUserId = await findAuthUserIdByEmail(admin, unlinkedEmail);
  report.professional_unlinked_auth_before = unlinkedUserId;
  let authUserCreated = 0;
  if (unlinkedUserId) {
    const { data: staffLinkedGlobally, error: linkErr } = await admin
      .from("booking_staff")
      .select("id, business_id, display_name, profile_id")
      .eq("profile_id", unlinkedUserId);
    requireOk(staffLinkedGlobally, linkErr, "global staff profile_id scan (unlinked user)");
    if ((staffLinkedGlobally?.length ?? 0) > 0) {
      throw new Error(
        `professionalUnlinked user is linked to booking_staff (${staffLinkedGlobally.map((s) => s.id).join(",")}) — resolve manually; will not unlink`,
      );
    }
  } else {
    unlinkedUserId = await createAuthUser(admin, unlinkedEmail, password);
    authUserCreated = 1;
    report.professional_unlinked_auth_after = unlinkedUserId;
  }
  report.professional_unlinked_auth_created = authUserCreated;

  const { data: staffLinkedAfter, error: linkAfterErr } = await admin
    .from("booking_staff")
    .select("id, business_id, display_name")
    .eq("profile_id", unlinkedUserId);
  requireOk(staffLinkedAfter, linkAfterErr, "global staff profile_id scan after auth ensure");
  if ((staffLinkedAfter?.length ?? 0) > 0) {
    throw new Error(
      "professionalUnlinked user linked to booking_staff after auth ensure — abort",
    );
  }

  const { data: memBefore, error: memBeforeErr } = await admin
    .from("booking_business_members")
    .select("role")
    .eq("business_id", bizA.id)
    .eq("user_id", unlinkedUserId)
    .maybeSingle();
  requireOk(memBefore, memBeforeErr, "membership before upsert");

  const { error: memErr } = await admin.from("booking_business_members").upsert(
    {
      business_id: bizA.id,
      user_id: unlinkedUserId,
      role: "professional",
    },
    { onConflict: "business_id,user_id", ignoreDuplicates: true },
  );
  if (memErr) throw new Error(`membership professional-unlinked upsert: ${memErr.message}`);

  const { data: memAfter, error: memAfterErr } = await admin
    .from("booking_business_members")
    .select("role")
    .eq("business_id", bizA.id)
    .eq("user_id", unlinkedUserId)
    .single();
  requireOk(memAfter, memAfterErr, "membership after upsert");
  if (memAfter.role !== "professional") {
    throw new Error(
      `membership role must be exactly professional, got "${memAfter.role}" (before: ${memBefore?.role ?? "none"})`,
    );
  }
  report.membership = {
    business_id: bizA.id,
    user_id: unlinkedUserId,
    role_before: memBefore?.role ?? null,
    role_after: memAfter.role,
  };

  const { data: alexAfter, error: alexAfterErr } = await admin
    .from("booking_staff")
    .select("id, profile_id")
    .eq("id", alex.id)
    .single();
  requireOk(alexAfter, alexAfterErr, "Alex after run");
  if (alexAfter.profile_id !== alex.profile_id) {
    throw new Error("Alex profile_id changed unexpectedly");
  }
  report.alex_after = { staff_id: alexAfter.id, profile_id: alexAfter.profile_id };

  console.log("Phase 2 incremental fixtures OK.");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
