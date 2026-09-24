/**
 * Verify Customer 360 queries (core + tab-scoped loaders).
 * Usage: node scripts/verify-customer-360.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEMO_COMPANY_ID = "d28a6435-60cf-4c19-9d26-7a1a42e36369";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const password = process.env.DEMO_OWNER_PASSWORD;

  if (!url || !anonKey || !password) {
    console.error("Missing env vars.");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: "demo.owner@artecium.test",
    password,
  });

  if (loginError) {
    console.error("Login failed:", loginError.message);
    process.exit(1);
  }

  const companyId = DEMO_COMPANY_ID;
  const results = [];

  async function check(name, run) {
    const { data, error } = await run();
    results.push({
      name,
      ok: !error,
      error: error?.message ?? null,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
    });
    if (error) console.log(`FAIL ${name}: ${error.message}`);
    else
      console.log(
        `OK   ${name}: ${Array.isArray(data) ? data.length + " rows" : data ? "1 row" : "empty"}`,
      );
  }

  await check("core.company", () =>
    supabase
      .from("companies")
      .select("id, name, tax_id, website, created_at")
      .eq("id", companyId)
      .is("deleted_at", null)
      .maybeSingle(),
  );
  await check("core.company_users", () =>
    supabase
      .from("company_users")
      .select("user_id, is_primary, profiles ( email, full_name )")
      .eq("company_id", companyId),
  );
  await check("tab.projects", () =>
    supabase
      .from("projects")
      .select("id, name, progress, project_statuses(label)")
      .eq("company_id", companyId)
      .is("deleted_at", null),
  );
  await check("tab.services", () =>
    supabase
      .from("client_subscriptions")
      .select("id, status, price, currency, billing_period, services(name)")
      .eq("company_id", companyId),
  );
  await check("tab.tickets", () =>
    supabase
      .from("tickets")
      .select("id, subject, status, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })
      .limit(10),
  );
  await check("tab.documents", () =>
    supabase
      .from("documents")
      .select("id, title, visibility, created_at")
      .eq("company_id", companyId)
      .is("deleted_at", null),
  );
  await check("tab.reports", () =>
    supabase
      .from("reports")
      .select("id, title, visibility, report_type, created_at")
      .eq("company_id", companyId),
  );
  await check("tab.meetings", () =>
    supabase
      .from("meetings")
      .select("id, title, status, starts_at")
      .eq("company_id", companyId)
      .order("starts_at", { ascending: false }),
  );
  await check("tab.invoices", () =>
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, currency")
      .eq("company_id", companyId),
  );
  await check("tab.payments", () =>
    supabase
      .from("payments")
      .select("id, amount, status, currency, transaction_reference, created_at")
      .eq("company_id", companyId),
  );
  await check("tab.analytics", () =>
    supabase
      .from("analytics_connections")
      .select("id, property_id, status, display_name")
      .eq("company_id", companyId),
  );
  await check("tab.seo", () =>
    supabase
      .from("seo_connections")
      .select("id, site_url, status, display_name")
      .eq("company_id", companyId),
  );

  const projects = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .is("deleted_at", null);
  const projectIds = (projects.data ?? []).map((p) => p.id);
  if (projectIds.length) {
    await check("tab.tasks", () =>
      supabase
        .from("tasks")
        .select("id, title, status, project_id")
        .in("project_id", projectIds)
        .limit(20),
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
