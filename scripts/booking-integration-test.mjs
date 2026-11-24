/**
 * Booking integration tests (local Postgres or allowlisted remote test project).
 *
 * Prerequisite: migrations 001–016, npm run db:seed:booking-integration
 *
 * BOOKING_INTEGRATION_TEST=1 npm run test:booking-integration
 */

import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertKeysPresent,
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`PASS  ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

function assert(condition, msg) {
  if (condition) pass(msg);
  else fail(msg);
}

async function signIn(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "no session"}`);
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

async function loadSeedContext(admin) {
  const { data: bizA, error: eA } = await admin
    .from("booking_businesses")
    .select("id, slug, timezone")
    .eq("slug", SLUGS.businessA)
    .single();
  if (eA || !bizA) throw new Error("Run db:seed:booking-integration first (business A missing).");

  const { data: markerCheck } = await admin
    .from("booking_businesses")
    .select("settings")
    .eq("id", bizA.id)
    .single();
  if (markerCheck?.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
    throw new Error("Business A is not integration seed data.");
  }

  const { data: bizB } = await admin.from("booking_businesses").select("id").eq("slug", SLUGS.businessB).single();
  const { data: svcA } = await admin
    .from("booking_services")
    .select("id, name")
    .eq("business_id", bizA.id)
    .eq("is_active", true)
    .limit(1)
    .single();
  const { data: staffA1 } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Alex Provider")
    .single();

  const { data: aptBlock } = await admin
    .from("booking_appointments")
    .select("starts_at")
    .eq("business_id", bizA.id)
    .eq("public_reference", "bk_seed_confirmed")
    .single();

  const seedMonday = aptBlock?.starts_at
    ? localDateIso(aptBlock.starts_at, bizA.timezone)
    : null;

  const wed = seedMonday ? addDaysIso(seedMonday, 2) : null;

  return {
    bizA,
    bizB,
    svcA,
    staffA1,
    blockedStartsAt: aptBlock?.starts_at,
    seedMonday: seedMonday ?? undefined,
    seedWednesday: wed ?? undefined,
  };
}

function addDaysIso(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function localDateIso(isoTs, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTs));
}

async function pickFreeSlot(anon, slug, serviceId, staffId, localDate, skipStartsAt) {
  const { data: slots, error } = await anon.rpc("booking_public_list_day_slots", {
    p_business_slug: slug,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_local_date: localDate,
  });
  if (error) throw new Error(error.message);
  const free = (slots ?? []).find((s) => s.starts_at !== skipStartsAt);
  return free?.starts_at ?? null;
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_INTEGRATION_TEST");
  const { env, target } = assertBookingExplicitSandboxEnv();
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}`);

  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password) {
    throw new Error(`Set ${BOOKING_TEST_PASSWORD_ENV} (same as seed).`);
  }

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ctx = await loadSeedContext(admin);

  const ownerA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.ownerA.email, password);
  const ownerB = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.ownerB.email, password);
  const managerA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.managerA.email, password);
  const staffA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.staffMemberA.email, password);

  // Cross-tenant isolation
  const { data: crossSvc } = await ownerA.from("booking_services").select("id").eq("business_id", ctx.bizB.id);
  assert(!crossSvc?.length, "owner A cannot read business B services");

  const { data: crossUpd, error: crossUpdErr } = await ownerB
    .from("booking_services")
    .update({ name: "Hacked" })
    .eq("business_id", ctx.bizA.id)
    .select("id");
  assert(!crossUpd?.length && !crossUpdErr, "owner B cannot update business A services");

  // Roles
  const { error: staffInsertSvc } = await staffA.from("booking_services").insert({
    business_id: ctx.bizA.id,
    name: "Staff added",
    duration_minutes: 15,
  });
  assert(!!staffInsertSvc, "staff member cannot insert services");

  const { data: mgrSvc } = await managerA.from("booking_services").select("id").eq("business_id", ctx.bizA.id);
  assert((mgrSvc?.length ?? 0) > 0, "manager can read business A services");

  const { error: memberInsertErr } = await ownerA.from("booking_business_members").insert({
    business_id: ctx.bizA.id,
    user_id: (await ownerB.auth.getUser()).data.user.id,
    role: "staff",
  });
  assert(!!memberInsertErr, "direct membership insert denied (014)");

  // Anon table access
  const { data: anonApt, error: anonAptErr } = await anon.from("booking_appointments").select("id").limit(1);
  assert(anonAptErr || !anonApt?.length, "anon cannot read appointments table");

  // Public catalog
  const { data: pubBiz, error: pubBizErr } = await anon.rpc("booking_public_get_business", {
    p_slug: SLUGS.businessA,
  });
  assert(!pubBizErr && pubBiz?.length === 1, "anon booking_public_get_business for active A");
  const row = pubBiz?.[0];
  assert(!("guest_email" in (row ?? {})), "public business payload has no guest PII keys");

  const { data: inactiveBiz } = await anon.rpc("booking_public_get_business", {
    p_slug: SLUGS.inactive,
  });
  assert(!inactiveBiz?.length, "inactive business not returned by public get_business");

  const { data: services } = await anon.rpc("booking_public_list_services", { p_slug: SLUGS.businessA });
  assert(
    services?.length === 1 && services[0].name === "Haircut",
    "public services lists only active (Haircut)",
  );

  const { data: staffList } = await anon.rpc("booking_public_list_staff_for_service", {
    p_slug: SLUGS.businessA,
    p_service_id: ctx.svcA.id,
  });
  assert((staffList?.length ?? 0) >= 2, "public staff for service returns linked providers");

  // Day slots RPC
  if (ctx.seedMonday) {
    const { data: daySlots, error: dayErr } = await anon.rpc("booking_public_list_day_slots", {
      p_business_slug: SLUGS.businessA,
      p_service_id: ctx.svcA.id,
      p_staff_id: ctx.staffA1.id,
      p_local_date: ctx.seedMonday,
    });
    assert(!dayErr && (daySlots?.length ?? 0) > 0, "public list_day_slots returns slots on seed Monday");
    const blocked = daySlots?.some((s) => s.starts_at === ctx.blockedStartsAt);
    assert(!blocked, "confirmed seed appointment removes slot from public list");

    if (ctx.seedWednesday) {
      const { data: wedSlots } = await anon.rpc("booking_public_list_day_slots", {
        p_business_slug: SLUGS.businessA,
        p_service_id: ctx.svcA.id,
        p_staff_id: ctx.staffA1.id,
        p_local_date: ctx.seedWednesday,
      });
      const lunchLocal = wedSlots?.filter((s) => {
        const d = new Date(s.starts_at);
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: ctx.bizA.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).formatToParts(d);
        const h = Number(parts.find((p) => p.type === "hour")?.value);
        const m = Number(parts.find((p) => p.type === "minute")?.value);
        return h === 12 && m === 0;
      });
      assert(!lunchLocal?.length, "Wednesday 12:00 local excluded (staff break)");
    }
  }

  // Manual confirmation (business B)
  const { data: svcB } = await admin
    .from("booking_services")
    .select("id")
    .eq("business_id", ctx.bizB.id)
    .single();
  const { data: staffB } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", ctx.bizB.id)
    .single();

  const bMonday = ctx.seedMonday ?? addDaysIso(new Date().toISOString().slice(0, 10), 7);
  const slotB = await pickFreeSlot(anon, SLUGS.businessB, svcB.id, staffB.id, bMonday, null);
  if (slotB) {
    const { data: manualRows, error: manualErr } = await anon.rpc("booking_public_create_appointment", {
      p_business_slug: SLUGS.businessB,
      p_service_id: svcB.id,
      p_staff_id: staffB.id,
      p_starts_at: slotB,
      p_guest_name: "Integration Guest",
      p_guest_email: "guest-b@artecium.test",
      p_guest_phone: null,
      p_idempotency_key: `int-manual-${Date.now()}`,
    });
    assert(!manualErr && manualRows?.[0]?.status === "pending", "manual business creates pending appointment");
    const manualRow = manualRows?.[0];
    assert(!("guest_email" in (manualRow ?? {})), "public create response omits guest_email");
  } else {
    fail("could not pick slot for business B (skip manual confirmation test)");
  }

  // Automatic confirmation (business A)
  let slotA = await pickFreeSlot(
    anon,
    SLUGS.businessA,
    ctx.svcA.id,
    ctx.staffA1.id,
    ctx.seedMonday ?? bMonday,
    ctx.blockedStartsAt,
  );
  if (slotA) {
    const idemKey = `int-auto-${Date.now()}`;
    const payload = {
      p_business_slug: SLUGS.businessA,
      p_service_id: ctx.svcA.id,
      p_staff_id: ctx.staffA1.id,
      p_starts_at: slotA,
      p_guest_name: "Auto Guest",
      p_guest_email: "auto@artecium.test",
      p_guest_phone: null,
      p_idempotency_key: idemKey,
    };
    const { data: autoRows, error: autoErr } = await anon.rpc("booking_public_create_appointment", payload);
    assert(!autoErr && autoRows?.[0]?.status === "confirmed" && autoRows[0].replayed === false, "automatic business confirms");

    const { data: replayRows, error: replayErr } = await anon.rpc("booking_public_create_appointment", payload);
    assert(
      !replayErr && replayRows?.[0]?.replayed === true && replayRows[0].public_reference === autoRows[0].public_reference,
      "idempotency replay same payload",
    );

    const { error: mismatchErr } = await anon.rpc("booking_public_create_appointment", {
      ...payload,
      p_starts_at: slotB ?? slotA,
    });
    assert(!!mismatchErr && /idempotency/i.test(mismatchErr.message), "idempotency key reused with different time fails");

    const { error: badKeyErr } = await anon.rpc("booking_public_create_appointment", {
      ...payload,
      p_idempotency_key: "short",
    });
    assert(!!badKeyErr, "invalid idempotency key rejected");

    // Concurrency: two creates same slot, different keys
    const slotRace = await pickFreeSlot(
      anon,
      SLUGS.businessA,
      ctx.svcA.id,
      ctx.staffA1.id,
      ctx.seedMonday ?? bMonday,
      ctx.blockedStartsAt,
    );
    if (slotRace) {
      const base = {
        p_business_slug: SLUGS.businessA,
        p_service_id: ctx.svcA.id,
        p_staff_id: ctx.staffA1.id,
        p_starts_at: slotRace,
        p_guest_name: "Race Guest",
        p_guest_email: "race@artecium.test",
        p_guest_phone: null,
      };
      const results = await Promise.all([
        anon.rpc("booking_public_create_appointment", { ...base, p_idempotency_key: `race-a-${Date.now()}` }),
        anon.rpc("booking_public_create_appointment", { ...base, p_idempotency_key: `race-b-${Date.now()}` }),
      ]);
      const ok = results.filter((r) => !r.error && r.data?.[0]);
      const bad = results.filter((r) => r.error);
      assert(ok.length === 1 && bad.length === 1, "concurrent double-book: one success one failure");
      const errMsg = bad[0]?.error?.message ?? "";
      assert(!/@artecium\.test/i.test(errMsg) && !/race@/.test(errMsg), "error messages do not leak guest email");
    }
  } else {
    fail("could not pick free slot on A for auto/idempotency tests");
  }

  // Time off (seed: staff1 unavailable for 24h starting seed_monday + 5 days)
  if (ctx.seedMonday) {
    const timeOffDay = addDaysIso(ctx.seedMonday, 5);
    const slotOff = await pickFreeSlot(
      anon,
      SLUGS.businessA,
      ctx.svcA.id,
      ctx.staffA1.id,
      timeOffDay,
      null,
    );
    if (slotOff) {
      const { error: toErr } = await anon.rpc("booking_public_create_appointment", {
        p_business_slug: SLUGS.businessA,
        p_service_id: ctx.svcA.id,
        p_staff_id: ctx.staffA1.id,
        p_starts_at: slotOff,
        p_guest_name: "TimeOff Guest",
        p_guest_email: null,
        p_guest_phone: null,
        p_idempotency_key: `int-to-${Date.now()}`,
      });
      assert(!!toErr, "staff time off rejects public booking");
    } else {
      pass("time off day has no listable slots (acceptable)");
    }
  }

  // Outside working hours
  if (ctx.seedMonday) {
    const badStart = `${ctx.seedMonday}T03:15:00.000Z`;
    const { error: oohErr } = await anon.rpc("booking_public_create_appointment", {
      p_business_slug: SLUGS.businessA,
      p_service_id: ctx.svcA.id,
      p_staff_id: ctx.staffA1.id,
      p_starts_at: badStart,
      p_guest_name: "OOH Guest",
      p_guest_email: null,
      p_guest_phone: null,
      p_idempotency_key: `int-ooh-${Date.now()}`,
    });
    assert(!!oohErr, "booking outside working hours rejected");
  }

  // Inactive service via public RPC (use inactive service id from seed)
  const { data: inactiveSvc } = await admin
    .from("booking_services")
    .select("id")
    .eq("business_id", ctx.bizA.id)
    .eq("is_active", false)
    .single();
  if (inactiveSvc && ctx.seedMonday && slotA) {
    const { error: inactErr } = await anon.rpc("booking_public_create_appointment", {
      p_business_slug: SLUGS.businessA,
      p_service_id: inactiveSvc.id,
      p_staff_id: ctx.staffA1.id,
      p_starts_at: slotA,
      p_guest_name: "X",
      p_guest_email: null,
      p_guest_phone: null,
      p_idempotency_key: `int-inact-${Date.now()}`,
    });
    assert(!!inactErr, "inactive service rejected on public create");
  }

  console.log(`\nIntegration results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
