/**
 * Artecium — demo environment seed (server-side only).
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_CLIENT_PASSWORD, DEMO_OWNER_PASSWORD, DEMO_ADMIN_PASSWORD, DEMO_STAFF_PASSWORD
 *
 * Usage: npm run db:seed:demo
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DEMO_COMPANY_NAME = "Artecium Demo Client";
const DEMO_TAX_ID = "DEMO-PT-0001";
const DEMO_PROJECT_NAME = "Artecium Demo Website";
const DEMO_MARKER = "artecium-demo-v1";

/** @typedef {{ email: string; passwordEnv: string; fullName: string; roles: string[]; linkToCompany?: boolean; contactRole?: string; staffAssignment?: boolean; roleHint?: string }} DemoUser */

/** @type {DemoUser[]} */
const DEMO_USERS = [
  {
    email: "demo.client@artecium.test",
    passwordEnv: "DEMO_CLIENT_PASSWORD",
    fullName: "Demo Client",
    roles: ["client"],
    linkToCompany: true,
    contactRole: "owner",
  },
  {
    email: "demo.owner@artecium.test",
    passwordEnv: "DEMO_OWNER_PASSWORD",
    fullName: "Demo Owner",
    roles: ["owner"],
  },
  {
    email: "demo.admin@artecium.test",
    passwordEnv: "DEMO_ADMIN_PASSWORD",
    fullName: "Demo Admin",
    roles: ["admin"],
    staffAssignment: true,
    roleHint: "admin",
  },
  {
    email: "demo.developer@artecium.test",
    passwordEnv: "DEMO_STAFF_PASSWORD",
    fullName: "Demo Developer",
    roles: ["developer"],
    staffAssignment: true,
    roleHint: "developer",
  },
  {
    email: "demo.designer@artecium.test",
    passwordEnv: "DEMO_STAFF_PASSWORD",
    fullName: "Demo Designer",
    roles: ["designer"],
    staffAssignment: true,
    roleHint: "designer",
  },
  {
    email: "demo.seo@artecium.test",
    passwordEnv: "DEMO_STAFF_PASSWORD",
    fullName: "Demo SEO",
    roles: ["seo"],
    staffAssignment: true,
    roleHint: "seo",
  },
  {
    email: "demo.support@artecium.test",
    passwordEnv: "DEMO_STAFF_PASSWORD",
    fullName: "Demo Support",
    roles: ["support"],
    staffAssignment: true,
    roleHint: "support",
  },
  {
    email: "demo.finance@artecium.test",
    passwordEnv: "DEMO_STAFF_PASSWORD",
    fullName: "Demo Finance",
    roles: ["finance"],
    staffAssignment: true,
    roleHint: "finance",
  },
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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function log(step, message) {
  console.log(`[seed] ${step}: ${message}`);
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return null;

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/i);
  if (!match) return null;

  const projectRef = match[1];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

function isPermissionDenied(error) {
  const message = error?.message ?? String(error);
  return message.includes("permission denied") || error?.code === "42501";
}

async function runPostgresScript(source) {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { spawn } = await import("node:child_process");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = await mkdtemp(join(tmpdir(), "artecium-seed-"));
  const scriptPath = join(dir, "run.mjs");
  await writeFile(scriptPath, source);

  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["--yes", "-p", "pg", "node", scriptPath],
      { shell: true, stdio: "inherit", env: process.env },
    );
    child.on("error", reject);
    child.on("close", async (code) => {
      await rm(dir, { recursive: true, force: true });
      if (code === 0) resolve();
      else reject(new Error(`Postgres helper exited with code ${code ?? "unknown"}`));
    });
  });
}

async function ensureServiceRoleAdminGrants(dbUrl) {
  const source = `
import pg from "pg";

const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();
const statements = [
  "grant usage on schema public to service_role",
  "grant select, insert, update, delete on table public.roles to service_role",
  "grant select, insert, update, delete on table public.user_roles to service_role",
];
for (const sql of statements) {
  try {
    await client.query(sql);
  } catch (error) {
    if (error.code !== "42704") throw error;
  }
}
await client.end();
console.log("[seed] postgres: ensured service_role grants on roles/user_roles");
`;
  await runPostgresScript(source);
}

async function assignUserRolesViaPostgres(dbUrl, userId, roleSlugs) {
  const source = `
import pg from "pg";

const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();
await client.query("delete from public.user_roles where user_id = $1", [${JSON.stringify(userId)}]);
for (const slug of ${JSON.stringify(roleSlugs)}) {
  const result = await client.query(
    "insert into public.user_roles (user_id, role_id) select $1, id from public.roles where slug = $2",
    [${JSON.stringify(userId)}, slug],
  );
  if (result.rowCount === 0) {
    throw new Error(\`Role slug not found: \${slug}\`);
  }
}
await client.end();
`;
  await runPostgresScript(source);
}

/**
 * Keep Auth Admin and PostgREST on separate clients so auth.admin calls never
 * attach a user JWT to table queries. Use sb_secret_* / service_role keys only
 * on the db client (server-side).
 */
function createServiceClients(url, secretKey) {
  const authAdmin = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "artecium-seed-auth",
    },
  });

  const db = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "artecium-seed-db",
    },
  });

  return { authAdmin, db };
}

function resolveSecretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    null
  );
}

function periodBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextRenewal = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10),
    nextRenewal: nextRenewal.toISOString(),
  };
}

async function preflightDbAccess(db) {
  const checks = [
    { table: "roles", columns: "id, slug" },
    { table: "user_roles", columns: "user_id, role_id" },
    { table: "companies", columns: "id" },
  ];

  for (const check of checks) {
    const { error } = await db.from(check.table).select(check.columns).limit(1);
    if (error) {
      throw new Error(
        `Preflight failed on public.${check.table}: ${error.message}. ` +
          "The secret key reaches PostgREST, but the service_role DB role lacks table GRANT. " +
          "Run scripts/grant-service-role-admin.sql once in the Supabase SQL Editor, then retry.",
      );
    }
  }
  log("preflight", "PostgREST service_role access OK");
}

async function findUserByEmail(admin, email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(admin, { email, password, fullName }) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { full_name: fullName, demo: DEMO_MARKER },
    });
    if (error) throw error;
    log("user", `updated ${email}`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, demo: DEMO_MARKER },
  });
  if (error) throw error;
  log("user", `created ${email}`);
  return data.user.id;
}

async function ensureUserRoles(db, userId, roleSlugs) {
  const { data: roles, error: rolesError } = await db
    .from("roles")
    .select("id, slug")
    .in("slug", roleSlugs);

  if (!rolesError) {
    const { error: deleteError } = await db
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (deleteError) throw deleteError;

    if (!roles?.length) return;

    const { error: insertError } = await db.from("user_roles").insert(
      roles.map((r) => ({ user_id: userId, role_id: r.id })),
    );
    if (!insertError) return;
    if (!isPermissionDenied(insertError)) throw insertError;
  } else if (!isPermissionDenied(rolesError)) {
    throw rolesError;
  }

  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      "PostgREST cannot access public.roles / public.user_roles with the secret key. " +
        "For sb_secret_* keys, PostgREST uses the apikey header only (not Authorization Bearer). " +
        "If this persists, set DATABASE_URL or SUPABASE_DB_PASSWORD, or run once in Supabase SQL editor:\n" +
        "  grant select, insert, update, delete on table public.roles to service_role;\n" +
        "  grant select, insert, update, delete on table public.user_roles to service_role;",
    );
  }

  log("roles", `using Postgres fallback for user ${userId}`);
  await ensureServiceRoleAdminGrants(dbUrl);
  await assignUserRolesViaPostgres(dbUrl, userId, roleSlugs);
}

async function ensureCompany(db) {
  const { data: existing } = await db
    .from("companies")
    .select("id")
    .eq("tax_id", DEMO_TAX_ID)
    .maybeSingle();

  if (existing) {
    log("company", `exists (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await db
    .from("companies")
    .insert({
      name: DEMO_COMPANY_NAME,
      legal_name: `${DEMO_COMPANY_NAME} Lda`,
      tax_id: DEMO_TAX_ID,
      website: "https://demo.artecium.test",
      locale: "pt",
      currency: "EUR",
    })
    .select("id")
    .single();
  if (error) throw error;
  log("company", `created (${data.id})`);
  return data.id;
}

async function ensureCompanyUser(db, companyId, userId, contactRole) {
  const { error } = await db.from("company_users").upsert(
    {
      company_id: companyId,
      user_id: userId,
      is_primary: true,
      contact_role: contactRole,
    },
    { onConflict: "company_id,user_id" },
  );
  if (error) throw error;
}

async function ensureStaffAssignment(db, companyId, userId, roleHint, assignedBy) {
  const { error } = await db.from("staff_company_assignments").upsert(
    {
      user_id: userId,
      company_id: companyId,
      role_hint: roleHint,
      assigned_by: assignedBy,
    },
    { onConflict: "user_id,company_id" },
  );
  if (error) throw error;
}

async function getCatalogIds(db) {
  const { data: services, error: sErr } = await db
    .from("services")
    .select("id, slug")
    .in("slug", [
      "website",
      "maintenance",
      "analytics",
      "seo",
    ]);
  if (sErr) throw sErr;

  const serviceMap = Object.fromEntries(services.map((s) => [s.slug, s.id]));

  const { data: plan, error: pErr } = await db
    .from("service_plans")
    .select("id, slug, price")
    .eq("slug", "professional")
    .maybeSingle();
  if (pErr) throw pErr;

  const maintenanceServiceId = serviceMap.maintenance;
  let professionalPlan = plan;
  if (professionalPlan && maintenanceServiceId) {
    const { data: scopedPlan } = await db
      .from("service_plans")
      .select("id, slug, price")
      .eq("service_id", maintenanceServiceId)
      .eq("slug", "professional")
      .maybeSingle();
    professionalPlan = scopedPlan ?? professionalPlan;
  }

  const { data: features, error: fErr } = await db
    .from("service_features")
    .select("id, slug")
    .in("slug", ["monthly_changes_minutes", "analytics_access", "seo_access"]);
  if (fErr) throw fErr;

  const featureMap = Object.fromEntries(features.map((f) => [f.slug, f.id]));

  return { serviceMap, professionalPlan, featureMap };
}

async function ensureSubscription(
  db,
  { companyId, serviceId, planId, price, billingPeriod, config },
) {
  let query = db
    .from("client_subscriptions")
    .select("id")
    .eq("company_id", companyId)
    .eq("service_id", serviceId);

  if (planId) query = query.eq("service_plan_id", planId);
  else query = query.is("service_plan_id", null);

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;

  const bounds = periodBounds();
  const { data, error } = await db
    .from("client_subscriptions")
    .insert({
      company_id: companyId,
      service_id: serviceId,
      service_plan_id: planId,
      status: "active",
      price,
      currency: "EUR",
      billing_period: billingPeriod,
      started_at: bounds.periodStart,
      current_period_start: bounds.periodStart,
      current_period_end: bounds.periodEnd,
      config: { demo: DEMO_MARKER, ...config },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureFeatureOverride(db, subscriptionId, featureId) {
  const { data: existing } = await db
    .from("subscription_feature_overrides")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .eq("feature_id", featureId)
    .maybeSingle();
  if (existing) return;

  const { error } = await db.from("subscription_feature_overrides").insert({
    subscription_id: subscriptionId,
    feature_id: featureId,
    is_enabled: true,
  });
  if (error) throw error;
}

async function ensureUsageRecord(
  db,
  { subscriptionId, featureId, companyId, projectId, quantity, unit, description },
) {
  const bounds = periodBounds();
  const { data: existing } = await db
    .from("usage_records")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .eq("feature_id", featureId)
    .eq("period_start", bounds.periodStartDate)
    .eq("period_end", bounds.periodEndDate)
    .maybeSingle();
  if (existing) return;

  const { error } = await db.from("usage_records").insert({
    subscription_id: subscriptionId,
    feature_id: featureId,
    company_id: companyId,
    project_id: projectId,
    period_start: bounds.periodStartDate,
    period_end: bounds.periodEndDate,
    quantity_used: quantity,
    unit,
    description,
  });
  if (error) throw error;
}

async function ensureProject(db, companyId, websiteServiceId, ownerUserId) {
  const { data: existing } = await db
    .from("projects")
    .select("id, status_id")
    .eq("company_id", companyId)
    .eq("name", DEMO_PROJECT_NAME)
    .maybeSingle();

  const { data: devStatus } = await db
    .from("project_statuses")
    .select("id")
    .eq("slug", "development")
    .maybeSingle();
  const { data: analysisStatus } = await db
    .from("project_statuses")
    .select("id")
    .eq("slug", "analysis")
    .maybeSingle();

  if (existing) {
    log("project", `exists (${existing.id})`);
    return { projectId: existing.id, analysisStatusId: analysisStatus?.id, devStatusId: devStatus?.id };
  }

  const bounds = periodBounds();
  const { data, error } = await db
    .from("projects")
    .insert({
      company_id: companyId,
      service_id: websiteServiceId,
      name: DEMO_PROJECT_NAME,
      description: "Demo website project for platform testing.",
      project_type: "website",
      status_id: devStatus?.id ?? null,
      progress: 45,
      owner_id: ownerUserId,
      priority: "normal",
      contract_value: 3500,
      estimated_budget: 4000,
      start_date: bounds.periodStartDate,
      expected_completion_date: bounds.periodEndDate,
      client_notes: "Demo client notes — visible in admin.",
      internal_notes: "Demo internal notes — staff only.",
    })
    .select("id")
    .single();
  if (error) throw error;

  if (analysisStatus?.id && devStatus?.id) {
    await db.from("project_status_history").insert({
      project_id: data.id,
      from_status_id: analysisStatus.id,
      to_status_id: devStatus.id,
      changed_by: ownerUserId,
      note: "Demo: moved from analysis to development",
    });
  }

  log("project", `created (${data.id})`);
  return { projectId: data.id, analysisStatusId: analysisStatus?.id, devStatusId: devStatus?.id };
}

async function ensureMilestonesAndTasks(db, projectId, developerId) {
  /** @type {{ title: string; sort: number; tasks: { title: string; priority: string; minutes: number }[] }[]} */
  const milestones = [
    {
      title: "Discovery",
      sort: 1,
      tasks: [{ title: "Requirements analysis", priority: "high", minutes: 240 }],
    },
    {
      title: "Design",
      sort: 2,
      tasks: [
        { title: "Homepage design", priority: "normal", minutes: 360 },
        { title: "Responsive design", priority: "normal", minutes: 300 },
      ],
    },
    {
      title: "Development",
      sort: 3,
      tasks: [
        { title: "Frontend development", priority: "high", minutes: 600 },
        { title: "Backend integration", priority: "normal", minutes: 480 },
        { title: "Authentication", priority: "normal", minutes: 180 },
      ],
    },
    {
      title: "Testing",
      sort: 4,
      tasks: [
        { title: "SEO setup", priority: "normal", minutes: 120 },
        { title: "Analytics integration", priority: "normal", minutes: 90 },
        { title: "Testing", priority: "high", minutes: 240 },
      ],
    },
    {
      title: "Launch",
      sort: 5,
      tasks: [{ title: "Final review", priority: "normal", minutes: 120 }],
    },
  ];

  for (const ms of milestones) {
    const { data: existingMs } = await db
      .from("project_milestones")
      .select("id")
      .eq("project_id", projectId)
      .eq("title", ms.title)
      .maybeSingle();

    let milestoneId = existingMs?.id;
    if (!milestoneId) {
      const { data: inserted, error } = await db
        .from("project_milestones")
        .insert({
          project_id: projectId,
          title: ms.title,
          description: `Demo milestone: ${ms.title}`,
          status: ms.sort <= 2 ? "completed" : ms.sort === 3 ? "in_progress" : "pending",
          sort_order: ms.sort,
          responsible_user_id: developerId,
        })
        .select("id")
        .single();
      if (error) throw error;
      milestoneId = inserted.id;
    }

    for (const task of ms.tasks) {
      const { data: existingTask } = await db
        .from("tasks")
        .select("id")
        .eq("project_id", projectId)
        .eq("title", task.title)
        .maybeSingle();
      if (existingTask) continue;

      const { error } = await db.from("tasks").insert({
        project_id: projectId,
        milestone_id: milestoneId,
        title: task.title,
        description: `Demo task — ${task.title}`,
        status: ms.sort <= 2 ? "done" : "todo",
        priority: task.priority,
        assignee_id: developerId,
        estimated_minutes: task.minutes,
        actual_minutes: ms.sort <= 2 ? Math.round(task.minutes * 0.9) : null,
      });
      if (error) throw error;
    }
  }
}

async function ensureInvoicesAndPayments(db, companyId, maintenanceSubId, financeUserId) {
  const invoices = [
    {
      number: "DEMO-INV-001",
      status: "paid",
      subtotal: 100,
      tax: 23,
      total: 123,
      amount_paid: 123,
      paid: true,
    },
    {
      number: "DEMO-INV-002",
      status: "issued",
      subtotal: 100,
      tax: 23,
      total: 123,
      amount_paid: 0,
      paid: false,
    },
  ];

  const bounds = periodBounds();
  const dueDate = bounds.periodEndDate;
  const issueDate = bounds.periodStartDate;

  for (const inv of invoices) {
    const { data: existing } = await db
      .from("invoices")
      .select("id")
      .eq("invoice_number", inv.number)
      .maybeSingle();

    let invoiceId = existing?.id;
    if (!invoiceId) {
      const { data, error } = await db
        .from("invoices")
        .insert({
          company_id: companyId,
          subscription_id: maintenanceSubId,
          invoice_number: inv.number,
          status: inv.status,
          issue_date: issueDate,
          due_date: dueDate,
          subtotal: inv.subtotal,
          tax: inv.tax,
          total: inv.total,
          amount_paid: inv.amount_paid,
          currency: "EUR",
          paid_at: inv.paid ? new Date().toISOString() : null,
          notes: "Demo invoice — not a real charge",
        })
        .select("id")
        .single();
      if (error) throw error;
      invoiceId = data.id;

      await db.from("invoice_items").insert({
        invoice_id: invoiceId,
        description: "Maintenance Professional — monthly fee (demo)",
        quantity: 1,
        unit_price: inv.subtotal,
      });
    }

    if (inv.paid) {
      const { data: existingPayment } = await db
        .from("payments")
        .select("id")
        .eq("invoice_id", invoiceId)
        .maybeSingle();
      if (!existingPayment) {
        await db.from("payments").insert({
          company_id: companyId,
          invoice_id: invoiceId,
          subscription_id: maintenanceSubId,
          amount: inv.total,
          currency: "EUR",
          status: "succeeded",
          provider: "demo",
          provider_payment_id: `demo-pay-${inv.number}`,
          transaction_reference: `DEMO-TXN-${inv.number}`,
          paid_at: new Date().toISOString(),
          metadata: { demo: DEMO_MARKER },
        });
      }
    }
  }
}

async function ensureTickets(db, companyId, projectId, clientId, supportId) {
  const tickets = [
    {
      subject: "Website — dúvida sobre desenvolvimento",
      status: "new",
      priority: "normal",
      channel: "portal",
      messages: [
        { authorId: clientId, body: "Olá, podem confirmar o estado do desenvolvimento da homepage?" },
        {
          authorId: supportId,
          body: "Olá! A homepage está em desenvolvimento. Enviaremos uma pré-visualização em breve.",
        },
      ],
    },
    {
      subject: "Pedido de alteração",
      status: "in_progress",
      priority: "normal",
      channel: "email",
      messages: [
        { authorId: clientId, body: "Gostaríamos de alterar o texto da secção de serviços." },
      ],
    },
  ];

  for (const t of tickets) {
    const { data: existing } = await db
      .from("tickets")
      .select("id")
      .eq("company_id", companyId)
      .eq("subject", t.subject)
      .maybeSingle();

    let ticketId = existing?.id;
    if (!ticketId) {
      const { data, error } = await db
        .from("tickets")
        .insert({
          company_id: companyId,
          project_id: projectId,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          channel: t.channel,
          created_by: clientId,
          assignee_id: supportId,
        })
        .select("id")
        .single();
      if (error) throw error;
      ticketId = data.id;
    }

    for (const msg of t.messages) {
      const { data: existingMsg } = await db
        .from("ticket_messages")
        .select("id")
        .eq("ticket_id", ticketId)
        .eq("body", msg.body)
        .maybeSingle();
      if (existingMsg) continue;

      await db.from("ticket_messages").insert({
        ticket_id: ticketId,
        author_id: msg.authorId,
        body: msg.body,
      });
    }
  }
}

async function ensureDocuments(db, companyId, projectId, clientId) {
  const docs = [
    { title: "Project Brief", type: "proposal", visibility: "client_visible", category: "project" },
    { title: "Website Proposal", type: "proposal", visibility: "client_visible", category: "sales" },
    { title: "Technical Specification", type: "technical", visibility: "client_visible", category: "technical" },
    { title: "Monthly Report", type: "report", visibility: "client_visible", category: "reporting" },
    { title: "Internal Delivery Notes", type: "internal", visibility: "internal_only", category: "internal" },
  ];

  for (const doc of docs) {
    const { data: existing } = await db
      .from("documents")
      .select("id")
      .eq("company_id", companyId)
      .eq("title", doc.title)
      .maybeSingle();
    if (existing) continue;

    const { error } = await db.from("documents").insert({
      company_id: companyId,
      project_id: projectId,
      category: doc.category,
      document_type: doc.type,
      title: doc.title,
      visibility: doc.visibility,
      file_path: `demo://${doc.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      created_by: clientId,
      metadata: { demo: DEMO_MARKER },
    });
    if (error) throw error;
  }
}

async function ensureAnalytics(db, companyId, projectId) {
  const { data: existing } = await db
    .from("analytics_connections")
    .select("id")
    .eq("company_id", companyId)
    .eq("property_id", "GA-DEMO-123456")
    .maybeSingle();

  let connectionId = existing?.id;
  if (!connectionId) {
    const { data, error } = await db
      .from("analytics_connections")
      .insert({
        company_id: companyId,
        project_id: projectId,
        provider: "google_analytics",
        account_id: "DEMO-ACCOUNT",
        property_id: "GA-DEMO-123456",
        display_name: "Demo Analytics Property",
        status: "active",
        connected_at: new Date().toISOString(),
        metadata: { demo: DEMO_MARKER, note: "Not connected to real Google Analytics" },
      })
      .select("id")
      .single();
    if (error) throw error;
    connectionId = data.id;
  }

  const dates = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  });

  for (const metricDate of dates) {
    const { data: existingRow } = await db
      .from("analytics_data")
      .select("id")
      .eq("connection_id", connectionId)
      .eq("metric_date", metricDate)
      .maybeSingle();
    if (existingRow) continue;

    await db.from("analytics_data").insert({
      connection_id: connectionId,
      metric_date: metricDate,
      users: 40 + Math.floor(Math.random() * 30),
      sessions: 55 + Math.floor(Math.random() * 40),
      page_views: 120 + Math.floor(Math.random() * 80),
      conversions: Math.floor(Math.random() * 5),
      payload: { demo: true, bounce_rate: 0.42 },
    });
  }

  return connectionId;
}

async function ensureSeo(db, companyId, projectId) {
  const { data: existing } = await db
    .from("seo_connections")
    .select("id")
    .eq("company_id", companyId)
    .eq("site_url", "https://demo.artecium.test")
    .maybeSingle();

  let connectionId = existing?.id;
  if (!connectionId) {
    const { data, error } = await db
      .from("seo_connections")
      .insert({
        company_id: companyId,
        project_id: projectId,
        provider: "google_search_console",
        site_url: "https://demo.artecium.test",
        property_identifier: "sc-domain:demo.artecium.test",
        display_name: "Demo Search Console",
        status: "active",
        connected_at: new Date().toISOString(),
        metadata: { demo: DEMO_MARKER },
      })
      .select("id")
      .single();
    if (error) throw error;
    connectionId = data.id;
  }

  const dates = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  });

  for (const metricDate of dates) {
    const { data: existingRow } = await db
      .from("seo_data")
      .select("id")
      .eq("connection_id", connectionId)
      .eq("metric_date", metricDate)
      .maybeSingle();
    if (existingRow) continue;

    const clicks = 10 + Math.floor(Math.random() * 20);
    const impressions = 200 + Math.floor(Math.random() * 150);
    await db.from("seo_data").insert({
      connection_id: connectionId,
      metric_date: metricDate,
      clicks,
      impressions,
      ctr: clicks / impressions,
      average_position: 8 + Math.random() * 12,
      payload: { demo: true },
    });
  }
}

async function ensureNotifications(db, clientId, companyId, projectId) {
  const items = [
    { type: "project", title: "Projeto atualizado", body: "O projeto Artecium Demo Website foi atualizado.", category: "project_updates" },
    { type: "invoice", title: "Nova fatura disponível", body: "A fatura DEMO-INV-002 está disponível na sua área de cliente.", category: "payments" },
    { type: "document", title: "Novo documento disponível", body: "O documento Monthly Report foi publicado.", category: "reports" },
    { type: "support", title: "Resposta ao ticket", body: "Recebeu uma nova resposta no ticket de suporte.", category: "support" },
  ];

  for (const n of items) {
    const { data: existing } = await db
      .from("notifications")
      .select("id")
      .eq("user_id", clientId)
      .eq("title", n.title)
      .maybeSingle();
    if (existing) continue;

    await db.from("notifications").insert({
      user_id: clientId,
      company_id: companyId,
      project_id: projectId,
      type: n.type,
      category: n.category,
      title: n.title,
      body: n.body,
    });
  }
}

async function ensureMeetings(db, companyId, projectId, adminId) {
  const meetings = [
    { title: "Project Kickoff", daysFromNow: -14 },
    { title: "Monthly Review", daysFromNow: 7 },
  ];

  for (const m of meetings) {
    const { data: existing } = await db
      .from("meetings")
      .select("id")
      .eq("company_id", companyId)
      .eq("title", m.title)
      .maybeSingle();
    if (existing) continue;

    const start = new Date();
    start.setDate(start.getDate() + m.daysFromNow);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    await db.from("meetings").insert({
      company_id: companyId,
      project_id: projectId,
      title: m.title,
      description: `Demo meeting — ${m.title}`,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      meeting_url: "https://meet.demo.artecium.test/demo-room",
      status: m.daysFromNow < 0 ? "completed" : "scheduled",
      created_by: adminId,
    });
  }
}

async function ensureReports(db, companyId, projectId) {
  const { data: existing } = await db
    .from("reports")
    .select("id")
    .eq("company_id", companyId)
    .eq("title", "Monthly Project Report")
    .maybeSingle();
  if (existing) return;

  const bounds = periodBounds();
  await db.from("reports").insert({
    company_id: companyId,
    project_id: projectId,
    report_type: "monthly",
    title: "Monthly Project Report",
    period_start: bounds.periodStartDate,
    period_end: bounds.periodEndDate,
    visibility: "client_visible",
    file_path: "demo://monthly-project-report.pdf",
  });
}

async function ensureFeedback(db, companyId, projectId, clientId) {
  const { data: existing } = await db
    .from("feedback")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", clientId)
    .maybeSingle();
  if (existing) return;

  await db.from("feedback").insert({
    company_id: companyId,
    project_id: projectId,
    user_id: clientId,
    rating: 5,
    comment: "Demo feedback — great progress on the website project.",
  });
}

async function ensureProjectMember(db, projectId, userId) {
  const { error } = await db.from("project_members").upsert(
    { project_id: projectId, user_id: userId, role: "developer" },
    { onConflict: "project_id,user_id" },
  );
  if (error) throw error;
}

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = resolveSecretKey();
  if (!secretKey) {
    throw new Error(
      "Missing secret key: set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
    );
  }
  const { authAdmin, db } = createServiceClients(url, secretKey);

  log("start", DEMO_MARKER);
  await preflightDbAccess(db);

  /** @type {Record<string, string>} */
  const userIds = {};

  for (const spec of DEMO_USERS) {
    const password = requireEnv(spec.passwordEnv);
    userIds[spec.email] = await ensureAuthUser(authAdmin, {
      email: spec.email,
      password,
      fullName: spec.fullName,
    });
  }

  for (const spec of DEMO_USERS) {
    await ensureUserRoles(db, userIds[spec.email], spec.roles);
  }

  const companyId = await ensureCompany(db);
  const clientId = userIds["demo.client@artecium.test"];
  const ownerId = userIds["demo.owner@artecium.test"];
  const adminId = userIds["demo.admin@artecium.test"];
  const developerId = userIds["demo.developer@artecium.test"];
  const supportId = userIds["demo.support@artecium.test"];
  const financeId = userIds["demo.finance@artecium.test"];

  await ensureCompanyUser(db, companyId, clientId, "owner");

  for (const spec of DEMO_USERS) {
    if (spec.staffAssignment) {
      await ensureStaffAssignment(
        db,
        companyId,
        userIds[spec.email],
        spec.roleHint ?? spec.roles[0],
        ownerId,
      );
    }
  }

  const { serviceMap, professionalPlan, featureMap } = await getCatalogIds(db);

  if (!serviceMap.maintenance || !professionalPlan) {
    throw new Error(
      "Maintenance service or Professional plan not found. Run migrations 001 and 002 first.",
    );
  }

  const maintenanceSubId = await ensureSubscription(db, {
    companyId,
    serviceId: serviceMap.maintenance,
    planId: professionalPlan.id,
    price: Number(professionalPlan.price ?? 100),
    billingPeriod: "monthly",
    config: { tier: "professional" },
  });

  await ensureSubscription(db, {
    companyId,
    serviceId: serviceMap.website,
    planId: null,
    price: 3500,
    billingPeriod: "one_time",
    config: { tier: "professional", note: "Website project — no catalog plan (service has no plans)" },
  });

  let analyticsSubId = null;
  if (serviceMap.analytics) {
    analyticsSubId = await ensureSubscription(db, {
      companyId,
      serviceId: serviceMap.analytics,
      planId: null,
      price: 49,
      billingPeriod: "monthly",
      config: { demo: true },
    });
    if (featureMap.analytics_access) {
      await ensureFeatureOverride(db, analyticsSubId, featureMap.analytics_access);
    }
  }

  let seoSubId = null;
  if (serviceMap.seo) {
    seoSubId = await ensureSubscription(db, {
      companyId,
      serviceId: serviceMap.seo,
      planId: null,
      price: 79,
      billingPeriod: "monthly",
      config: { demo: true },
    });
    if (featureMap.seo_access) {
      await ensureFeatureOverride(db, seoSubId, featureMap.seo_access);
    }
  }

  if (featureMap.monthly_changes_minutes) {
    await ensureUsageRecord(db, {
      subscriptionId: maintenanceSubId,
      featureId: featureMap.monthly_changes_minutes,
      companyId,
      projectId: null,
      quantity: 80,
      unit: "minutes",
      description: "Demo usage — content updates",
    });
  }

  const { projectId } = await ensureProject(
    db,
    companyId,
    serviceMap.website,
    adminId,
  );

  await ensureProjectMember(db, projectId, developerId);
  await ensureMilestonesAndTasks(db, projectId, developerId);
  await ensureInvoicesAndPayments(db, companyId, maintenanceSubId, financeId);
  await ensureTickets(db, companyId, projectId, clientId, supportId);
  await ensureDocuments(db, companyId, projectId, clientId);
  await ensureAnalytics(db, companyId, projectId);
  await ensureSeo(db, companyId, projectId);
  await ensureNotifications(db, clientId, companyId, projectId);
  await ensureMeetings(db, companyId, projectId, adminId);
  await ensureReports(db, companyId, projectId);
  await ensureFeedback(db, companyId, projectId, clientId);

  console.log("\n[seed] Demo environment ready.");
  console.log(`[seed] Company: ${DEMO_COMPANY_NAME} (${companyId})`);
  console.log(`[seed] Project: ${DEMO_PROJECT_NAME} (${projectId})`);
  console.log("[seed] Run: npm run db:verify:demo");
}

main().catch((err) => {
  console.error("[seed] FAILED:", err.message ?? err);
  process.exit(1);
});
