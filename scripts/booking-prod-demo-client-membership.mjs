/**
 * Authorized production: associate demo.client@artecium.test → artecium-demo (professional).
 *
 * BOOKING_AUTHORIZED_DEMO_CLIENT_MEMBERSHIP=1 node scripts/booking-prod-demo-client-membership.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import {
  assertBookingProdReadonlyTarget,
  getBookingProdEnv,
} from "./booking-prod-guards.mjs";

function loadDemoClientPasswordFromLocalEnv() {
  if (process.env.DEMO_CLIENT_PASSWORD) return;
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^DEMO_CLIENT_PASSWORD=(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env.DEMO_CLIENT_PASSWORD = v;
    break;
  }
}

const GATE = "BOOKING_AUTHORIZED_DEMO_CLIENT_MEMBERSHIP";
const TARGET_EMAIL = "demo.client@artecium.test";
const TARGET_SLUG = "artecium-demo";
const TARGET_ROLE = "professional";

function requireGate() {
  if (process.env[GATE] !== "1") {
    console.log(`Skip: set ${GATE}=1 to run.`);
    process.exit(0);
  }
}

async function findUserIdByEmail(admin, email) {
  let page = 1;
  const needle = email.trim().toLowerCase();
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function signInAndVerifyMembership(url, anonKey, password, businessId) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: TARGET_EMAIL,
    password,
  });
  if (authErr || !auth.user) {
    return { authOk: false, authError: authErr?.message ?? "no user" };
  }

  const { data: mem, error: memErr } = await client
    .from("booking_business_members")
    .select("business_id, role")
    .eq("user_id", auth.user.id);

  const row = (mem ?? []).find((m) => m.business_id === businessId);
  return {
    authOk: true,
    userId: auth.user.id,
    membershipQueryError: memErr?.message ?? null,
    membershipCount: mem?.length ?? 0,
    demoMembership: Boolean(row),
    demoRole: row?.role ?? null,
    otherBusinessIds: (mem ?? [])
      .filter((m) => m.business_id !== businessId)
      .map((m) => m.business_id),
  };
}

async function main() {
  requireGate();
  await import("./booking-load-prod-env.mjs");
  loadDemoClientPasswordFromLocalEnv();

  const { url } = getBookingProdEnv();
  assertBookingProdReadonlyTarget(url);
  const { url: supabaseUrl, anonKey, serviceKey } = getBookingProdEnv();
  if (!serviceKey?.trim()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.booking.prod.local");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report = {
    projectRef: new URL(supabaseUrl).hostname.split(".")[0],
    email: TARGET_EMAIL,
    slug: TARGET_SLUG,
    targetRole: TARGET_ROLE,
    action: "none",
  };

  const userId = await findUserIdByEmail(admin, TARGET_EMAIL);
  if (!userId) {
    report.action = "aborted";
    report.reason = "user_not_found";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  report.userId = userId;

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) throw new Error(`profiles: ${profileErr.message}`);
  if (!profile) {
    report.action = "aborted";
    report.reason = "profile_missing";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const { data: business, error: bizErr } = await admin
    .from("booking_businesses")
    .select("id, slug, name")
    .eq("slug", TARGET_SLUG)
    .maybeSingle();
  if (bizErr) throw new Error(`booking_businesses: ${bizErr.message}`);
  if (!business) {
    report.action = "aborted";
    report.reason = "business_not_found";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  report.businessId = business.id;
  report.businessName = business.name;

  const { data: existing, error: existErr } = await admin
    .from("booking_business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existErr) throw new Error(`membership read: ${existErr.message}`);

  if (existing) {
    report.existingRole = existing.role;
    report.action = "already_member";
    if (existing.role !== TARGET_ROLE) {
      report.ok = false;
      report.reason = "existing_role_differs";
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
    report.ok = true;
  } else {
    const { error: insErr } = await admin.from("booking_business_members").insert({
      business_id: business.id,
      user_id: userId,
      role: TARGET_ROLE,
    });
    if (insErr) {
      report.action = "insert_failed";
      report.insertError = insErr.message;
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
    report.action = "inserted";
    report.ok = true;
  }

  const { data: after, error: afterErr } = await admin
    .from("booking_business_members")
    .select("role, created_at")
    .eq("business_id", business.id)
    .eq("user_id", userId)
    .single();
  if (afterErr) throw new Error(`membership verify: ${afterErr.message}`);
  report.confirmedRole = after.role;

  const password = process.env.DEMO_CLIENT_PASSWORD;
  if (password && anonKey) {
    report.sessionTest = await signInAndVerifyMembership(
      supabaseUrl,
      anonKey,
      password,
      business.id,
    );
    report.sessionTest.ok =
      report.sessionTest.authOk &&
      report.sessionTest.demoMembership &&
      report.sessionTest.demoRole === TARGET_ROLE;
  } else {
    report.sessionTest = { skipped: true, reason: "missing DEMO_CLIENT_PASSWORD or anon key" };
  }

  const base = "https://booking.artecium.com";
  if (report.sessionTest?.authOk && password) {
    const ref = report.projectRef;
    const cookieName = `sb-${ref}-auth-token`;
    const { data: auth } = await createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    }).auth.signInWithPassword({ email: TARGET_EMAIL, password });
    if (auth.session) {
      const cookieValue = encodeURIComponent(JSON.stringify(auth.session));
      const res = await fetch(`${base}/dashboard`, {
        redirect: "manual",
        headers: { Cookie: `${cookieName}=${cookieValue}` },
      });
      report.httpDashboard = {
        status: res.status,
        location: res.headers.get("location") ?? null,
        ok: res.status === 200,
      };
    }
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok && (report.sessionTest?.ok ?? true) ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});