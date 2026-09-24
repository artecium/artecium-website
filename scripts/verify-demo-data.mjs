/**
 * Artecium — verify demo environment using normal user auth (RLS enforced).
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 *   DEMO_*_PASSWORD env vars (same as seed)
 *
 * Usage: npm run db:verify:demo
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DEMO_TAX_ID = "DEMO-PT-0001";
const DEMO_PROJECT_NAME = "Artecium Demo Website";

/** @typedef {{ name: string; pass: boolean; detail: string }} CheckResult */

/** @type {CheckResult[]} */
const results = [];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    null
  );
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { client, user: null, error: error.message };
  }
  return { client, user: data.user, error: null };
}

async function verifyClient(url, anonKey) {
  console.log("\n=== CLIENT (demo.client@artecium.test) ===");
  const email = "demo.client@artecium.test";
  const password = requireEnv("DEMO_CLIENT_PASSWORD");
  const { client, user, error } = await signIn(url, anonKey, email, password);

  record("client auth", !error && !!user, error ?? user?.email ?? "");

  if (!user) return;

  const { ids: profileCompanyIds, error: profileErr } = await client
    .from("profiles")
    .select("company_users ( company_id )")
    .eq("id", user.id)
    .maybeSingle()
    .then(({ data, error }) => ({
      ids: data?.company_users?.map((c) => c.company_id).filter(Boolean) ?? [],
      error: error?.message ?? null,
    }));
  record("client profile company_users", profileCompanyIds.length > 0, profileErr ?? `${profileCompanyIds.length} company(ies)`);

  const { data: companies, error: companiesErr } = await client
    .from("companies")
    .select("id, name, tax_id")
    .eq("tax_id", DEMO_TAX_ID);
  record(
    "client reads demo company",
    !companiesErr && (companies?.length ?? 0) > 0,
    companiesErr?.message ?? companies?.map((c) => c.name).join(", "),
  );

  const companyId = companies?.[0]?.id;
  if (!companyId) {
    record("client company-scoped checks", false, "skipped — no company id");
    await client.auth.signOut();
    return;
  }

  const { data: projects, error: projectsErr } = await client
    .from("projects")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("name", DEMO_PROJECT_NAME);
  record(
    "client reads demo project",
    !projectsErr && (projects?.length ?? 0) > 0,
    projectsErr?.message ?? projects?.[0]?.name,
  );

  const { data: subs, error: subsErr } = await client
    .from("client_subscriptions")
    .select("id, status, service_id")
    .eq("company_id", companyId)
    .eq("status", "active");
  record(
    "client reads subscriptions",
    !subsErr && (subs?.length ?? 0) >= 2,
    subsErr?.message ?? `${subs?.length ?? 0} active subscription(s)`,
  );

  const { data: invoices, error: invErr } = await client
    .from("invoices")
    .select("id, invoice_number, status")
    .eq("company_id", companyId);
  record(
    "client reads invoices",
    !invErr && (invoices?.length ?? 0) >= 2,
    invErr?.message ?? `${invoices?.length ?? 0} invoice(s)`,
  );

  const { data: tickets, error: ticketsErr } = await client
    .from("tickets")
    .select("id, subject, status")
    .eq("company_id", companyId);
  record(
    "client reads tickets",
    !ticketsErr && (tickets?.length ?? 0) >= 2,
    ticketsErr?.message ?? `${tickets?.length ?? 0} ticket(s)`,
  );

  const { data: docs, error: docsErr } = await client
    .from("documents")
    .select("id, title, visibility")
    .eq("company_id", companyId)
    .eq("visibility", "client_visible");
  record(
    "client reads client_visible documents",
    !docsErr && (docs?.length ?? 0) >= 1,
    docsErr?.message ?? `${docs?.length ?? 0} document(s)`,
  );

  const { data: internalDocs, error: internalErr } = await client
    .from("documents")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("title", "Internal Delivery Notes");
  record(
    "client cannot read internal_only document",
    !internalErr && (internalDocs?.length ?? 0) === 0,
    internalErr?.message ?? (internalDocs?.length ? "RLS leak — internal doc visible" : "correctly hidden"),
  );

  const { data: notifications, error: notifErr } = await client
    .from("notifications")
    .select("id, title")
    .eq("user_id", user.id);
  record(
    "client reads notifications",
    !notifErr && (notifications?.length ?? 0) >= 1,
    notifErr?.message ?? `${notifications?.length ?? 0} notification(s)`,
  );

  const { data: analyticsConn, error: analyticsErr } = await client
    .from("analytics_connections")
    .select("id, property_id, status")
    .eq("company_id", companyId);
  record(
    "client reads analytics connection",
    !analyticsErr && (analyticsConn?.length ?? 0) >= 1,
    analyticsErr?.message ?? analyticsConn?.[0]?.property_id,
  );

  await client.auth.signOut();
}

async function verifyStaff(url, anonKey) {
  console.log("\n=== STAFF (demo.developer@artecium.test) ===");
  const email = "demo.developer@artecium.test";
  const password = requireEnv("DEMO_STAFF_PASSWORD");
  const { client, user, error } = await signIn(url, anonKey, email, password);

  record("staff developer auth", !error && !!user, error ?? user?.email ?? "");
  if (!user) return;

  const { data: companies, error: companiesErr } = await client
    .from("companies")
    .select("id, name, tax_id")
    .eq("tax_id", DEMO_TAX_ID);
  record(
    "staff reads assigned demo company",
    !companiesErr && (companies?.length ?? 0) > 0,
    companiesErr?.message ?? (companies?.map((c) => c.name).join(", ") || "no access — check staff_company_assignments RLS"),
  );

  const companyId = companies?.[0]?.id;
  if (companyId) {
    const { data: projects, error: projectsErr } = await client
      .from("projects")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("name", DEMO_PROJECT_NAME);
    record(
      "staff reads demo project",
      !projectsErr && (projects?.length ?? 0) > 0,
      projectsErr?.message ?? projects?.[0]?.name,
    );
  }

  await client.auth.signOut();
}

async function verifyOwner(url, anonKey) {
  console.log("\n=== OWNER (demo.owner@artecium.test) ===");
  const email = "demo.owner@artecium.test";
  const password = requireEnv("DEMO_OWNER_PASSWORD");
  const { client, user, error } = await signIn(url, anonKey, email, password);

  record("owner auth", !error && !!user, error ?? user?.email ?? "");
  if (!user) return;

  const { data: companies, error: companiesErr } = await client
    .from("companies")
    .select("id, name, tax_id")
    .eq("tax_id", DEMO_TAX_ID);
  record(
    "owner reads demo company",
    !companiesErr && (companies?.length ?? 0) > 0,
    companiesErr?.message ?? companies?.map((c) => c.name).join(", "),
  );

  const companyId = companies?.[0]?.id;
  if (companyId) {
    const { data: subs, error: subsErr } = await client
      .from("client_subscriptions")
      .select("id, status")
      .eq("company_id", companyId);
    record(
      "owner reads company subscriptions",
      !subsErr && (subs?.length ?? 0) >= 1,
      subsErr?.message ?? `${subs?.length ?? 0} subscription(s)`,
    );

    const { data: invoices, error: invErr } = await client
      .from("invoices")
      .select("id, invoice_number")
      .eq("company_id", companyId);
    record(
      "owner reads company invoices",
      !invErr && (invoices?.length ?? 0) >= 1,
      invErr?.message ?? `${invoices?.length ?? 0} invoice(s)`,
    );
  }

  await client.auth.signOut();
}

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = resolveAnonKey();
  if (!anonKey) {
    throw new Error(
      "Missing anon/publishable key: set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  console.log("[verify] Running demo data checks with user auth (RLS enforced)...");

  await verifyClient(url, anonKey);
  await verifyStaff(url, anonKey);
  await verifyOwner(url, anonKey);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  console.log(`\n[verify] ${passed}/${results.length} checks passed.`);

  if (failed.length > 0) {
    console.log("\n[verify] Failed checks (possible RLS issues — do not bypass):");
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log("[verify] All checks passed.");
}

main().catch((err) => {
  console.error("[verify] FAILED:", err.message ?? err);
  process.exit(1);
});
