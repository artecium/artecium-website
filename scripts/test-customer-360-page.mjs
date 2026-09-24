/**
 * HTTP smoke test for Customer 360 (authenticated owner session).
 * Usage: node scripts/test-customer-360-page.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const COMPANY_ID = "d28a6435-60cf-4c19-9d26-7a1a42e36369";
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const TABS = [
  "overview",
  "projects",
  "services",
  "tasks",
  "tickets",
  "documents",
  "reports",
  "meetings",
  "invoices",
  "payments",
  "analytics",
  "seo",
  "activity",
];

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

function authCookieName(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "demo.owner@artecium.test",
    password,
  });

  if (error || !data.session) {
    console.error("Login failed:", error?.message ?? "no session");
    process.exit(1);
  }

  const cookieName = authCookieName(url);
  const cookieValue = encodeURIComponent(JSON.stringify(data.session));
  const cookie = `${cookieName}=${cookieValue}`;

  let failed = 0;
  for (const tab of TABS) {
    const pageUrl = `${BASE}/admin/clients/${COMPANY_ID}?tab=${tab}`;
    const res = await fetch(pageUrl, { headers: { Cookie: cookie }, redirect: "manual" });
    const body = await res.text();
    const ok =
      res.status === 200 &&
      !body.includes("Internal Server Error") &&
      (tab === "overview" ? body.includes("Artecium Demo Client") : body.includes("Customer 360"));
    console.log(`${ok ? "OK" : "FAIL"}  tab=${tab} status=${res.status}`);
    if (!ok) {
      failed += 1;
      if (body.includes("Internal Server Error")) console.log("       Internal Server Error");
    }
  }

  const paymentsRes = await fetch(`${BASE}/admin/clients/${COMPANY_ID}?tab=payments`, {
    headers: { Cookie: cookie },
  });
  const paymentsHtml = await paymentsRes.text();
  const hasDemoPayment =
    paymentsHtml.includes("DEMO-TXN-DEMO-INV-001") &&
    (paymentsHtml.includes("SUCCEEDED") || paymentsHtml.includes("€123"));
  console.log(`${hasDemoPayment ? "OK" : "FAIL"}  payments demo row content`);
  if (!hasDemoPayment) failed += 1;

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
