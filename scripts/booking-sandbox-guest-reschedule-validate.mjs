/**
 * Sandbox-only guest reschedule validation (integration salon A, temporary allow_customer_reschedule).
 *
 * BOOKING_SANDBOX_GUEST_RESCHEDULE_VALIDATE=1 node --env-file=.env.booking.sandbox.local scripts/booking-sandbox-guest-reschedule-validate.mjs
 */
import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

const FLAG = "BOOKING_SANDBOX_GUEST_RESCHEDULE_VALIDATE";

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

function logStep(id, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}${detail ? ` — ${detail}` : ""}`);
  return pass;
}

async function main() {
  assertLocalBookingTestEnabled(FLAG);
  const { env, target } = assertBookingExplicitSandboxEnv();
  console.log(`Target: ${target.kind} (${target.projectRef})`);

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.anonKey;
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const anon = createClient(env.url, anonKey, { auth: { persistSession: false } });

  const results = [];
  const push = (id, pass, detail) => {
    results.push({ id, pass, detail });
    return logStep(id, pass, detail);
  };

  const { data: biz, error: bizErr } = await admin
    .from("booking_businesses")
    .select("id, slug, timezone, settings, allow_customer_reschedule")
    .eq("slug", SLUGS.businessA)
    .single();
  if (bizErr || !biz) {
    console.error("FAIL  load integration-salon-a", bizErr?.message);
    process.exit(1);
  }
  if (biz.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
    console.error("FAIL  integration marker mismatch", biz.settings?.integration_marker);
    process.exit(1);
  }

  const originalReschedule = biz.allow_customer_reschedule;
  console.log(`INFO  allow_customer_reschedule before=${originalReschedule}`);

  const { error: updErr } = await admin
    .from("booking_businesses")
    .update({ allow_customer_reschedule: true })
    .eq("id", biz.id)
    .eq("slug", SLUGS.businessA);
  if (updErr) {
    console.error("FAIL  enable reschedule", updErr.message);
    process.exit(1);
  }

  let createdRef = null;
  let manageToken = null;
  let newStartsAt = null;

  try {
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
    const { data: seedBlocked } = await admin
      .from("booking_appointments")
      .select("starts_at, staff_id")
      .eq("business_id", biz.id)
      .eq("public_reference", "bk_seed_confirmed")
      .maybeSingle();

    let localDate = seedBlocked?.starts_at
      ? new Intl.DateTimeFormat("en-CA", {
          timeZone: biz.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(seedBlocked.starts_at))
      : new Date().toISOString().slice(0, 10);

    let slot1 = await pickFreeSlot(anon, SLUGS.businessA, svc.id, staff.id, localDate, null);
    for (let i = 0; i < 14 && !slot1; i++) {
      const d = new Date(localDate);
      d.setDate(d.getDate() + i);
      localDate = d.toISOString().slice(0, 10);
      slot1 = await pickFreeSlot(anon, SLUGS.businessA, svc.id, staff.id, localDate, null);
    }
    if (!slot1) {
      push("create_public_appointment", false, "no free slot");
      return;
    }

    const idem = `reschedule-val-${Date.now()}`;
    const { data: created, error: createErr } = await anon.rpc("booking_public_create_appointment", {
      p_business_slug: SLUGS.businessA,
      p_service_id: svc.id,
      p_staff_id: staff.id,
      p_starts_at: slot1,
      p_guest_name: "Reschedule Validate",
      p_guest_email: "reschedule-val@artecium.test",
      p_guest_phone: null,
      p_idempotency_key: idem,
    });
    const row = created?.[0];
    createdRef = row?.public_reference ?? null;
    manageToken = row?.manage_token ?? null;
  push(
      "create_public_appointment",
      !createErr && !!createdRef && !!manageToken,
      createErr?.message ?? createdRef,
    );

    const { data: got, error: getErr } = await anon.rpc("booking_public_get_guest_appointment", {
      p_public_reference: createdRef,
      p_manage_token: manageToken,
    });
    push(
      "get_guest_valid_token",
      !getErr && got?.[0]?.starts_at && got?.[0]?.business_slug === SLUGS.businessA,
      getErr?.message ?? JSON.stringify({ slug: got?.[0]?.business_slug, status: got?.[0]?.status }),
    );

    const { error: badGetErr } = await anon.rpc("booking_public_get_guest_appointment", {
      p_public_reference: createdRef,
      p_manage_token: "00000000000000000000000000000000",
    });
    push("get_guest_invalid_token", !!badGetErr, badGetErr?.message ?? "unexpected success");

    const slot2 = await pickFreeSlot(anon, SLUGS.businessA, svc.id, staff.id, localDate, slot1);
    if (!slot2) {
      push("reschedule_available_slot", false, "no second free slot");
    } else {
      const { data: resched, error: reschedErr } = await anon.rpc("booking_public_reschedule_guest_appointment", {
        p_public_reference: createdRef,
        p_manage_token: manageToken,
        p_new_starts_at: slot2,
      });
      newStartsAt = resched?.[0]?.starts_at ?? slot2;
      push(
        "reschedule_available_slot",
        !reschedErr && resched?.[0]?.starts_at === slot2,
        reschedErr?.message ?? JSON.stringify(resched?.[0]),
      );

      const { data: dbRow } = await admin
        .from("booking_appointments")
        .select("starts_at, status")
        .eq("public_reference", createdRef)
        .single();
      push(
        "db_starts_at_after_reschedule",
        dbRow?.starts_at === newStartsAt,
        `${dbRow?.starts_at} expected ${newStartsAt}`,
      );
    }

    if (seedBlocked?.starts_at && seedBlocked.staff_id === staff.id) {
      const { error: busyErr } = await anon.rpc("booking_public_reschedule_guest_appointment", {
        p_public_reference: createdRef,
        p_manage_token: manageToken,
        p_new_starts_at: seedBlocked.starts_at,
      });
      push(
        "reschedule_occupied_slot_rejected",
        !!busyErr,
        busyErr?.message ?? "expected rejection",
      );
    } else {
      push("reschedule_occupied_slot_rejected", false, "bk_seed_confirmed missing for overlap test");
    }

    const { data: cancelled, error: cancelErr } = await anon.rpc("booking_public_cancel_guest_appointment", {
      p_public_reference: createdRef,
      p_manage_token: manageToken,
    });
    push(
      "cancel_guest_appointment",
      !cancelErr && cancelled?.[0]?.status === "cancelled",
      cancelErr?.message ?? cancelled?.[0]?.status,
    );

    const { error: cancelAgainErr } = await anon.rpc("booking_public_cancel_guest_appointment", {
      p_public_reference: createdRef,
      p_manage_token: manageToken,
    });
    push("cancel_already_cancelled_rejected", !!cancelAgainErr, cancelAgainErr?.message ?? "unexpected success");
  } finally {
    const { data: restored, error: restoreErr } = await admin
      .from("booking_businesses")
      .update({ allow_customer_reschedule: originalReschedule })
      .eq("id", biz.id)
      .eq("slug", SLUGS.businessA)
      .select("allow_customer_reschedule")
      .single();
    if (restoreErr || restored?.allow_customer_reschedule !== originalReschedule) {
      console.error(
        "CRITICAL  restore allow_customer_reschedule failed",
        restoreErr?.message,
        restored,
      );
      process.exit(2);
    }
    console.log(`INFO  allow_customer_reschedule restored=${restored.allow_customer_reschedule}`);
  }

  console.log(JSON.stringify({ results, createdRef, projectRef: target.projectRef }, null, 2));
  const failed = results.filter((r) => !r.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});