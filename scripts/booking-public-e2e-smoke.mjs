/**
 * Public booking slot + create via RPC (integration salon A).
 * Requires integration seed on sandbox. No .env.local — use --env-file only.
 *
 * BOOKING_PUBLIC_E2E_SMOKE=1 node --env-file=.env.booking.sandbox.local scripts/booking-public-e2e-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { SLUGS } from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

async function pickFreeSlot(anon, slug, serviceId, staffId, localDate, excludeIso) {
  const { data: slots, error } = await anon.rpc("booking_public_list_day_slots", {
    p_business_slug: slug,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_local_date: localDate,
  });
  if (error || !slots?.length) return null;
  return slots.find((s) => s.starts_at !== excludeIso)?.starts_at ?? slots[0].starts_at;
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_PUBLIC_E2E_SMOKE");
  const { env, target } = assertBookingExplicitSandboxEnv();
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}`);

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.anonKey;

  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const anonClient = createClient(env.url, anon, { auth: { persistSession: false } });

  const { data: biz } = await admin
    .from("booking_businesses")
    .select("id, timezone, settings")
    .eq("slug", SLUGS.businessA)
    .single();
  if (!biz) {
    console.log("SKIP integration-salon-a missing — run db:seed:booking-integration");
    process.exit(2);
  }

  const { data: aptBlock } = await admin
    .from("booking_appointments")
    .select("starts_at")
    .eq("business_id", biz.id)
    .eq("public_reference", "bk_seed_confirmed")
    .maybeSingle();

  function localDateIso(isoTs, tz) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(isoTs));
  }

  let localDate = aptBlock?.starts_at
    ? localDateIso(aptBlock.starts_at, biz.timezone)
    : null;
  if (!localDate) {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    localDate = d.toISOString().slice(0, 10);
  }

  const { data: svc } = await admin
    .from("booking_services")
    .select("id")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .limit(1)
    .single();
  const { data: staff } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!svc || !staff) {
    console.log("FAIL no active service/staff on integration A");
    process.exit(1);
  }

  const slot = await pickFreeSlot(anonClient, SLUGS.businessA, svc.id, staff.id, localDate, null);
  if (!slot) {
    let found = null;
    for (let i = 0; i < 14 && !found; i++) {
      const d = new Date(localDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      found = await pickFreeSlot(anonClient, SLUGS.businessA, svc.id, staff.id, key, null);
      if (found) localDate = key;
    }
    if (!found) {
      console.log("FAIL no public slots in 14-day window");
      process.exit(1);
    }
  }

  const startsAt =
    slot ?? (await pickFreeSlot(anonClient, SLUGS.businessA, svc.id, staff.id, localDate, null));
  const idem = `ui-e2e-${Date.now()}`;
  const { data: created, error } = await anonClient.rpc("booking_public_create_appointment", {
    p_business_slug: SLUGS.businessA,
    p_service_id: svc.id,
    p_staff_id: staff.id,
    p_starts_at: startsAt,
    p_guest_name: "E2E Button Smoke",
    p_guest_email: "e2e-btn@artecium.test",
    p_guest_phone: null,
    p_idempotency_key: idem,
  });

  if (error || !created?.[0]) {
    console.log("FAIL create appointment", error?.message);
    process.exit(1);
  }

  console.log("PASS public slots available", localDate, startsAt);
  console.log("PASS public create appointment", created[0].status, created[0].public_reference);
  console.log(
    "HINT browser wizard",
    `${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/booking/b/${SLUGS.businessA}`,
    localDate,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});