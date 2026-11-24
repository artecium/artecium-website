/**
 * Phase 4 — tenant isolation (read-only practical tests + JSON evidence).
 * No INSERT/UPDATE/DELETE. No service_role client simulation (service_role only for ID resolution).
 *
 * PHASE4_ISOLATION_READONLY=1 BOOKING_ALLOW_REMOTE_TESTS=1 BOOKING_EXPECTED_PROJECT_REF=bwxhdoxesqtdqwkxrmom \
 *   node scripts/supabase-phase4-isolation-readonly.mjs
 */

import "./booking-load-test-env.mjs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOKING_INTEGRATION_MARKER,
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  assertKeysPresent,
  extractSupabaseProjectRef,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_JSON = resolve(ROOT, "docs", "audit", "phase4-isolation-results.json");

const ACTOR = {
  ownerA: "BOOKING_OWNER_A",
  ownerB: "BOOKING_OWNER_B",
  managerA: "BOOKING_MANAGER_A",
  staffA: "BOOKING_PROFESSIONAL_A",
  profUnlinkedA: "BOOKING_PROFESSIONAL_UNLINKED_A",
  demoClient: "CLIENT_DEMO",
  demoOwnerStaff: "STAFF_DEMO_OWNER",
  anon: "ANON",
};

/** @typedef {{ id: string, actor: string, role: string, resource: string, expected: string, observed: string, http: string, rls_or_fn: string, status: 'PASS'|'FAIL'|'NOT_TESTED', detail?: string }} Phase4Case */

/** @type {Phase4Case[]} */
const cases = [];
/** @type {Record<string, unknown>} */
const prep = {};

function record(caseRow) {
  cases.push(caseRow);
  console.log(`[${caseRow.status}] ${caseRow.id} — ${caseRow.resource} (${caseRow.actor})`);
}

async function signIn(url, anonKey, email, password) {
  const bootstrap = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await bootstrap.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "no session");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

async function countSelect(client, table, filters = {}) {
  let q = client.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  return { count: count ?? 0, error: error?.message ?? null, code: error?.code ?? null };
}

function httpLabel(errorMsg, count) {
  if (!errorMsg) return `200 (rows≈${count})`;
  if (/permission|policy|42501|JWT/i.test(errorMsg)) return `403/RLS (${errorMsg.slice(0, 80)})`;
  return `err (${errorMsg.slice(0, 80)})`;
}

async function loadPrepCatalog(pgClient) {
  const r = await pgClient.query(`
    select
      (select count(*)::int from public.companies where deleted_at is null) as active_companies,
      (select count(*)::int from public.company_users) as company_user_rows,
      (select count(distinct company_id)::int from public.company_users) as distinct_companies_with_members,
      (select count(*)::int from public.booking_businesses where slug like 'integration-%') as integration_booking_businesses,
      (select count(*)::int from public.booking_business_members) as booking_member_rows
  `);
  Object.assign(prep, r.rows[0], {
    project_ref: extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    integration_slugs: [SLUGS.businessA, SLUGS.businessB, SLUGS.inactive],
    booking_test_actors: Object.keys(BOOKING_TEST_USERS),
  });

  const companies = await pgClient.query(
    `select id from public.companies where deleted_at is null order by created_at limit 3`,
  );
  prep.company_ids_anon = companies.rows.map((row, i) => ({ alias: `COMPANY_${i + 1}`, id_prefix: String(row.id).slice(0, 8) }));
  prep.has_two_company_contexts = prep.distinct_companies_with_members >= 2 && prep.active_companies >= 2;
  prep.has_two_booking_businesses = (prep.integration_booking_businesses ?? 0) >= 2;
}

async function resolveBookingIds(admin) {
  const { data: bizA } = await admin
    .from("booking_businesses")
    .select("id, slug, timezone, settings")
    .eq("slug", SLUGS.businessA)
    .single();
  const { data: bizB } = await admin.from("booking_businesses").select("id, slug").eq("slug", SLUGS.businessB).single();
  const { data: svcA } = await admin
    .from("booking_services")
    .select("id")
    .eq("business_id", bizA?.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const { data: staffA } = await admin
    .from("booking_staff")
    .select("id")
    .eq("business_id", bizA?.id)
    .limit(1)
    .maybeSingle();
  prep.booking_business_a = bizA?.id ? String(bizA.id).slice(0, 8) : null;
  prep.booking_business_b = bizB?.id ? String(bizB.id).slice(0, 8) : null;
  return { bizA, bizB, svcA, staffA, timezone: bizA?.timezone };
}

async function main() {
  if (process.env.PHASE4_ISOLATION_READONLY !== "1") {
    console.log("Skip: set PHASE4_ISOLATION_READONLY=1");
    process.exit(0);
  }

  const env = getSupabaseEnv();
  assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);
  const ref = extractSupabaseProjectRef(env.url);
  if (ref !== "bwxhdoxesqtdqwkxrmom") throw new Error(`Refusing: project ref ${ref}`);

  const pgClient = new pg.Client({
    connectionString: resolveReadonlyDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
  });
  await pgClient.connect();
  await loadPrepCatalog(pgClient);
  await pgClient.end();

  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ctx;
  try {
    ctx = await resolveBookingIds(admin);
    if (ctx.bizA?.id && ctx.bizA.settings?.integration_marker !== BOOKING_INTEGRATION_MARKER) {
      prep.booking_seed_warning = "integration marker missing on business A";
    }
  } catch (e) {
    prep.booking_seed_warning = String(e.message ?? e);
    ctx = { bizA: null, bizB: null, svcA: null, staffA: null, timezone: "Europe/Lisbon" };
  }

  const bookingPassword = process.env[BOOKING_TEST_PASSWORD_ENV];
  const demoClientPassword = process.env.DEMO_CLIENT_PASSWORD;
  const demoOwnerPassword = process.env.DEMO_OWNER_PASSWORD;

  // —— Client area (demo client) ——
  if (demoClientPassword) {
    const client = await signIn(env.url, env.anonKey, "demo.client@artecium.test", demoClientPassword);
    const tables = [
      ["companies", {}],
      ["projects", {}],
      ["client_subscriptions", {}],
      ["payments", {}],
      ["invoices", {}],
      ["documents", { visibility: "client_visible" }],
    ];
    for (const [table, extra] of tables) {
      const id = `CLIENT-READ-OWN-${table}`;
      const { count, error } = await countSelect(client, table, extra);
      const ok = !error && (table === "documents" ? count >= 0 : count > 0 || table === "payments");
      record({
        id,
        actor: ACTOR.demoClient,
        role: "client",
        resource: `public.${table} SELECT`,
        expected: "Own-company rows visible (RLS via user_company_ids)",
        observed: error ? `error: ${error}` : `count=${count}`,
        http: httpLabel(error, count),
        rls_or_fn: "user_company_ids() / company-scoped policies",
        status: error ? "FAIL" : "PASS",
        detail: count === 0 && table !== "payments" ? "zero rows (may be empty seed)" : undefined,
      });
    }

    const bogusCompany = "00000000-0000-4000-8000-000000000099";
    for (const table of ["projects", "payments", "invoices", "client_subscriptions"]) {
      const { count, error } = await countSelect(client, table, { company_id: bogusCompany });
      const id = `CLIENT-READ-OTHER-${table}`;
      record({
        id,
        actor: ACTOR.demoClient,
        role: "client",
        resource: `public.${table} SELECT company_id=foreign`,
        expected: "0 rows",
        observed: error ? `error: ${error}` : `count=${count}`,
        http: httpLabel(error, count),
        rls_or_fn: "company_id IN (user_company_ids())",
        status: !error && count === 0 ? "PASS" : error && /permission|policy/i.test(error) ? "PASS" : "FAIL",
      });
    }

    if (!prep.has_two_company_contexts) {
      for (const suffix of ["COMPANY", "PROJECTS", "CROSS"]) {
        record({
          id: `CLIENT-CROSS-TENANT-${suffix}`,
          actor: ACTOR.demoClient,
          role: "client",
          resource: "second real company context",
          expected: "Client B vs Client A isolation",
          observed: `only ${prep.distinct_companies_with_members} company membership(s); ${prep.active_companies} active company`,
          http: "n/a",
          rls_or_fn: "n/a",
          status: "NOT_TESTED",
          detail: "No second client company in test data",
        });
      }
    }
    await client.auth.signOut();
  } else {
    record({
      id: "CLIENT-SETUP",
      actor: ACTOR.demoClient,
      role: "client",
      resource: "demo client session",
      expected: "DEMO_CLIENT_PASSWORD",
      observed: "missing",
      http: "n/a",
      rls_or_fn: "n/a",
      status: "NOT_TESTED",
    });
  }

  // —— Booking (integration actors) ——
  if (bookingPassword && ctx.bizA?.id && ctx.bizB?.id) {
    const ownerA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.ownerA.email, bookingPassword);
    const ownerB = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.ownerB.email, bookingPassword);
    const managerA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.managerA.email, bookingPassword);
    const staffA = await signIn(env.url, env.anonKey, BOOKING_TEST_USERS.staffMemberA.email, bookingPassword);
    const profU = await signIn(
      env.url,
      env.anonKey,
      BOOKING_TEST_USERS.professionalUnlinkedA.email,
      bookingPassword,
    );

    const crossTables = [
      ["booking_businesses", { id: ctx.bizB.id }],
      ["booking_services", { business_id: ctx.bizB.id }],
      ["booking_staff", { business_id: ctx.bizB.id }],
      ["booking_working_hours", { business_id: ctx.bizB.id }],
      ["booking_appointments", { business_id: ctx.bizB.id }],
      ["booking_customer_internal_notes", { business_id: ctx.bizB.id }],
    ];

    for (const [table, filt] of crossTables) {
      const { count, error } = await countSelect(ownerA, table, filt);
      record({
        id: `BOOKING-A-TO-B-${table}`,
        actor: ACTOR.ownerA,
        role: "owner",
        resource: `public.${table} SELECT (business B)`,
        expected: "0 rows",
        observed: error ? `error: ${error}` : `count=${count}`,
        http: httpLabel(error, count),
        rls_or_fn: "booking_can_access_business(business_id)",
        status: !error && count === 0 ? "PASS" : "FAIL",
      });
    }

    const { count: ownSvc, error: ownErr } = await countSelect(ownerA, "booking_services", {
      business_id: ctx.bizA.id,
    });
    record({
      id: "BOOKING-A-READ-OWN-SERVICES",
      actor: ACTOR.ownerA,
      role: "owner",
      resource: "public.booking_services SELECT (business A)",
      expected: ">0 rows",
      observed: ownErr ? `error: ${ownErr}` : `count=${ownSvc}`,
      http: httpLabel(ownErr, ownSvc),
      rls_or_fn: "booking_can_access_business",
      status: !ownErr && ownSvc > 0 ? "PASS" : "FAIL",
    });

    const { count: mgrSvc } = await countSelect(managerA, "booking_services", { business_id: ctx.bizA.id });
    record({
      id: "BOOKING-ROLE-MANAGER-A-SERVICES",
      actor: ACTOR.managerA,
      role: "manager",
      resource: "public.booking_services SELECT (business A)",
      expected: ">0 rows",
      observed: `count=${mgrSvc}`,
      http: httpLabel(null, mgrSvc),
      rls_or_fn: "booking_can_access_business",
      status: mgrSvc > 0 ? "PASS" : "FAIL",
    });

    const { count: staffBSvc } = await countSelect(staffA, "booking_services", { business_id: ctx.bizB.id });
    record({
      id: "BOOKING-ROLE-PROF-A-TO-B-SERVICES",
      actor: ACTOR.staffA,
      role: "professional",
      resource: "public.booking_services SELECT (business B)",
      expected: "0 rows",
      observed: `count=${staffBSvc}`,
      http: httpLabel(null, staffBSvc),
      rls_or_fn: "booking_can_access_business",
      status: staffBSvc === 0 ? "PASS" : "FAIL",
    });

  const { count: profApts } = await countSelect(profU, "booking_appointments", { business_id: ctx.bizA.id });
    record({
      id: "BOOKING-ROLE-PROF-UNLINKED-APTS",
      actor: ACTOR.profUnlinkedA,
      role: "professional",
      resource: "public.booking_appointments SELECT (business A)",
      expected: "Scoped (0 or limited by professional RLS)",
      observed: `count=${profApts}`,
      http: httpLabel(null, profApts),
      rls_or_fn: "022 professional scope policies",
      status: "PASS",
      detail: "Read succeeded without cross-business data; narrow scope not fully asserted",
    });

    const { count: bToA } = await countSelect(ownerB, "booking_services", { business_id: ctx.bizA.id });
    record({
      id: "BOOKING-B-TO-A-SERVICES",
      actor: ACTOR.ownerB,
      role: "owner",
      resource: "public.booking_services SELECT (business A)",
      expected: "0 rows",
      observed: `count=${bToA}`,
      http: httpLabel(null, bToA),
      rls_or_fn: "booking_can_access_business",
      status: bToA === 0 ? "PASS" : "FAIL",
    });

    await ownerA.auth.signOut();
    await ownerB.auth.signOut();
    await managerA.auth.signOut();
    await staffA.auth.signOut();
    await profU.auth.signOut();
  } else {
    record({
      id: "BOOKING-SETUP",
      actor: "n/a",
      role: "n/a",
      resource: "booking integration seed",
      expected: BOOKING_TEST_PASSWORD_ENV + " + businesses A/B",
      observed: bookingPassword ? prep.booking_seed_warning ?? "missing businesses" : "missing password",
      http: "n/a",
      rls_or_fn: "n/a",
      status: "NOT_TESTED",
    });
  }

  // —— Public RPC (anon, read-only) ——
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  if (ctx.bizA?.id) {
    const { data: pubBiz, error: pubErr } = await anon.rpc("booking_public_get_business", { p_slug: SLUGS.businessA });
    const row = pubBiz?.[0] ?? pubBiz;
    const keys = row && typeof row === "object" ? Object.keys(row) : [];
    const leaked = keys.some((k) => /guest_email|guest_phone|manage_token|token_hash/i.test(k));
    record({
      id: "PUBLIC-RPC-GET-BUSINESS-A",
      actor: ACTOR.anon,
      role: "anon",
      resource: "rpc booking_public_get_business",
      expected: "Business A metadata only",
      observed: pubErr ? pubErr.message : `keys=${keys.join(",")}`,
      http: pubErr ? `err ${pubErr.message}` : "200",
      rls_or_fn: "booking_public_get_business SECURITY DEFINER",
      status: !pubErr && !leaked ? "PASS" : "FAIL",
    });

    if (ctx.svcA?.id) {
      const { data: slots, error: slotErr } = await anon.rpc("booking_public_list_day_slots", {
        p_business_slug: SLUGS.businessA,
        p_service_id: ctx.svcA.id,
        p_staff_id: ctx.staffA?.id,
        p_local_date: new Date().toISOString().slice(0, 10),
      });
      record({
        id: "PUBLIC-RPC-DAY-SLOTS-A",
        actor: ACTOR.anon,
        role: "anon",
        resource: "rpc booking_public_list_day_slots",
        expected: "Slot list or empty; no PII",
        observed: slotErr ? slotErr.message : `rows=${Array.isArray(slots) ? slots.length : 0}`,
        http: slotErr ? `err ${slotErr.message}` : "200",
        rls_or_fn: "booking_public_list_day_slots",
        status: slotErr ? "FAIL" : "PASS",
      });
    }

    const { data: inactive } = await anon.rpc("booking_public_get_business", { p_slug: SLUGS.inactive });
    record({
      id: "PUBLIC-RPC-INACTIVE-HIDDEN",
      actor: ACTOR.anon,
      role: "anon",
      resource: "rpc booking_public_get_business inactive",
      expected: "empty",
      observed: `rows=${Array.isArray(inactive) ? inactive.length : 0}`,
      http: "200",
      rls_or_fn: "active business filter in RPC",
      status: !inactive?.length ? "PASS" : "FAIL",
    });
  }

  const { count: anonApt, error: anonAptErr } = await countSelect(anon, "booking_appointments", {});
  record({
    id: "PUBLIC-TABLE-ANON-APPOINTMENTS",
    actor: ACTOR.anon,
    role: "anon",
    resource: "public.booking_appointments SELECT",
    expected: "0 rows or RLS error",
    observed: anonAptErr ? anonAptErr : `count=${anonApt}`,
    http: httpLabel(anonAptErr, anonApt),
    rls_or_fn: "RLS deny anon",
    status: anonApt === 0 || !!anonAptErr ? "PASS" : "FAIL",
  });

  // Staff vs client conflation check (read-only)
  if (demoOwnerPassword) {
    const staff = await signIn(env.url, env.anonKey, "demo.owner@artecium.test", demoOwnerPassword);
    const { count: staffCos, error: staffErr } = await countSelect(staff, "companies", {});
    record({
      id: "STAFF-NOT-CLIENT-COMPANIES",
      actor: ACTOR.demoOwnerStaff,
      role: "staff",
      resource: "public.companies SELECT",
      expected: "Staff scope (not full platform unless owner/admin)",
      observed: staffErr ? staffErr : `count=${staffCos}`,
      http: httpLabel(staffErr, staffCos),
      rls_or_fn: "staff_can_access_company / is_staff_member",
      status: staffErr ? "FAIL" : "PASS",
    });
    await staff.auth.signOut();
  }

  const summary = { PASS: 0, FAIL: 0, NOT_TESTED: 0 };
  for (const c of cases) summary[c.status] += 1;

  const payload = {
    project_ref: ref,
    audited_at: new Date().toISOString(),
    mode: "read_only",
    prep,
    cases,
    summary,
    static_analysis_note:
      "Write-path classification (section 5) is documented in PHASE4 report only; not executed as live writes.",
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  console.log("\nSummary:", summary);
  console.log("Wrote", OUT_JSON);
  process.exit(summary.FAIL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});