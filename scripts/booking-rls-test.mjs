/**
 * Optional local RLS smoke tests for Booking.
 * Requires local Supabase + migrations 012–016 and test user env vars.
 * Prefer npm run test:booking-integration after db:seed:booking-integration.
 *
 * Usage: BOOKING_RLS_TEST=1 npm run test:booking-rls
 */

import { createClient } from "@supabase/supabase-js";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`PASS  ${msg}`);
}

async function signIn(email, password) {
  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "no session"}`);
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_RLS_TEST");
  const { env, target } = assertBookingExplicitSandboxEnv();
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}`);
  const { url, anonKey, serviceKey } = env;

  const emailA = process.env.BOOKING_RLS_USER_A_EMAIL;
  const passA = process.env.BOOKING_RLS_USER_A_PASSWORD;
  const emailB = process.env.BOOKING_RLS_USER_B_EMAIL;
  const passB = process.env.BOOKING_RLS_USER_B_PASSWORD;
  if (!emailA || !passA || !emailB || !passB) {
    fail("Set BOOKING_RLS_USER_A_* and BOOKING_RLS_USER_B_* env vars.");
  }

  const admin = createClient(url, serviceKey);
  const slugA = `rls-test-a-${Date.now()}`;
  const slugB = `rls-test-b-${Date.now()}`;

  const clientA = await signIn(emailA, passA);
  const clientB = await signIn(emailB, passB);

  const { data: bizA, error: errA } = await clientA.rpc("booking_create_business_with_owner", {
    p_slug: slugA,
    p_name: "RLS Test A",
  });
  if (errA) fail(`create business A: ${errA.message}`);

  const { data: bizB, error: errB } = await clientB.rpc("booking_create_business_with_owner", {
    p_slug: slugB,
    p_name: "RLS Test B",
  });
  if (errB) fail(`create business B: ${errB.message}`);

  const { data: servicesB } = await clientA
    .from("booking_services")
    .select("id")
    .eq("business_id", bizB);
  if (servicesB?.length) {
    fail("User A should not see business B services.");
  }
  pass("cross-tenant services select empty for A→B");

  const { data: svcA, error: svcErr } = await clientA
    .from("booking_services")
    .insert({
      business_id: bizA,
      name: "Cut",
      duration_minutes: 30,
      buffer_after_minutes: 15,
    })
    .select("id")
    .single();
  if (svcErr) fail(`insert service A: ${svcErr.message}`);

  const { data: staffA, error: stErr } = await clientA
    .from("booking_staff")
    .insert({
      business_id: bizA,
      display_name: "Pro A",
      accepts_online_bookings: true,
    })
    .select("id")
    .single();
  if (stErr) fail(`insert staff A: ${stErr.message}`);

  await clientA.from("booking_staff_services").insert({
    staff_id: staffA.id,
    service_id: svcA.id,
  });

  const starts = new Date(Date.now() + 3 * 86400000).toISOString();
  const { error: apt1Err } = await clientA.from("booking_appointments").insert({
    business_id: bizA,
    service_id: svcA.id,
    staff_id: staffA.id,
    guest_name: "Guest",
    starts_at: starts,
    ends_at: new Date(new Date(starts).getTime() + 30 * 60000).toISOString(),
    status: "confirmed",
    source: "staff",
    public_reference: `bk_rls_${Date.now()}`,
  });
  if (apt1Err) fail(`first appointment: ${apt1Err.message}`);

  const overlapStart = new Date(new Date(starts).getTime() + 25 * 60000).toISOString();
  const { error: apt2Err } = await clientA.from("booking_appointments").insert({
    business_id: bizA,
    service_id: svcA.id,
    staff_id: staffA.id,
    guest_name: "Guest 2",
    starts_at: overlapStart,
    ends_at: new Date(new Date(overlapStart).getTime() + 30 * 60000).toISOString(),
    status: "confirmed",
    source: "staff",
    public_reference: `bk_rls_${Date.now()}_2`,
  });
  if (!apt2Err) {
    fail("expected overlap/buffer exclusion on second appointment");
  }
  pass("overlap/buffer blocks second conflicting appointment");

  const { error: memberInsertErr } = await clientA.from("booking_business_members").insert({
    business_id: bizA,
    user_id: (await clientB.auth.getUser()).data.user.id,
    role: "staff",
  });
  if (!memberInsertErr) {
    fail("manager/owner should not insert membership directly after 014");
  }
  pass("direct membership insert denied");

  const anon = createClient(url, anonKey);
  const { data: anonRows, error: anonErr } = await anon.from("booking_appointments").select("id").limit(1);
  if (!anonErr && anonRows?.length) {
    fail("anon should not read appointments table");
  }
  pass("anon table read blocked or empty");

  console.log("\nLocal RLS smoke tests completed.");
  void admin;
  void bizB;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
