/**
 * Artecium — verify admin back-office access by role (RLS enforced).
 *
 * Usage: node scripts/verify-admin-access.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** @type {Array<{ name: string; pass: boolean; detail: string }>} */
const results = [];

const STAFF = [
  { key: "OWNER", email: "demo.owner@artecium.test", env: "DEMO_OWNER_PASSWORD" },
  { key: "ADMIN", email: "demo.admin@artecium.test", env: "DEMO_ADMIN_PASSWORD" },
  { key: "DEVELOPER", email: "demo.developer@artecium.test", env: "DEMO_STAFF_PASSWORD" },
  { key: "DESIGNER", email: "demo.designer@artecium.test", env: "DEMO_STAFF_PASSWORD" },
  { key: "SEO", email: "demo.seo@artecium.test", env: "DEMO_STAFF_PASSWORD" },
  { key: "SUPPORT", email: "demo.support@artecium.test", env: "DEMO_STAFF_PASSWORD" },
  { key: "FINANCE", email: "demo.finance@artecium.test", env: "DEMO_STAFF_PASSWORD" },
];

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

/** Staff can read internal_only documents; clients cannot (RLS). */
async function isStaff(client) {
  const { data, error } = await client
    .from("documents")
    .select("id")
    .eq("visibility", "internal_only")
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}

async function canReadCompanies(client) {
  const { data, error } = await client.from("companies").select("id").limit(1);
  return !error && Array.isArray(data);
}

async function canReadTickets(client) {
  const { data, error } = await client.from("tickets").select("id").limit(1);
  return !error && Array.isArray(data);
}

async function canReadPayments(client) {
  const { data, error } = await client.from("payments").select("id").limit(1);
  return !error && Array.isArray(data);
}

async function canReadInvoices(client) {
  const { data, error } = await client.from("invoices").select("id").limit(1);
  return !error && Array.isArray(data);
}

async function canReadSeo(client) {
  const { data, error } = await client.from("seo_connections").select("id").limit(1);
  return !error && Array.isArray(data);
}

/** Mirrors fetchUserRolesFromSupabase + resolvePermissions used by admin pages. */
async function resolveAppRoles(client) {
  const { data: tableRoles, error: tableError } = await client
    .from("user_roles")
    .select("roles ( slug )");

  if (!tableError && tableRoles?.length) {
    const slugs = tableRoles
      .map((row) => row.roles?.slug)
      .filter((slug) => typeof slug === "string");
    if (slugs.length) return slugs;
  }

  const { data: rpcSlugs, error: rpcError } = await client.rpc("get_my_role_slugs");
  if (!rpcError && Array.isArray(rpcSlugs) && rpcSlugs.length) {
    return rpcSlugs;
  }

  const { data: isStaff } = await client.rpc("is_staff_member");
  if (!isStaff) return ["client"];

  const { data: isOwnerAdmin } = await client.rpc("is_owner_or_admin");
  return isOwnerAdmin ? ["owner"] : ["admin"];
}

const STAFF_PERMISSIONS = {
  owner: ["clients.view", "payments.view", "settings.manage"],
  admin: ["clients.view", "payments.view"],
  client: ["payments.view"],
};

function hasPermission(roles, permission) {
  if (roles.includes("owner")) return true;
  const role = roles[0] ?? "client";
  return (STAFF_PERMISSIONS[role] ?? STAFF_PERMISSIONS.client).includes(permission);
}

/** Mirrors admin page queries in src/lib/data/admin/queries.ts */
async function verifyOwnerAdminPageQueries(client) {
  const roles = await resolveAppRoles(client);
  record(
    "OWNER app role resolves to staff",
    roles.includes("owner") || roles.includes("admin"),
    roles.join(", "),
  );
  record(
    "OWNER has clients.view permission",
    hasPermission(roles, "clients.view"),
    roles.join(", "),
  );

  const { data: companies, error: companiesErr } = await client
    .from("companies")
    .select("id, name, tax_id, website, created_at")
    .is("deleted_at", null);

  const demoCompany = (companies ?? []).find((row) =>
    String(row.name ?? "").includes("Artecium Demo Client"),
  );
  record(
    "OWNER admin clients query",
    !companiesErr && (companies?.length ?? 0) > 0,
    demoCompany?.name ?? companiesErr?.message ?? "empty",
  );

  const { data: payments, error: paymentsErr } = await client
    .from("payments")
    .select(
      "id, amount, currency, status, provider, transaction_reference, created_at, companies ( name ), invoices ( invoice_number )",
    );

  const demoPayment = (payments ?? []).find(
    (row) => row.status === "succeeded" && Number(row.amount) === 123,
  );
  record(
    "OWNER admin payments query",
    !paymentsErr && !!demoPayment,
    paymentsErr?.message ??
      (demoPayment
        ? `${demoPayment.amount} ${demoPayment.status}`
        : `${payments?.length ?? 0} rows`),
  );

  const { data: meetings, error: meetingsErr } = await client
    .from("meetings")
    .select("id, title, status, starts_at, companies ( name ), projects ( name )");

  const kickoff = (meetings ?? []).find((row) => row.title === "Project Kickoff");
  record(
    "OWNER admin meetings query",
    !meetingsErr && !!kickoff,
    meetingsErr?.message ?? `${meetings?.length ?? 0} rows`,
  );

  const { data: subscriptions, error: subsErr } = await client
    .from("client_subscriptions")
    .select(
      "id, company_id, status, price, currency, billing_period, started_at, current_period_end, service_plan_id, companies ( name ), services ( name )",
    );

  record(
    "OWNER admin subscriptions query",
    !subsErr && (subscriptions?.length ?? 0) > 0,
    subsErr?.message ?? `${subscriptions?.length ?? 0} rows`,
  );
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

  console.log("\n=== ADMIN ACCESS SANITY CHECKS ===\n");

  for (const user of STAFF) {
    const password = process.env[user.env];
    if (!password) {
      record(`${user.key} login`, false, `Missing ${user.env}`);
      continue;
    }

    const { client, user: authUser, error } = await signIn(url, anonKey, user.email, password);
    record(`${user.key} login`, !error && !!authUser, error ?? authUser?.email ?? "");

    if (!authUser) continue;

    const staff = await isStaff(client);
    record(`${user.key} can access staff data`, staff);

    if (user.key === "OWNER" || user.key === "ADMIN") {
      record(`${user.key} read companies`, await canReadCompanies(client));
      record(`${user.key} read tickets`, await canReadTickets(client));
    }

    if (user.key === "DEVELOPER" || user.key === "DESIGNER") {
      const { data, error: projErr } = await client.from("projects").select("id").limit(1);
      record(`${user.key} read projects`, !projErr && Array.isArray(data));
    }

    if (user.key === "SEO") {
      record(`${user.key} read seo_connections`, await canReadSeo(client));
    }

    if (user.key === "SUPPORT") {
      record(`${user.key} read tickets`, await canReadTickets(client));
    }

    if (user.key === "FINANCE") {
      record(`${user.key} read payments`, await canReadPayments(client));
      record(`${user.key} read invoices`, await canReadInvoices(client));
    }
  }

  const clientPassword = process.env.DEMO_CLIENT_PASSWORD;
  if (clientPassword) {
    const { client, user, error } = await signIn(
      url,
      anonKey,
      "demo.client@artecium.test",
      clientPassword,
    );
    record("CLIENT login", !error && !!user, error ?? "");
    if (user) {
      const staff = await isStaff(client);
      record("CLIENT is NOT staff", !staff, staff ? "unexpected staff access" : "client only");
    }
  } else {
    record("CLIENT login", false, "Missing DEMO_CLIENT_PASSWORD");
  }

  const ownerPassword = process.env.DEMO_OWNER_PASSWORD;
  if (ownerPassword) {
    const { client, user, error } = await signIn(
      url,
      anonKey,
      "demo.owner@artecium.test",
      ownerPassword,
    );
    if (user && !error) {
      await verifyOwnerAdminPageQueries(client);
      await client.auth.signOut();
    } else {
      record("OWNER admin page queries", false, error ?? "login failed");
    }
  }

  const failed = results.filter((r) => !r.pass).length;
  const passed = results.length - failed;
  console.log(`\n=== SUMMARY: ${passed}/${results.length} passed ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
