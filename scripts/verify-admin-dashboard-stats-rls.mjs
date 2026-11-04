/**
 * RLS probe for the 11 getAdminDashboardStats queries (read-only, no writes).
 *
 * Usage:
 *   npm run verify:admin-dashboard-stats-rls
 *
 * Requires local/demo Supabase (.env.local) with DEMO_OWNER_PASSWORD and DEMO_CLIENT_PASSWORD.
 * Uses the same anon session pattern as verify-admin-access.mjs.
 *
 * See docs/admin/DASHBOARD_STATS_RLS_PROBE.md
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPermissionDenied,
  metricValue,
  runAdminDashboardStatsQueries,
} from "./admin-dashboard-stats-queries.mjs";

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

/** @param {import('./admin-dashboard-stats-queries.mjs').DashboardStatsQueryProbe[]} probes */
function allStaffQueriesOk(probes) {
  const failures = [];
  for (const p of probes) {
    if (p.error) {
      failures.push(`${p.key}: ${p.error.message}`);
    }
  }
  return failures;
}

/** @param {import('./admin-dashboard-stats-queries.mjs').DashboardStatsQueryProbe[]} probes */
function snapshotMetrics(probes) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const p of probes) {
    out[p.key] = metricValue(p);
  }
  return out;
}

/**
 * Non-admin must not see platform-wide admin aggregates.
 * @param {Record<string, number>} staff
 * @param {import('./admin-dashboard-stats-queries.mjs').DashboardStatsQueryProbe[]} probes
 * @param {string} roleLabel
 */
function assertNoAdminLeak(staff, probes, roleLabel) {
  const keys = [
    "companies",
    "projects_total",
    "payments_succeeded",
    "invoices_pending",
    "subscriptions_active",
  ];

  for (const key of keys) {
    const p = probes.find((x) => x.key === key);
    if (!p) continue;

    if (p.error && isPermissionDenied(p.error)) {
      record(`${roleLabel} ${key} blocked by RLS`, true, p.error.message);
      continue;
    }

    if (p.error) {
      record(`${roleLabel} ${key} no unexpected error`, false, p.error.message);
      continue;
    }

    const theirs = metricValue(p);
    const owners = staff[key] ?? 0;

    if (theirs > owners) {
      record(`${roleLabel} ${key} scoped ≤ staff`, false, `${theirs} > staff ${owners}`);
      continue;
    }

    if (owners > 1 && theirs === owners && key === "companies") {
      record(
        `${roleLabel} ${key} scoped ≤ staff`,
        false,
        `client sees full platform company count (${theirs})`,
      );
      continue;
    }

    record(`${roleLabel} ${key} scoped ≤ staff`, true, `${theirs} / staff ${owners}`);
  }
}

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    console.error(
      "SKIP/FAIL  Missing NEXT_PUBLIC_SUPABASE_URL or publishable key. See docs/admin/DASHBOARD_STATS_RLS_PROBE.md",
    );
    process.exit(1);
  }

  const ownerPassword = process.env.DEMO_OWNER_PASSWORD;
  const clientPassword = process.env.DEMO_CLIENT_PASSWORD;

  if (!ownerPassword || !clientPassword) {
    console.error(
      "SKIP/FAIL  Missing DEMO_OWNER_PASSWORD or DEMO_CLIENT_PASSWORD. Seed demo env required.",
    );
    console.error("See docs/admin/DASHBOARD_STATS_RLS_PROBE.md");
    process.exit(1);
  }

  const nowIso = new Date().toISOString();

  console.log("\n=== ADMIN DASHBOARD STATS — RLS PROBE (11 queries) ===\n");

  const { client: ownerClient, user: ownerUser, error: ownerLoginErr } = await signIn(
    url,
    anonKey,
    "demo.owner@artecium.test",
    ownerPassword,
  );
  record("OWNER login", !ownerLoginErr && !!ownerUser, ownerLoginErr ?? "");

  if (!ownerUser) {
    console.log("\n=== SUMMARY: aborted (no staff session) ===\n");
    process.exit(1);
  }

  const staffProbes = await runAdminDashboardStatsQueries(ownerClient, nowIso);
  const staffFailures = allStaffQueriesOk(staffProbes);
  record(
    "STAFF all 11 dashboard queries succeed",
    staffFailures.length === 0,
    staffFailures.length ? staffFailures.join("; ") : "ok",
  );

  const staffMetrics = snapshotMetrics(staffProbes);
  record(
    "STAFF companies count > 0 (demo)",
    staffMetrics.companies > 0,
    String(staffMetrics.companies),
  );

  await ownerClient.auth.signOut();

  const { client: clientClient, user: clientUser, error: clientLoginErr } = await signIn(
    url,
    anonKey,
    "demo.client@artecium.test",
    clientPassword,
  );
  record("CLIENT login", !clientLoginErr && !!clientUser, clientLoginErr ?? "");

  if (clientUser) {
    const clientProbes = await runAdminDashboardStatsQueries(clientClient, nowIso);
    assertNoAdminLeak(staffMetrics, clientProbes, "CLIENT");
    await clientClient.auth.signOut();
  } else {
    record("CLIENT dashboard RLS checks", false, "login failed");
  }

  const anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonProbes = await runAdminDashboardStatsQueries(anonClient, nowIso);

  for (const key of ["companies", "payments_succeeded", "projects_total"]) {
    const p = anonProbes.find((x) => x.key === key);
    if (!p) continue;
    const visible = metricValue(p);
    // PostgREST may return { error: { message: "" }, count: null } for RLS-denied head counts.
    const noLeak = isPermissionDenied(p.error) || visible === 0;
    record(
      `ANON ${key} no admin aggregate leak`,
      noLeak,
      [
        p.error?.message?.trim() || "no error",
        `visible=${visible}`,
        `staff=${staffMetrics[key]}`,
      ].join("; "),
    );
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== SUMMARY: ${results.length - failed}/${results.length} passed ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
