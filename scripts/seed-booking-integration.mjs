/**
 * Deterministic Booking integration seed (local or allowlisted remote test project).
 *
 * Requires migrations 001–016 applied on the target database.
 * Env: BOOKING_SEED=1 + .env.booking.sandbox.local (BOOKING_SANDBOX_ENV_LOADED=1)
 *
 * Usage: BOOKING_SEED=1 node --env-file=.env.booking.sandbox.local scripts/seed-booking-integration.mjs
 */

import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SEED_TIMEZONE,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";
import { acquireBookingSeedLock } from "./booking-seed-lock.mjs";

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const add = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function ensureAuthUser(admin, email, password) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

/** @param {import("@supabase/supabase-js").PostgrestSingleResponse<unknown>} result */
function assertDbOk(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
}

async function assertInsert(admin, table, row, context) {
  const result = await admin.from(table).insert(row);
  assertDbOk(result, context);
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_SEED");
  acquireBookingSeedLock();
  const { env, target } = assertBookingExplicitSandboxEnv();
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}`);

  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password || password.length < 12) {
    throw new Error(`Set ${BOOKING_TEST_PASSWORD_ENV} (min 12 chars, local only).`);
  }

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userIds = {};
  for (const [key, { email }] of Object.entries(BOOKING_TEST_USERS)) {
    userIds[key] = await ensureAuthUser(admin, email, password);
  }

  if (BOOKING_TEST_USERS.professionalUnlinkedA) {
    userIds.professionalUnlinkedA = await ensureAuthUser(
      admin,
      BOOKING_TEST_USERS.professionalUnlinkedA.email,
      password,
    );
  }

  // Remove prior seed businesses by marker
  const { data: oldBiz } = await admin
    .from("booking_businesses")
    .select("id")
    .contains("settings", { integration_marker: BOOKING_INTEGRATION_MARKER });

  for (const row of oldBiz ?? []) {
    const del = await admin.from("booking_businesses").delete().eq("id", row.id);
    assertDbOk(del, `delete prior integration business ${row.id}`);
  }

  async function createBusiness(slug, name, confirmationMode, isActive, ownerKey) {
    const { data, error } = await admin
      .from("booking_businesses")
      .insert({
        slug,
        name,
        timezone: SEED_TIMEZONE,
        confirmation_mode: confirmationMode,
        is_active: isActive,
        min_notice_minutes: 0,
        max_booking_days: 60,
        slot_interval_minutes: 15,
        settings: { integration_marker: BOOKING_INTEGRATION_MARKER },
      })
      .select("id")
      .single();
    if (error) throw new Error(`business ${slug}: ${error.message}`);

    await assertInsert(
      admin,
      "booking_business_members",
      {
        business_id: data.id,
        user_id: userIds[ownerKey],
        role: "owner",
      },
      `membership owner for ${slug}`,
    );
    await assertInsert(
      admin,
      "booking_business_subscriptions",
      { business_id: data.id },
      `subscription for ${slug}`,
    );
    return data.id;
  }

  const bizA = await createBusiness(
    SLUGS.businessA,
    "Integration Salon A",
    "automatic",
    true,
    "ownerA",
  );
  const bizB = await createBusiness(SLUGS.businessB, "Integration Salon B", "manual", true, "ownerB");
  const bizInactive = await createBusiness(
    SLUGS.inactive,
    "Integration Inactive",
    "automatic",
    false,
    "ownerA",
  );

  await assertInsert(
    admin,
    "booking_business_members",
    {
      business_id: bizA,
      user_id: userIds.managerA,
      role: "manager",
    },
    "membership manager for integration-salon-a",
  );
  await assertInsert(
    admin,
    "booking_business_members",
    {
      business_id: bizA,
      user_id: userIds.staffMemberA,
      role: "staff",
    },
    "membership staff/professional for integration-salon-a",
  );

  if (userIds.professionalUnlinkedA) {
    await assertInsert(
      admin,
      "booking_business_members",
      {
        business_id: bizA,
        user_id: userIds.professionalUnlinkedA,
        role: "professional",
      },
      "membership professional-unlinked for Phase 2 P2-05",
    );
  }

  const { data: svcActive } = await admin
    .from("booking_services")
    .insert({
      business_id: bizA,
      name: "Haircut",
      duration_minutes: 30,
      buffer_after_minutes: 15,
      is_active: true,
      sort_order: 1,
    })
    .select("id")
    .single();

  await admin.from("booking_services").insert({
    business_id: bizA,
    name: "Legacy (inactive)",
    duration_minutes: 30,
    is_active: false,
    sort_order: 2,
  });

  const { data: svcB } = await admin
    .from("booking_services")
    .insert({
      business_id: bizB,
      name: "Consultation",
      duration_minutes: 30,
      is_active: true,
    })
    .select("id")
    .single();

  const { data: staff1 } = await admin
    .from("booking_staff")
    .insert({
      business_id: bizA,
      display_name: "Alex Provider",
      accepts_online_bookings: true,
      is_active: true,
      sort_order: 1,
    })
    .select("id")
    .single();

  const { data: staff2 } = await admin
    .from("booking_staff")
    .insert({
      business_id: bizA,
      display_name: "Sam Provider",
      accepts_online_bookings: true,
      is_active: true,
      sort_order: 2,
    })
    .select("id")
    .single();

  await admin.from("booking_staff_services").insert([
    { staff_id: staff1.id, service_id: svcActive.id },
    { staff_id: staff2.id, service_id: svcActive.id },
  ]);

  for (let dow = 1; dow <= 5; dow++) {
    await admin.from("booking_working_hours").insert({
      staff_id: staff1.id,
      day_of_week: dow,
      start_time: "09:00:00",
      end_time: "17:00:00",
    });
    await admin.from("booking_working_hours").insert({
      staff_id: staff2.id,
      day_of_week: dow,
      start_time: "09:00:00",
      end_time: "17:00:00",
    });
  }

  await admin.from("booking_staff_breaks").insert({
    staff_id: staff1.id,
    day_of_week: 3,
    start_time: "12:00:00",
    end_time: "13:00:00",
  });

  const monday = nextMonday();
  const mondayIso = monday.toISOString().slice(0, 10);
  const wednesday = new Date(monday);
  wednesday.setDate(wednesday.getDate() + 2);
  const wednesdayIso = wednesday.toISOString().slice(0, 10);

  await admin.from("booking_time_off").insert({
    staff_id: staff1.id,
    starts_at: new Date(monday.getTime() + 5 * 86400000).toISOString(),
    ends_at: new Date(monday.getTime() + 6 * 86400000).toISOString(),
    label: "Integration time off Alex",
  });

  await admin.from("booking_time_off").insert({
    staff_id: staff2.id,
    starts_at: new Date(monday.getTime() + 2 * 86400000).toISOString(),
    ends_at: new Date(monday.getTime() + 2 * 86400000 + 4 * 3600000).toISOString(),
    label: "Integration time off Sam",
  });

  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: mondaySlots, error: slotsErr } = await anon.rpc("booking_public_list_day_slots", {
    p_business_slug: SLUGS.businessA,
    p_service_id: svcActive.id,
    p_staff_id: staff1.id,
    p_local_date: mondayIso,
  });
  if (slotsErr) {
    throw new Error(`list_day_slots for seed appointments: ${slotsErr.message}`);
  }
  if (!mondaySlots?.length) {
    throw new Error("No public slots on seed Monday — check working hours / min_notice.");
  }

  const slotStart = mondaySlots[0].starts_at;
  const slotStartDate = new Date(slotStart);

  const { data: staff2Slots } = await anon.rpc("booking_public_list_day_slots", {
    p_business_slug: SLUGS.businessA,
    p_service_id: svcActive.id,
    p_staff_id: staff2.id,
    p_local_date: mondayIso,
  });
  const slot2 = staff2Slots?.[1]?.starts_at ?? staff2Slots?.[0]?.starts_at;
  if (!slot2) {
    throw new Error("No staff2 slots on seed Monday.");
  }

  await admin.from("booking_appointments").insert({
    business_id: bizA,
    service_id: svcActive.id,
    staff_id: staff1.id,
    guest_name: "Seed Guest Confirmed",
    starts_at: slotStart,
    ends_at: new Date(slotStartDate.getTime() + 30 * 60000).toISOString(),
    status: "confirmed",
    source: "staff",
    public_reference: "bk_seed_confirmed",
  });

  await admin.from("booking_appointments").insert({
    business_id: bizA,
    service_id: svcActive.id,
    staff_id: staff2.id,
    guest_name: "Seed Guest Pending",
    starts_at: slot2,
    ends_at: new Date(new Date(slot2).getTime() + 30 * 60000).toISOString(),
    status: "pending",
    source: "staff",
    public_reference: "bk_seed_pending",
  });

  const slotCancelled = staff2Slots[staff2Slots.length - 1].starts_at;
  await admin.from("booking_appointments").insert({
    business_id: bizA,
    service_id: svcActive.id,
    staff_id: staff2.id,
    guest_name: "Seed Guest Cancelled",
    starts_at: slotCancelled,
    ends_at: new Date(new Date(slotCancelled).getTime() + 30 * 60000).toISOString(),
    status: "cancelled",
    source: "staff",
    public_reference: "bk_seed_cancelled",
  });

  const { data: staffB } = await admin
    .from("booking_staff")
    .insert({
      business_id: bizB,
      display_name: "Biz B Staff",
      accepts_online_bookings: true,
    })
    .select("id")
    .single();
  await admin.from("booking_staff_services").insert({
    staff_id: staffB.id,
    service_id: svcB.id,
  });
  for (let dow = 1; dow <= 5; dow++) {
    await admin.from("booking_working_hours").insert({
      staff_id: staffB.id,
      day_of_week: dow,
      start_time: "10:00:00",
      end_time: "16:00:00",
    });
  }

  const { data: memberRows, error: memberVerifyErr } = await admin
    .from("booking_business_members")
    .select("business_id, user_id, role")
    .in("business_id", [bizA, bizB, bizInactive]);
  assertDbOk({ data: memberRows, error: memberVerifyErr }, "verify integration memberships");

  const expectedMembers = [
    { business_id: bizA, user_id: userIds.ownerA, role: "owner" },
    { business_id: bizA, user_id: userIds.managerA, role: "manager" },
    { business_id: bizA, user_id: userIds.staffMemberA, role: "staff" },
    { business_id: bizB, user_id: userIds.ownerB, role: "owner" },
    { business_id: bizInactive, user_id: userIds.ownerA, role: "owner" },
  ];
  for (const exp of expectedMembers) {
    const hit = (memberRows ?? []).find(
      (m) => m.business_id === exp.business_id && m.user_id === exp.user_id,
    );
    if (!hit) {
      throw new Error(
        `Seed incomplete: missing membership user ${exp.user_id} on business ${exp.business_id}`,
      );
    }
    if (exp.role === "staff" && hit.role !== "staff" && hit.role !== "professional") {
      throw new Error(
        `Seed incomplete: staff member role is ${hit.role}, expected staff or professional (020 normalize)`,
      );
    } else if (exp.role !== "staff" && hit.role !== exp.role) {
      throw new Error(
        `Seed incomplete: member role ${hit.role} !== expected ${exp.role} for user ${exp.user_id}`,
      );
    }
  }

  const meta = {
    marker: BOOKING_INTEGRATION_MARKER,
    seed_monday: mondayIso,
    seed_wednesday: wednesdayIso,
    business_a_id: bizA,
    business_b_id: bizB,
    service_a_id: svcActive.id,
    service_b_id: svcB.id,
    staff_a1_id: staff1.id,
    staff_a2_id: staff2.id,
    staff_b_id: staffB.id,
    blocked_slot_starts_at: slotStart,
  };

  console.log("Booking integration seed OK.");
  console.log(JSON.stringify(meta, null, 2));
  console.log("\nUsers (password from BOOKING_TEST_PASSWORD):");
  for (const u of Object.values(BOOKING_TEST_USERS)) {
    console.log(`  ${u.email} (${u.role})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
