/**
 * Diagnostic: list slots + try booking_public_create_appointment (writes one test row if 017 applied).
 * Requires migration 017 on the Supabase project (pgcrypto search_path).
 * Usage: BOOKING_DEBUG_PUBLIC_CREATE=1 node --env-file=.env.booking.sandbox.local scripts/debug-public-booking-create.mjs
 */

import { createClient } from "@supabase/supabase-js";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

assertLocalBookingTestEnabled("BOOKING_DEBUG_PUBLIC_CREATE");
const { env } = assertBookingExplicitSandboxEnv();
const url = env.url;
const anonKey = env.anonKey;
const slug = "artecium-demo";
const serviceId = "9d8fb47a-7684-4e6f-b82c-5be38ccbda9e";
const staffId = "44002b03-35fe-4e0b-897e-c1daae5590bf";
const localDate = "2026-10-30";

const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const { data: existing } = await anon
  .from("booking_appointments")
  .select("id, public_reference, starts_at, status, guest_name")
  .eq("business_id", "d3febe4c-ef29-4432-bae5-c8966d98a573")
  .gte("starts_at", `${localDate}T00:00:00Z`)
  .lte("starts_at", `${localDate}T23:59:59Z`);

console.log("Existing appointments on", localDate, ":", JSON.stringify(existing ?? [], null, 2));

const { data: slots, error: slotsErr } = await anon.rpc("booking_public_list_day_slots", {
  p_business_slug: slug,
  p_service_id: serviceId,
  p_staff_id: staffId,
  p_local_date: localDate,
});

if (slotsErr) {
  console.error("list_day_slots error:", slotsErr.code, slotsErr.message, slotsErr.details, slotsErr.hint);
  process.exit(1);
}

console.log("First 3 slots:", JSON.stringify(slots?.slice(0, 3), null, 2));

const slot = slots?.[0];
if (!slot) {
  console.log("No slots — stop");
  process.exit(0);
}

const idemKey = `diag${Date.now()}testkey1234567890`.slice(0, 48);
const { data: created, error: createErr } = await anon.rpc("booking_public_create_appointment", {
  p_business_slug: slug,
  p_service_id: serviceId,
  p_staff_id: staffId,
  p_starts_at: slot.starts_at,
  p_guest_name: "Diag Test",
  p_guest_email: null,
  p_guest_phone: null,
  p_idempotency_key: idemKey,
});

if (createErr) {
  console.error("create_appointment error:", {
    code: createErr.code,
    message: createErr.message,
    details: createErr.details,
    hint: createErr.hint,
  });
  process.exit(1);
}

console.log("create_appointment ok:", JSON.stringify(created, null, 2));
