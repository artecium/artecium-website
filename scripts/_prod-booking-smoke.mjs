/**
 * Production booking smoke (public RPC only). Uses .env.booking.prod.local.
 * BOOKING_PROD_SMOKE=1 node scripts/_prod-booking-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { extractSupabaseProjectRef } from "./booking-test-guards.mjs";
import { existsSync, readFileSync } from "node:fs";

const PROD = "bwxhdoxesqtdqwkxrmom";
const SLUG = process.env.BOOKING_PROD_SMOKE_SLUG ?? "artecium-demo";

if (process.env.BOOKING_PROD_SMOKE !== "1") {
  console.log("Skip: BOOKING_PROD_SMOKE=1");
  process.exit(0);
}
await import("./booking-load-prod-env.mjs");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = extractSupabaseProjectRef(url);
if (ref !== PROD) {
  console.error(`Wrong ref ${ref}`);
  process.exit(1);
}
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonClient = createClient(url, anon, { auth: { persistSession: false } });

const results = [];
const pass = (id, detail = "") => {
  results.push({ id, pass: true, detail });
  console.log(`PASS  ${id}${detail ? ` — ${detail}` : ""}`);
};
const fail = (id, detail = "") => {
  results.push({ id, pass: false, detail });
  console.log(`FAIL  ${id}${detail ? ` — ${detail}` : ""}`);
};

const { data: biz, error: bizErr } = await anonClient.rpc("booking_public_get_business", { p_slug: SLUG });
if (bizErr || !biz?.[0]) fail("get_business", bizErr?.message);
else pass("get_business", biz[0].name ?? SLUG);

const { data: services } = await anonClient.rpc("booking_public_list_services", { p_slug: SLUG });
if (!services?.length) fail("list_services");
else pass("list_services", String(services.length));

let svcId = null;
let staff = null;
for (const svc of services ?? []) {
  const { data: st } = await anonClient.rpc("booking_public_list_staff_for_service", {
    p_slug: SLUG,
    p_service_id: svc.id,
  });
  if (st?.length) {
    svcId = svc.id;
    staff = st;
    break;
  }
}
if (!staff?.length) fail("list_staff", "no service with linked staff");
else pass("list_staff", String(staff.length));

const base = new Date();
base.setDate(base.getDate() + 10);
const localDate = base.toISOString().slice(0, 10);
const staffId = staff?.[0]?.id;
const { data: slots, error: slotErr } = await anonClient.rpc("booking_public_list_day_slots", {
  p_business_slug: SLUG,
  p_service_id: svcId,
  p_staff_id: staffId,
  p_local_date: localDate,
});
const slotIso = (row) => (typeof row === "string" ? row : row?.starts_at);
let startsAt = slotIso(slots?.[0]);
if (!startsAt) {
  for (let i = 1; i < 14 && !startsAt; i++) {
    const d = new Date(localDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const { data: s2 } = await anonClient.rpc("booking_public_list_day_slots", {
      p_business_slug: SLUG,
      p_service_id: svcId,
      p_staff_id: staffId,
      p_local_date: key,
    });
    startsAt = slotIso(s2?.[0]);
  }
}
if (!startsAt) fail("list_slots");
else pass("list_slots", startsAt);

const idem = `prod-smoke-${Date.now()}`;
const { data: created, error: createErr } = await anonClient.rpc("booking_public_create_appointment", {
  p_business_slug: SLUG,
  p_service_id: svcId,
  p_staff_id: staffId,
  p_starts_at: startsAt,
  p_guest_name: "Prod Launch Smoke",
  p_guest_email: "prod-smoke@artecium.test",
  p_guest_phone: null,
  p_idempotency_key: idem,
});
const row = created?.[0];
if (createErr || !row?.public_reference) fail("create_appointment", createErr?.message);
else pass("create_appointment", row.public_reference);

const token = row?.manage_token;
if (token) {
  const { data: got, error: getErr } = await anonClient.rpc("booking_public_get_guest_appointment", {
    p_public_reference: row.public_reference,
    p_manage_token: token,
  });
  if (getErr) fail("get_guest", getErr.message);
  else pass("get_guest", got?.[0]?.status);

  const { data: cancelled, error: cancelErr } = await anonClient.rpc("booking_public_cancel_guest_appointment", {
    p_public_reference: row.public_reference,
    p_manage_token: token,
  });
  if (cancelErr || cancelled?.[0]?.status !== "cancelled") fail("cancel_guest", cancelErr?.message);
  else pass("cancel_guest", row.public_reference);
} else fail("manage_token_missing");

console.log(JSON.stringify({ ref, slug: SLUG, results, createdRef: row?.public_reference }, null, 2));
process.exit(results.some((r) => !r.pass) ? 1 : 0);