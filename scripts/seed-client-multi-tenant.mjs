/**
 * Phase 5 — dual company client-area seed (local Supabase or allowlisted cloud sandbox).
 *
 * PHASE5_CLIENT_ISOLATION=1 npm run db:seed:client-multi-tenant
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPhase5IsolationTarget,
  extractSupabaseProjectRef,
  isLocalSupabaseUrl,
  PROTECTED_AUDIT_REF,
} from "./phase5-isolation-guards.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MARKER = "artecium-client-iso-v1";

const CLIENT_A_EMAIL = "client-a@multitenant-test.local";
const CLIENT_B_EMAIL = "client-b@multitenant-test.local";

const COMPANIES = [
  {
    key: "A",
    name: "Artecium Test Company A",
    tax_id: "ISO-TEST-A-0001",
    project_name: "ISO Test Project A",
    invoice_number: "ISO-INV-A-001",
    payment_amount: 111,
    ticket_subject: "ISO Ticket A",
    doc_title: "ISO Document A",
    notif_title: "ISO Notification A",
  },
  {
    key: "B",
    name: "Artecium Test Company B",
    tax_id: "ISO-TEST-B-0001",
    project_name: "ISO Test Project B",
    invoice_number: "ISO-INV-B-001",
    payment_amount: 222,
    ticket_subject: "ISO Ticket B",
    doc_title: "ISO Document B",
    notif_title: "ISO Notification B",
  },
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

function log(tag, msg) {
  console.log(`[phase5-seed] ${tag}: ${msg}`);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/**
 * Postgres direct URL for role fallback only — derived from NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD.
 * Never uses DATABASE_URL (may target another project). Validates sandbox ref / blocks protected ref.
 */
function resolvePhase5DatabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password?.trim() || !supabaseUrl) return null;

  if (isLocalSupabaseUrl(supabaseUrl)) {
    const host = process.env.SUPABASE_DB_HOST ?? "127.0.0.1:54322";
    return `postgresql://postgres:${encodeURIComponent(password)}@${host}/postgres`;
  }

  const ref = extractSupabaseProjectRef(supabaseUrl);
  if (!ref) return null;
  if (ref === PROTECTED_AUDIT_REF) {
    throw new Error(`BLOCKED: Postgres fallback refused for protected ref ${PROTECTED_AUDIT_REF}`);
  }

  const expected = process.env.PHASE5_SANDBOX_PROJECT_REF?.trim().toLowerCase();
  if (!expected) {
    throw new Error("PHASE5_SANDBOX_PROJECT_REF required for Postgres fallback on cloud");
  }
  if (expected === PROTECTED_AUDIT_REF) {
    throw new Error("PHASE5_SANDBOX_PROJECT_REF cannot equal protected audit ref");
  }
  if (ref !== expected) {
    throw new Error(
      `Postgres fallback: URL ref "${ref}" must match PHASE5_SANDBOX_PROJECT_REF="${expected}"`,
    );
  }

  const host = `db.${ref}.supabase.co`;
  if (!/^db\.[a-z0-9]{20}\.supabase\.co$/i.test(host)) {
    throw new Error(`Postgres fallback: invalid database host "${host}"`);
  }

  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

function isPermissionDenied(error) {
  const message = error?.message ?? String(error);
  return message.includes("permission denied") || error?.code === "42501";
}

function isConnectionError(error) {
  const message = error?.message ?? String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network/i.test(message);
}

function throwIfLookupError(error, label) {
  if (!error) return;
  if (isConnectionError(error)) {
    throw new Error(`${label} lookup failed (connection): ${error.message}`);
  }
  if (isPermissionDenied(error)) {
    throw new Error(`${label} lookup failed (permission): ${error.message}`);
  }
  throw new Error(`${label} lookup failed: ${error.message} (${error.code ?? "unknown"})`);
}

function profileMissingMessage(userId) {
  return `profiles row missing for user ${userId.slice(0, 8)}… — expected after Auth create; check on_auth_user_created trigger`;
}

/** Single connection: read-only profiles.id for assertProfileExists fallback (no GRANT on PostgREST). */
async function selectProfileIdViaPostgres(userId) {
  const dbUrl = resolvePhase5DatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      "PostgREST cannot access public.profiles with service_role (see migration 004). " +
        "Set SUPABASE_DB_PASSWORD in .env.client-isolation.local (same project as NEXT_PUBLIC_SUPABASE_URL).",
    );
  }

  const Client = await loadPgClient();
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
  } catch (error) {
    const msg = error?.message ?? String(error);
    if (error?.code === "28P01" || /password authentication failed/i.test(msg)) {
      throw new Error("Postgres authentication failed — check SUPABASE_DB_PASSWORD for this project");
    }
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(msg)) {
      throw new Error(`Postgres connection failed: ${msg}`);
    }
    throw new Error(`Postgres connection failed: ${msg}`);
  }

  try {
    const result = await client.query("select id from public.profiles where id = $1", [userId]);
    return result.rowCount > 0;
  } catch (error) {
    const msg = error?.message ?? String(error);
    if (error?.code === "42501" || /permission denied/i.test(msg)) {
      throw new Error(`profiles lookup failed (permission): ${msg}`);
    }
    throw new Error(`profiles lookup failed: ${msg} (${error?.code ?? "unknown"})`);
  } finally {
    await client.end();
  }
}

/** Auth user id = profiles.id when trigger handle_new_user ran (001); confirm before created_by FKs. */
async function assertProfileExists(db, userId) {
  const { data, error } = await db.from("profiles").select("id").eq("id", userId).maybeSingle();

  if (!error) {
    if (data) return;
    throw new Error(profileMissingMessage(userId));
  }

  if (isPermissionDenied(error)) {
    log("profile", `Postgres fallback for user ${userId.slice(0, 8)}…`);
    const exists = await selectProfileIdViaPostgres(userId);
    if (!exists) throw new Error(profileMissingMessage(userId));
    return;
  }

  throwIfLookupError(error, "profiles");
}

async function loadPgClient() {
  try {
    const mod = await import("pg");
    return mod.default?.Client ?? mod.Client;
  } catch {
    throw new Error(
      "Cannot load 'pg'. It is listed in package.json — run `npm install` in the project root, then retry.",
    );
  }
}

/** Idempotent client role via postgres — preserves other user_roles; transactional. */
async function ensureClientRoleViaPostgres(dbUrl, userId) {
  const Client = await loadPgClient();
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
  } catch (error) {
    const msg = error?.message ?? String(error);
    if (error?.code === "28P01" || /password authentication failed/i.test(msg)) {
      throw new Error("Postgres authentication failed — check SUPABASE_DB_PASSWORD for this project");
    }
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(msg)) {
      throw new Error(`Postgres connection failed: ${msg}`);
    }
    throw new Error(`Postgres connection failed: ${msg}`);
  }

  try {
    await client.query("begin");
    const inserted = await client.query(
      `insert into public.user_roles (user_id, role_id)
       select $1, id from public.roles where slug = $2
       on conflict (user_id, role_id) do nothing`,
      [userId, "client"],
    );
    const check = await client.query(
      `select 1 from public.user_roles ur
       join public.roles r on r.id = ur.role_id
       where ur.user_id = $1 and r.slug = $2`,
      [userId, "client"],
    );
    if (check.rowCount === 0) {
      throw new Error("roles.client missing — run migrations first");
    }
    await client.query("commit");
    if (inserted.rowCount > 0) {
      log("postgres", "assigned client role");
    } else {
      log("postgres", "client role already present");
    }
  } catch (error) {
    await client.query("rollback").catch(() => {});
    const msg = error?.message ?? String(error);
    if (msg.includes("roles.client missing")) throw error;
    throw new Error(`Postgres role assignment failed: ${msg}`);
  } finally {
    await client.end();
  }
}

async function assignClientRolePostgresFallback(userId) {
  const dbUrl = resolvePhase5DatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      "PostgREST cannot access public.roles / public.user_roles with service_role (see migration 008). " +
        "Set SUPABASE_DB_PASSWORD in .env.client-isolation.local (same project as NEXT_PUBLIC_SUPABASE_URL).",
    );
  }
  log("role", `Postgres fallback for user ${userId.slice(0, 8)}…`);
  await ensureClientRoleViaPostgres(dbUrl, userId);
}

async function findUserByEmail(admin, email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

/** Only reuse/update accounts created by this seed (or same synthetic namespace). */
function isPhase5SyntheticAuthUser(user) {
  if (user?.user_metadata?.iso_marker === MARKER) return true;
  const email = user?.email?.toLowerCase() ?? "";
  return (
    email === CLIENT_A_EMAIL.toLowerCase() ||
    email === CLIENT_B_EMAIL.toLowerCase()
  );
}

async function ensureAuthUser(admin, email, password, fullName) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    if (!isPhase5SyntheticAuthUser(existing)) {
      throw new Error(
        `Refusing to update Auth user ${email}: not a Phase 5 synthetic account (expected iso_marker=${MARKER} or @multitenant-test.local fixture email).`,
      );
    }
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { full_name: fullName, iso_marker: MARKER },
    });
    log("user", `updated ${email.split("@")[0]}@…`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, iso_marker: MARKER },
  });
  if (error) throw error;
  log("user", `created ${email.split("@")[0]}@…`);
  return data.user.id;
}

async function ensureClientRole(db, userId) {
  const { data: role, error: roleError } = await db
    .from("roles")
    .select("id")
    .eq("slug", "client")
    .maybeSingle();

  if (roleError) {
    if (isConnectionError(roleError)) {
      throw new Error(`roles lookup failed (connection): ${roleError.message}`);
    }
    if (isPermissionDenied(roleError)) {
      await assignClientRolePostgresFallback(userId);
      return;
    }
    throw new Error(`roles lookup failed: ${roleError.message} (${roleError.code ?? "unknown"})`);
  }

  if (!role) {
    throw new Error("roles.client missing — run migrations first");
  }

  const { data: existingLink, error: linkError } = await db
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .eq("role_id", role.id)
    .maybeSingle();

  if (linkError) {
    if (isConnectionError(linkError)) {
      throw new Error(`user_roles lookup failed (connection): ${linkError.message}`);
    }
    if (isPermissionDenied(linkError)) {
      await assignClientRolePostgresFallback(userId);
      return;
    }
    throw new Error(`user_roles lookup failed: ${linkError.message} (${linkError.code ?? "unknown"})`);
  }

  if (existingLink) {
    log("role", "client already assigned (PostgREST)");
    return;
  }

  const { error: insertError } = await db
    .from("user_roles")
    .insert({ user_id: userId, role_id: role.id });
  if (!insertError) {
    log("role", "client assigned via PostgREST");
    return;
  }
  if (insertError.code === "23505") {
    log("role", "client already assigned (race)");
    return;
  }
  if (isConnectionError(insertError)) {
    throw new Error(`user_roles insert failed (connection): ${insertError.message}`);
  }
  if (isPermissionDenied(insertError)) {
    await assignClientRolePostgresFallback(userId);
    return;
  }
  throw new Error(`user_roles insert failed: ${insertError.message} (${insertError.code ?? "unknown"})`);
}

async function ensureCompany(db, spec) {
  const { data: existing, error: lookupError } = await db
    .from("companies")
    .select("id")
    .eq("tax_id", spec.tax_id)
    .maybeSingle();
  throwIfLookupError(lookupError, "companies");
  if (existing) return existing.id;
  const { data, error } = await db
    .from("companies")
    .insert({
      name: spec.name,
      legal_name: `${spec.name} Lda`,
      tax_id: spec.tax_id,
      website: `https://${spec.key.toLowerCase()}.iso.test`,
      locale: "pt",
      currency: "EUR",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureCompanyUser(db, companyId, userId) {
  const { error } = await db.from("company_users").upsert(
    { company_id: companyId, user_id: userId, is_primary: true, contact_role: "owner" },
    { onConflict: "company_id,user_id" },
  );
  if (error) throw error;
}

async function getMaintenanceService(db) {
  const { data: svc, error } = await db.from("services").select("id").eq("slug", "maintenance").maybeSingle();
  throwIfLookupError(error, "services");
  if (!svc) throw new Error("services.maintenance missing — run migrations first");
  return svc.id;
}

async function ensureSubscription(db, companyId, serviceId) {
  const { data: existing, error: lookupError } = await db
    .from("client_subscriptions")
    .select("id")
    .eq("company_id", companyId)
    .eq("service_id", serviceId)
    .maybeSingle();
  throwIfLookupError(lookupError, "client_subscriptions");
  if (existing) return existing.id;
  const { data, error } = await db
    .from("client_subscriptions")
    .insert({
      company_id: companyId,
      service_id: serviceId,
      status: "active",
      billing_period: "monthly",
      price: 99,
      currency: "EUR",
      config: { marker: MARKER },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureProject(db, companyId, serviceId, name) {
  const { data: existing, error: lookupError } = await db
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", name)
    .maybeSingle();
  throwIfLookupError(lookupError, "projects");
  if (existing) return existing.id;
  const { data, error } = await db
    .from("projects")
    .insert({
      company_id: companyId,
      service_id: serviceId,
      name,
      description: `${name} (${MARKER})`,
      project_type: "website",
      progress: 10,
      priority: "normal",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureInvoicePayment(db, companyId, subId, spec) {
  const { data: existingInv, error: invLookupError } = await db
    .from("invoices")
    .select("id")
    .eq("invoice_number", spec.invoice_number)
    .maybeSingle();
  throwIfLookupError(invLookupError, "invoices");
  let invoiceId = existingInv?.id;
  if (!invoiceId) {
    const { data, error } = await db
      .from("invoices")
      .insert({
        company_id: companyId,
        subscription_id: subId,
        invoice_number: spec.invoice_number,
        status: "paid",
        subtotal: spec.payment_amount,
        tax: 0,
        total: spec.payment_amount,
        amount_paid: spec.payment_amount,
        currency: "EUR",
      })
      .select("id")
      .single();
    if (error) throw error;
    invoiceId = data.id;
  }

  const { data: existingPay, error: payLookupError } = await db
    .from("payments")
    .select("id")
    .eq("company_id", companyId)
    .eq("transaction_reference", `ISO-PAY-${spec.key}`)
    .maybeSingle();
  throwIfLookupError(payLookupError, "payments");
  if (!existingPay) {
    const { error } = await db.from("payments").insert({
      company_id: companyId,
      invoice_id: invoiceId,
      subscription_id: subId,
      amount: spec.payment_amount,
      currency: "EUR",
      status: "succeeded",
      transaction_reference: `ISO-PAY-${spec.key}`,
      metadata: { marker: MARKER },
    });
    if (error) throw error;
  }
}

async function ensureDocument(db, companyId, projectId, clientId, title) {
  const { data: existing, error: lookupError } = await db
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("title", title)
    .maybeSingle();
  throwIfLookupError(lookupError, "documents");
  if (existing) return existing.id;
  const { data, error } = await db
    .from("documents")
    .insert({
      company_id: companyId,
      project_id: projectId,
      category: "project",
      title,
      visibility: "client_visible",
      created_by: clientId,
      metadata: { marker: MARKER },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureTicket(db, companyId, projectId, clientId, subject) {
  const { data: existing, error: lookupError } = await db
    .from("tickets")
    .select("id")
    .eq("company_id", companyId)
    .eq("subject", subject)
    .maybeSingle();
  throwIfLookupError(lookupError, "tickets");
  if (existing) return existing.id;
  const { data, error } = await db
    .from("tickets")
    .insert({
      company_id: companyId,
      project_id: projectId,
      subject,
      status: "new",
      priority: "normal",
      created_by: clientId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureNotification(db, userId, companyId, projectId, title) {
  const { data: existing, error: lookupError } = await db
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .maybeSingle();
  throwIfLookupError(lookupError, "notifications");
  if (existing) return;
  const { error } = await db.from("notifications").insert({
    user_id: userId,
    company_id: companyId,
    project_id: projectId,
    type: "system",
    title,
    body: `${title} body`,
    category: "project_updates",
  });
  if (error) throw error;
}

async function seedCompanyBundle(db, admin, spec, email, password) {
  const userId = await ensureAuthUser(admin, email, password, `Client ${spec.key} ISO`);
  await assertProfileExists(db, userId);
  await ensureClientRole(db, userId);
  const companyId = await ensureCompany(db, spec);
  await ensureCompanyUser(db, companyId, userId);
  const serviceId = await getMaintenanceService(db);
  const subId = await ensureSubscription(db, companyId, serviceId);
  const projectId = await ensureProject(db, companyId, serviceId, spec.project_name);
  await ensureInvoicePayment(db, companyId, subId, spec);
  await ensureDocument(db, companyId, projectId, userId, spec.doc_title);
  await ensureTicket(db, companyId, projectId, userId, spec.ticket_subject);
  await ensureNotification(db, userId, companyId, projectId, spec.notif_title);
  return { userId, companyId, projectId, subId, key: spec.key };
}

async function main() {
  loadEnvFile(resolve(ROOT, ".env.client-isolation.local"));
  assertPhase5IsolationTarget({ requirePhase5Flag: true });

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  const password = requireEnv("CLIENT_ISOLATION_TEST_PASSWORD");

  const authAdmin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "phase5-seed-auth" },
  });
  const db = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "phase5-seed-db" },
  });

  log("target", url);
  const bundleA = await seedCompanyBundle(db, authAdmin, COMPANIES[0], CLIENT_A_EMAIL, password);
  const bundleB = await seedCompanyBundle(db, authAdmin, COMPANIES[1], CLIENT_B_EMAIL, password);

  const context = {
    marker: MARKER,
    seeded_at: new Date().toISOString(),
    local_url: url,
    companies: {
      A: { id: bundleA.companyId, project_id: bundleA.projectId },
      B: { id: bundleB.companyId, project_id: bundleB.projectId },
    },
    actors: { CLIENT_A: "client-a", CLIENT_B: "client-b" },
  };

  const outPath = resolve(ROOT, "docs", "audit", "phase5-seed-context.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(context, null, 2), "utf8");
  log("done", `context → docs/audit/phase5-seed-context.json`);
}

main().catch((e) => {
  console.error("[phase5-seed] FAILED:", e.message ?? e);
  process.exit(1);
});