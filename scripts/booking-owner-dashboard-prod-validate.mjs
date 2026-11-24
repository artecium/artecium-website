/**
 * Read-only owner dashboard validation (HTTP + Supabase, no Playwright).
 * BOOKING_OWNER_DASHBOARD_VALIDATE=1 node scripts/booking-owner-dashboard-prod-validate.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.BOOKING_OWNER_DASHBOARD_VALIDATE !== "1") {
  console.log("Skip: BOOKING_OWNER_DASHBOARD_VALIDATE=1");
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await import("./booking-load-prod-env.mjs");

const local = resolve(root, ".env.local");
let password = process.env.DEMO_OWNER_PASSWORD;
if (!password && existsSync(local)) {
  for (const line of readFileSync(local, "utf8").split(/\r?\n/)) {
    const m = line.match(/^DEMO_OWNER_PASSWORD=(.*)$/);
    if (m) password = m[1].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = "https://booking.artecium.com";
const EMAIL = "demo.owner@artecium.test";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const results = [];
const pass = (id, detail = "") => {
  results.push({ id, ok: true, detail });
  console.log(`PASS  ${id}${detail ? ` — ${detail}` : ""}`);
};
const fail = (id, detail = "") => {
  results.push({ id, ok: false, detail });
  console.log(`FAIL  ${id}${detail ? ` — ${detail}` : ""}`);
};

if (!url || !anon || !password) {
  fail("env", "missing supabase or DEMO_OWNER_PASSWORD");
  console.log(JSON.stringify({ ok: false, results }, null, 2));
  process.exit(1);
}

const dashUnauth = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
if (dashUnauth.status === 307 || dashUnauth.status === 302) {
  const loc = dashUnauth.headers.get("location") ?? "";
  if (loc.includes("/login")) pass("dashboard_unauth_redirect", loc);
  else fail("dashboard_unauth_redirect", loc);
} else fail("dashboard_unauth_redirect", `status ${dashUnauth.status}`);

const client = createClient(url, anon, { auth: { persistSession: false } });
const { data: auth, error: authErr } = await client.auth.signInWithPassword({
  email: EMAIL,
  password,
});
if (authErr || !auth.session) {
  fail("supabase_sign_in", authErr?.message ?? "no session");
  console.log(JSON.stringify({ ok: false, results }, null, 2));
  process.exit(1);
}
pass("supabase_sign_in", auth.user?.id ?? "");

const ref = new URL(url).hostname.split(".")[0];
const cookieName = `sb-${ref}-auth-token`;
const cookieValue = encodeURIComponent(JSON.stringify(auth.session));
const cookieHeader = `${cookieName}=${cookieValue}`;

for (const path of ["/dashboard", "/services", "/appointments", "/settings"]) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Cookie: cookieHeader },
  });
  const loc = res.headers.get("location") ?? "";
  if (res.status === 200) pass(`http_get${path}`, String(res.status));
  else if ((res.status === 307 || res.status === 302) && loc.includes("/login")) {
    fail(`http_get${path}`, `redirect ${loc}`);
  } else pass(`http_get${path}`, `status ${res.status}`);
}

const { data: memberships, error: memErr } = await client
  .from("booking_business_members")
  .select("business_id, role")
  .eq("user_id", auth.user.id);
if (memErr) fail("tenant_membership_query", memErr.message);
else {
  const roles = [...new Set((memberships ?? []).map((m) => m.role))];
  pass("tenant_membership_query", `rows=${memberships?.length ?? 0} roles=${roles.join(",")}`);
  if ((memberships ?? []).some((m) => m.role === "owner")) pass("owner_role_present");
  else fail("owner_role_present");
}

const { data: businesses, error: bizErr } = await client
  .from("booking_businesses")
  .select("id, slug, name")
  .in(
    "id",
    (memberships ?? []).map((m) => m.business_id),
  );
if (bizErr) fail("business_list_scoped", bizErr.message);
else {
  const slugs = (businesses ?? []).map((b) => b.slug).join(",");
  pass("business_list_scoped", slugs || "(none)");
}

console.log(JSON.stringify({ ok: !results.some((r) => !r.ok), results }, null, 2));
process.exit(results.some((r) => !r.ok) ? 1 : 0);