/**
 * Integration tests MR-01 … MR-07 (Phase 1 member role professional).
 *
 * NOT run by default. Writes to DB when enabled (invites, accept flow).
 *
 *   BOOKING_MEMBER_ROLE_INTEGRATION_TEST=1 \
 *   BOOKING_ALLOW_REMOTE_TESTS=1 \
 *   node --env-file=.env.booking.test.local scripts/booking-member-role-integration.mjs
 *
 * List cases without DB access:
 *
 *   BOOKING_MEMBER_ROLE_INTEGRATION_LIST=1 node scripts/booking-member-role-integration.mjs
 *
 * Prerequisites: booking-test-guards allowlist, seed (db:seed:booking-integration),
 * migrations 012–014 minimum; MR-02+ require 020 applied.
 *
 * Optional: BOOKING_SCHEMA_EXPECT=pre020|post020 (skip mismatched cases).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertKeysPresent,
  assertBookingDatabaseTarget,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import {
  memberRoleToRpcPayload,
  memberRoleToRpcPayloadPreMigration020,
} from "./booking-member-role-lib.mjs";

export const BOOKING_MEMBER_ROLE_INTEGRATION_ENV = "BOOKING_MEMBER_ROLE_INTEGRATION_TEST";
export const BOOKING_MEMBER_ROLE_INTEGRATION_LIST_ENV = "BOOKING_MEMBER_ROLE_INTEGRATION_LIST";
export const BOOKING_SCHEMA_EXPECT_ENV = "BOOKING_SCHEMA_EXPECT";

/** @type {{ id: string; title: string; needs: string; writes: boolean }[]} */
export const MEMBER_ROLE_INTEGRATION_CASES = [
  {
    id: "MR-01",
    title: "Professional invite before 020 using staff on RPC",
    needs: "pre-020 RPC (013); seed business A",
    writes: true,
  },
  {
    id: "MR-02",
    title: "Professional invite after 020 using professional on RPC",
    needs: "020 applied; seed",
    writes: true,
  },
  {
    id: "MR-03",
    title: "After 020, RPC staff normalizes to professional in invite row",
    needs: "020 applied; seed",
    writes: true,
  },
  {
    id: "MR-04",
    title: "Invalid roles rejected by RPC",
    needs: "012+; owner session",
    writes: false,
  },
  {
    id: "MR-05",
    title: "Accept pending invite created with staff → member professional after 020",
    needs: "020 applied; second test user email",
    writes: true,
  },
  {
    id: "MR-06",
    title: "Owner/manager privileges unchanged; professional cannot insert services",
    needs: "seed memberships",
    writes: false,
  },
  {
    id: "MR-07",
    title: "RPC payload helpers: pre-020 staff vs post-020 professional",
    needs: "none (local)",
    writes: false,
  },
];

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

function listCases() {
  console.log("Member role integration cases (MR-01 … MR-07):\n");
  for (const c of MEMBER_ROLE_INTEGRATION_CASES) {
    console.log(`  ${c.id}  ${c.title}`);
    console.log(`       needs: ${c.needs}`);
    console.log(`       writes DB: ${c.writes ? "yes" : "no"}`);
  }
  console.log(
    `\nRun (allowlisted remote only): ${BOOKING_MEMBER_ROLE_INTEGRATION_ENV}=1 BOOKING_ALLOW_REMOTE_TESTS=1`,
  );
}

async function signIn(url, anonKey, email, password) {
  const bootstrap = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await bootstrap.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "no session"}`);
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

/**
 * Read-only schema probe: pre-020 RPC rejects professional before token check;
 * post-020 fails with token_hash required instead.
 */
async function detectMigration020Applied(ownerClient, businessId) {
  const { error } = await ownerClient.rpc("booking_create_member_invite", {
    p_business_id: businessId,
    p_email: "mr-probe@artecium.test",
    p_role: "professional",
    p_token_hash: null,
    p_expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  const msg = error?.message ?? "";
  if (msg.includes("token_hash required")) return true;
  if (msg.includes("invalid invite")) return false;
  throw new Error(`Unexpected probe error (020 detection): ${msg || "no error"}`);
}

function schemaExpectation() {
  const v = process.env[BOOKING_SCHEMA_EXPECT_ENV]?.trim().toLowerCase();
  if (v === "pre020" || v === "post020") return v;
  return null;
}

function inviteEmail(caseId) {
  return `mr-${caseId.toLowerCase()}-${randomBytes(4).toString("hex")}@artecium.test`;
}

async function createInviteViaRpc(client, businessId, email, role, admin) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: inviteId, error } = await client.rpc("booking_create_member_invite", {
    p_business_id: businessId,
    p_email: email,
    p_role: role,
    p_token_hash: tokenHash,
    p_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  if (error) return { ok: false, error: error.message, token: null, inviteId: null };

  const { data: row } = await admin
    .from("booking_member_invites")
    .select("id, role, email")
    .eq("id", inviteId)
    .maybeSingle();

  return { ok: true, token, inviteId, row, error: null };
}

async function loadBusinessA(admin) {
  const { data: bizA, error } = await admin
    .from("booking_businesses")
    .select("id, slug, settings")
    .eq("slug", SLUGS.businessA)
    .single();
  if (error || !bizA) throw new Error("Seed business A missing. Run db:seed:booking-integration.");
  if (bizA.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
    throw new Error("Business A is not integration seed data.");
  }
  return bizA;
}

async function runMr07() {
  assert(
    memberRoleToRpcPayloadPreMigration020("professional") === "staff",
    "MR-07 pre-020 payload maps professional → staff",
  );
  assert(
    memberRoleToRpcPayload("professional") === "professional",
    "MR-07 post-020 payload uses professional",
  );
  assert(memberRoleToRpcPayload("manager") === "manager", "MR-07 manager unchanged");
}

async function runMr04(ownerClient, businessId) {
  for (const bad of ["owner", "invalid", ""]) {
    const { error } = await ownerClient.rpc("booking_create_member_invite", {
      p_business_id: businessId,
      p_email: "mr-invalid@artecium.test",
      p_role: bad,
      p_token_hash: "abc",
      p_expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
    assert(!!error, `MR-04 rejects role "${bad || "(empty)"}"`);
  }
}

async function runMr06(ownerClient, managerClient, staffClient, businessId) {
  const { error: staffIns } = await staffClient.from("booking_services").insert({
    business_id: businessId,
    name: "MR-06 staff forbidden",
    duration_minutes: 15,
  });
  assert(!!staffIns, "MR-06 professional/staff member cannot insert services");

  const { data: mgrRows, error: mgrErr } = await managerClient
    .from("booking_services")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);
  assert(!mgrErr && (mgrRows?.length ?? 0) > 0, "MR-06 manager can read services");

  const { error: directMember } = await ownerClient.from("booking_business_members").insert({
    business_id: businessId,
    user_id: "00000000-0000-0000-0000-000000000001",
    role: "staff",
  });
  assert(!!directMember, "MR-06 direct membership insert still denied (014)");
}

async function runMr01(ownerClient, admin, businessId) {
  const email = inviteEmail("MR-01");
  const result = await createInviteViaRpc(ownerClient, businessId, email, "staff", admin);
  assert(result.ok, `MR-01 invite created: ${result.error ?? ""}`);
  assert(result.row?.role === "staff", "MR-01 invite row role remains staff (pre-020)");
}

async function runMr02(ownerClient, admin, businessId) {
  const email = inviteEmail("MR-02");
  const result = await createInviteViaRpc(ownerClient, businessId, email, "professional", admin);
  assert(result.ok, `MR-02 invite created: ${result.error ?? ""}`);
  assert(result.row?.role === "professional", "MR-02 invite persisted as professional");
}

async function runMr03(ownerClient, admin, businessId) {
  const email = inviteEmail("MR-03");
  const result = await createInviteViaRpc(ownerClient, businessId, email, "staff", admin);
  assert(result.ok, `MR-03 invite created: ${result.error ?? ""}`);
  assert(
    result.row?.role === "professional",
    "MR-03 staff payload stored as professional (post-020)",
  );
}

async function runMr05(ownerClient, admin, businessId, password, url, anonKey) {
  const email = inviteEmail("MR-05");
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error: insErr } = await admin.from("booking_member_invites").insert({
    business_id: businessId,
    email,
    role: "staff",
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  if (insErr?.message?.includes("permission denied")) {
    console.log("SKIP  MR-05 admin insert blocked (019 not applied); use service_role after AUTH-02");
    return;
  }
  assert(!insErr, `MR-05 seed pending invite: ${insErr?.message ?? ""}`);

  const acceptClient = await signIn(url, anonKey, email, password).catch(() => null);
  if (!acceptClient) {
    console.log("SKIP  MR-05 accept requires auth user matching invite email (create test user first)");
    return;
  }

  const { error: acceptErr } = await acceptClient.rpc("booking_accept_member_invite", {
    p_token: token,
  });
  assert(!acceptErr, `MR-05 accept invite: ${acceptErr?.message ?? ""}`);

  const { data: member } = await admin
    .from("booking_business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", (await acceptClient.auth.getUser()).data.user?.id)
    .maybeSingle();
  assert(member?.role === "professional", "MR-05 accepted member role is professional");
}

async function main() {
  if (process.env[BOOKING_MEMBER_ROLE_INTEGRATION_LIST_ENV] === "1") {
    listCases();
    return;
  }

  if (process.env[BOOKING_MEMBER_ROLE_INTEGRATION_ENV] !== "1") {
    console.log(`Skip: set ${BOOKING_MEMBER_ROLE_INTEGRATION_ENV}=1 (and allowlist for remote).`);
    console.log(`List:  set ${BOOKING_MEMBER_ROLE_INTEGRATION_LIST_ENV}=1`);
    process.exit(0);
  }

  const env = getSupabaseEnv();
  assertKeysPresent(env);
  const target = assertBookingDatabaseTarget(env.url);
  console.log(`Target: ${target.kind}${target.projectRef ? ` (${target.projectRef})` : ""}\n`);

  const password = process.env[BOOKING_TEST_PASSWORD_ENV];
  if (!password) throw new Error(`Missing ${BOOKING_TEST_PASSWORD_ENV}.`);

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bizA = await loadBusinessA(admin);
  const ownerClient = await signIn(
    env.url,
    env.anonKey,
    BOOKING_TEST_USERS.ownerA.email,
    password,
  );
  const managerClient = await signIn(
    env.url,
    env.anonKey,
    BOOKING_TEST_USERS.managerA.email,
    password,
  );
  const staffClient = await signIn(
    env.url,
    env.anonKey,
    BOOKING_TEST_USERS.staffMemberA.email,
    password,
  );

  const post020 = await detectMigration020Applied(ownerClient, bizA.id);
  const expect = schemaExpectation();
  console.log(`Schema 020 applied (probe): ${post020}${expect ? `; expect=${expect}` : ""}\n`);

  await runMr07();
  await runMr04(ownerClient, bizA.id);
  await runMr06(ownerClient, managerClient, staffClient, bizA.id);

  if (!post020 && expect !== "post020") {
    if (expect === "pre020" || expect === null) await runMr01(ownerClient, admin, bizA.id);
  } else if (expect !== "pre020") {
    await runMr02(ownerClient, admin, bizA.id);
    await runMr03(ownerClient, admin, bizA.id);
    await runMr05(ownerClient, admin, bizA.id, password, env.url, env.anonKey);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

const isMain =
  process.argv[1] &&
  path.normalize(fileURLToPath(import.meta.url)) ===
    path.normalize(path.resolve(process.argv[1]));

if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
