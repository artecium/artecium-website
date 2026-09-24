/**
 * Artecium — Phase 1.5 back-office completeness checks (RLS enforced).
 *
 * Usage: npm run db:verify:admin:complete
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** @type {Array<{ name: string; pass: boolean; detail: string }>} */
const results = [];

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

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { client, user: null, error: error.message };
  return { client, user: data.user, error: null };
}

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }

  console.log("\n=== PHASE 1.5 COMPLETENESS CHECKS ===\n");

  const clientPassword = process.env.DEMO_CLIENT_PASSWORD;
  const ownerPassword = process.env.DEMO_OWNER_PASSWORD;
  const financePassword = process.env.DEMO_STAFF_PASSWORD;

  if (clientPassword) {
    const { client } = await signIn(url, anonKey, "demo.client@artecium.test", clientPassword);

    const { data: internalDocs } = await client
      .from("documents")
      .select("id")
      .eq("visibility", "internal_only")
      .limit(1);
    record("CLIENT cannot read internal_only documents", (internalDocs ?? []).length === 0);

    const { data: clientDocs } = await client
      .from("documents")
      .select("id")
      .eq("visibility", "client_visible")
      .limit(1);
    record("CLIENT can read client_visible documents", (clientDocs ?? []).length > 0);

    const { data: internalReports } = await client
      .from("reports")
      .select("id")
      .eq("visibility", "internal_only")
      .limit(1);
    record("CLIENT cannot read internal_only reports", (internalReports ?? []).length === 0);

    const { data: clientReports } = await client
      .from("reports")
      .select("id")
      .eq("visibility", "client_visible")
      .limit(1);
    record("CLIENT can read client_visible reports", (clientReports ?? []).length > 0);

    await client.auth.signOut();
  } else {
    record("CLIENT checks", false, "Missing DEMO_CLIENT_PASSWORD");
  }

  if (ownerPassword) {
    const { client } = await signIn(url, anonKey, "demo.owner@artecium.test", ownerPassword);

    const checks = [
      ["companies", "companies"],
      ["projects", "projects"],
      ["tasks", "tasks"],
      ["project_milestones", "milestones"],
      ["project_members", "project members"],
      ["client_subscriptions", "subscriptions"],
      ["meetings", "meetings"],
      ["reports", "reports"],
      ["documents", "documents"],
      ["notifications", "notifications"],
    ];

    for (const [table, label] of checks) {
      const selectCols = table === "project_members" ? "project_id, user_id" : "id";
      const { data, error } = await client.from(table).select(selectCols).limit(1);
      record(`OWNER read ${label}`, !error && Array.isArray(data), error?.message ?? "");
    }

    const { data: internalDocs } = await client
      .from("documents")
      .select("id")
      .eq("visibility", "internal_only")
      .limit(1);
    record("OWNER can read internal_only documents", (internalDocs ?? []).length > 0);

    const { data: companies, error: companiesErr } = await client
      .from("companies")
      .select("id, name")
      .is("deleted_at", null);
    record(
      "OWNER companies count > 0",
      !companiesErr && (companies?.length ?? 0) > 0,
      `${companies?.length ?? 0} companies`,
    );

    const { data: payments, error: paymentsErr } = await client
      .from("payments")
      .select("id, amount, status, transaction_reference")
      .eq("status", "succeeded");
    const demoPayment = (payments ?? []).find((row) => Number(row.amount) === 123);
    record(
      "OWNER payments include demo €123 succeeded",
      !paymentsErr && !!demoPayment,
      paymentsErr?.message ?? `${payments?.length ?? 0} succeeded payments`,
    );

    const { data: meetings, error: meetingsErr } = await client
      .from("meetings")
      .select("id, title")
      .in("title", ["Project Kickoff", "Monthly Review"]);
    record(
      "OWNER meetings include demo kickoff/review",
      !meetingsErr && (meetings?.length ?? 0) >= 2,
      meetingsErr?.message ?? `${meetings?.length ?? 0} demo meetings`,
    );

    const { data: subscriptions, error: subsErr } = await client
      .from("client_subscriptions")
      .select("id, status, services ( name )")
      .in("status", ["trialing", "active", "past_due"]);
    record(
      "OWNER subscriptions count > 0",
      !subsErr && (subscriptions?.length ?? 0) > 0,
      subsErr?.message ?? `${subscriptions?.length ?? 0} active subscriptions`,
    );

    await client.auth.signOut();
  } else {
    record("OWNER checks", false, "Missing DEMO_OWNER_PASSWORD");
  }

  if (financePassword) {
    const { client } = await signIn(url, anonKey, "demo.finance@artecium.test", financePassword);
    const { data: subs, error: subsErr } = await client
      .from("client_subscriptions")
      .select("id")
      .limit(1);
    record("FINANCE read subscriptions", !subsErr && Array.isArray(subs));
    const { data: payments, error: payErr } = await client.from("payments").select("id").limit(1);
    record("FINANCE read payments", !payErr && Array.isArray(payments));
    await client.auth.signOut();
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== SUMMARY: ${results.length - failed}/${results.length} passed ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
