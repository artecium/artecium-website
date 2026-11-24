/**
 * Read-only remote P2 checks (no INSERT/UPDATE/DELETE). Requires 022 applied + integration seed.
 *
 * BOOKING_PHASE2_P2_REMOTE=1 npx -p pg node --env-file=.env.booking.test.local scripts/booking-phase2-p2-remote-readonly.mjs
 */

import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  assertKeysPresent,
  assertLocalBookingTestEnabled,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { PHASE2_RLS_CASES } from "./booking-professional-rls-phase2-lib.mjs";
import {
  runRemoteP2Check,
  resolveIntegrationBusyRpcRange,
  summarizeP2Matrix,
} from "./booking-phase2-p2-harness-lib.mjs";

/** @type {Record<string, import('./booking-phase2-p2-harness-lib.mjs').P2Status>} */
const remoteResults = {};

async function signIn(env, email, password) {
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`);
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

async function main() {
  assertLocalBookingTestEnabled("BOOKING_PHASE2_P2_REMOTE");
  const env = getSupabaseEnv();
  assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);
  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password) throw new Error(`Missing ${BOOKING_TEST_PASSWORD_ENV}`);

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: bizA, error: bizErr } = await admin
    .from("booking_businesses")
    .select("id, slug, timezone, settings")
    .eq("slug", SLUGS.businessA)
    .single();
  if (bizErr || !bizA) throw new Error("integration business A missing");
  if (bizA.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
    throw new Error("business A is not integration seed");
  }

  const { data: bizB } = await admin.from("booking_businesses").select("id").eq("slug", SLUGS.businessB).single();
  const { data: staffAlex } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Alex Provider")
    .single();
  const { data: staffSam } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA.id)
    .eq("display_name", "Sam Provider")
    .single();

  const { data: aptSeed } = await admin
    .from("booking_appointments")
    .select("starts_at")
    .eq("business_id", bizA.id)
    .eq("public_reference", "bk_seed_confirmed")
    .maybeSingle();

  const seedMondayIso = aptSeed?.starts_at ? aptSeed.starts_at.slice(0, 10) : null;
  const range = resolveIntegrationBusyRpcRange({ seedMondayIso, timezone: bizA.timezone });

  const staffClient = await signIn(env, BOOKING_TEST_USERS.staffMemberA.email, password);
  const ownerClient = await signIn(env, BOOKING_TEST_USERS.ownerA.email, password);
  const managerClient = await signIn(env, BOOKING_TEST_USERS.managerA.email, password);

  const ctx = {
    admin,
    staffClient,
    ownerClient,
    managerClient,
    bizA: bizA.id,
    bizB: bizB?.id,
    staffAlexId: staffAlex?.id,
    staffSamId: staffSam?.id,
    env,
    password,
    range,
  };

  console.log("=== Phase 2 P2 remote (read-only, no DML) ===\n");
  console.log(`Busy RPC range: ${range.p_range_start} → ${range.p_range_end}\n`);

  for (const c of PHASE2_RLS_CASES) {
    if (!c.remote) {
      remoteResults[c.id] = "SKIP";
      console.log(`SKIP  ${c.id}  ${c.title} (local-only)`);
      continue;
    }
    const pre = await import("./booking-phase2-p2-harness-lib.mjs").then((m) =>
      m.P2_REMOTE_PREREQUISITES[c.id],
    );
    if (pre?.remoteNeedsWrite) {
      remoteResults[c.id] = "BLOCKED";
      console.log(`BLOCKED  ${c.id}  ${c.title} (needs authorized DML)`);
      continue;
    }

    const result = await runRemoteP2Check(c.id, staffClient, ctx);
    remoteResults[c.id] = result.status;
    console.log(
      `${result.status.padEnd(7)}  ${c.id}  ${c.title}${result.detail ? ` — ${result.detail}` : ""}`,
    );
  }

  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIP: 0 };
  for (const v of Object.values(remoteResults)) counts[v] += 1;
  console.log("\nRemote counts:", counts);
  console.log("\nLocal matrix preview (no network):");
  const { counts: localCounts } = summarizeP2Matrix();
  console.log(localCounts);

  process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
