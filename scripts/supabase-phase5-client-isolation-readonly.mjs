/**
 * Phase 5.1 — client multi-tenant isolation (local). Read + controlled write probes.
 * PHASE5_CLIENT_ISOLATION=1 node scripts/supabase-phase5-client-isolation-readonly.mjs
 *
 * Pure classifier self-test (no network/DB):
 *   PHASE5_INSERT_CLASSIFIER_SELFTEST=1 — INSERT S1–S14 + read/UPDATE classifiers
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertPhase5IsolationTarget, PROTECTED_AUDIT_REF } from "./phase5-isolation-guards.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "docs", "audit", "phase5-client-isolation-results.json");

const EMAIL_A = "client-a@multitenant-test.local";
const EMAIL_B = "client-b@multitenant-test.local";

/** @typedef {'PASS'|'FAIL'|'NOT_TESTED'|'PARTIAL'|'ERROR'} Status */

/** @typedef {'rls_reject'|'insert_accepted'|'ambiguous_no_error_no_row'|'grant_denied'|'privilege_ambiguous_42501'|'schema_constraint'|'schema_mismatch'|'auth_misconfig'|'unknown_reject'} InsertClassification */

/** @type {Array<Record<string, unknown>>} */
const cases = [];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function record(row) {
  cases.push(row);
  console.log(`[${row.status}] ${row.id}`);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireContextUuid(value, label) {
  if (typeof value !== "string" || !UUID_RE.test(value.trim())) {
    throw new Error(
      `Invalid phase5-seed-context.json: missing or invalid UUID for ${label} (re-run npm run db:seed:client-multi-tenant)`,
    );
  }
  return value.trim();
}

/** @param {import('@supabase/supabase-js').PostgrestError | null | undefined} err */
function sanitizePostgrestError(err) {
  if (!err) return null;
  const message = err.message ?? null;
  if (message && /bearer\s+[a-z0-9._-]+/i.test(message)) {
    return {
      code: err.code ?? null,
      message: "[redacted: message contained bearer token]",
      details: null,
      hint: null,
    };
  }
  return {
    code: err.code ?? null,
    message,
    details: err.details ?? null,
    hint: err.hint ?? null,
  };
}

function isRlsPolicyViolationMessage(message) {
  if (!message || typeof message !== "string") return false;
  if (/new row violates row-level security policy/i.test(message)) return true;
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") && (lower.includes("violates") || lower.includes("policy"))) {
    return true;
  }
  if (/query would be affected by row-level security policy/i.test(message)) return true;
  return false;
}

function isGrantDeniedMessage(message) {
  if (!message || typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("permission denied for table") ||
    lower.includes("permission denied for schema") ||
    lower.includes("permission denied for sequence") ||
    lower.includes("permission denied for function")
  );
}

function isSchemaMismatch(code, message) {
  const schemaCodes = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);
  if (code && schemaCodes.has(code)) return true;
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    (lower.includes("column") && lower.includes("does not exist")) ||
    (lower.includes("relation") && lower.includes("does not exist"))
  );
}

const SCHEMA_CONSTRAINT_CODES = new Set(["23502", "23503", "23514", "23505", "23513"]);

/** PostgREST head/count row: empty string message is a fault, not success. */
function hasPostgrestFault(meta) {
  if (meta.error_code) return true;
  if (meta.error_message === "") return true;
  if (meta.error_message != null && meta.error_message !== undefined) return true;
  return false;
}

function isCleanPostgrestSuccess(meta) {
  return !hasPostgrestFault(meta);
}

function resolveHeadCountSelectColumn(table) {
  return table === "company_users" ? "company_id" : "id";
}

/**
 * @param {{ count: number, error_message: string | null, error_code: string | null }} meta
 */
function classifyReadFault(meta) {
  const code = meta.error_code ?? "";
  const message = meta.error_message ?? "";
  if (message === "") {
    return { classification: "empty_error_message", status: "ERROR", reject_reason: "PostgREST error with empty message" };
  }
  if (isGrantDeniedMessage(message)) {
    return {
      classification: "grant_denied",
      status: "ERROR",
      reject_reason: "GRANT/privilege denied (read probe cannot prove RLS)",
    };
  }
  if (isRlsPolicyViolationMessage(message)) {
    return { classification: "rls_reject", status: "ERROR", reject_reason: "RLS error on read — unexpected for SELECT" };
  }
  if (SCHEMA_CONSTRAINT_CODES.has(code)) {
    return { classification: "schema_constraint", status: "ERROR", reject_reason: `Constraint (${code})` };
  }
  if (isSchemaMismatch(code, message)) {
    return { classification: "schema_mismatch", status: "ERROR", reject_reason: "Schema/column mismatch on read" };
  }
  if (code === "PGRST301" || /\bjwt\b/i.test(message)) {
    return { classification: "auth_misconfig", status: "NOT_TESTED", reject_reason: "JWT/session invalid for probe" };
  }
  if (code === "42501" && /permission denied/i.test(message)) {
    return {
      classification: "privilege_ambiguous_42501",
      status: "ERROR",
      reject_reason: "42501 without RLS wording on read",
    };
  }
  if (message) {
    return { classification: "unknown_reject", status: "ERROR", reject_reason: "Unclassified PostgREST read error" };
  }
  return null;
}

/**
 * @param {{ count: number, error_message: string | null, error_code: string | null }} meta
 * @param {number} minCount
 */
export function classifyOwnReadOutcome(meta, minCount = 1) {
  if (hasPostgrestFault(meta)) {
    const fault = classifyReadFault(meta);
    if (fault) return fault;
  }
  if (meta.count >= minCount && isCleanPostgrestSuccess(meta)) {
    return { classification: "rows_visible", status: "PASS", reject_reason: null };
  }
  if (meta.count < minCount && isCleanPostgrestSuccess(meta)) {
    return {
      classification: "no_rows_clean",
      status: "FAIL",
      reject_reason: `Expected >=${minCount} rows, got count=${meta.count}`,
    };
  }
  return { classification: "ambiguous_read", status: "ERROR", reject_reason: "Read outcome not classifiable" };
}

/** Cross-tenant read: PASS only count===0 with no PostgREST fault. */
export function classifyCrossReadOutcome(meta) {
  if (hasPostgrestFault(meta)) {
    const fault = classifyReadFault(meta);
    if (fault) return fault;
    return { classification: "unknown_reject", status: "ERROR", reject_reason: "Fault on cross read" };
  }
  if (meta.count === 0) {
    return { classification: "zero_rows_clean", status: "PASS", reject_reason: null };
  }
  return {
    classification: "cross_rows_visible",
    status: "FAIL",
    reject_reason: `Expected 0 rows, got count=${meta.count}`,
  };
}

function formatReadObserved(meta) {
  const parts = [`count=${meta.count}`];
  if (meta.error_code) parts.push(`code=${meta.error_code}`);
  if (meta.error_message) parts.push(`msg=${meta.error_message}`);
  return parts.join(" ");
}

/**
 * @param {{ rows: number, error: { code?: string | null, message?: string | null } | null }} result
 */
export function classifyUpdateProbeOutcome(result) {
  const error = result.error;
  const rows = result.rows ?? 0;
  const error_code = error?.code ?? null;
  const error_message = error?.message ?? null;

  if (rows > 0) {
    return {
      classification: "update_accepted",
      status: "FAIL",
      reject_reason: `${rows} row(s) updated (cross-tenant RLS failure)`,
      error_code,
      error_message,
    };
  }

  if (error) {
    const message = error_message ?? "";
    if (message === "") {
      return {
        classification: "empty_error_message",
        status: "ERROR",
        reject_reason: "UPDATE error with empty message",
        error_code,
        error_message,
      };
    }
    if (isRlsPolicyViolationMessage(message)) {
      return {
        classification: "rls_reject",
        status: "PASS",
        reject_reason: null,
        error_code,
        error_message,
      };
    }
    if (isGrantDeniedMessage(message)) {
      return {
        classification: "grant_denied",
        status: "ERROR",
        reject_reason: "GRANT denied — cannot prove RLS block",
        error_code,
        error_message,
      };
    }
    if (error_code === "42501" && /permission denied/i.test(message)) {
      return {
        classification: "privilege_ambiguous_42501",
        status: "ERROR",
        reject_reason: "42501 without RLS policy wording on UPDATE",
        error_code,
        error_message,
      };
    }
    if (isSchemaMismatch(error_code, message)) {
      return {
        classification: "schema_mismatch",
        status: "ERROR",
        reject_reason: "Schema mismatch on UPDATE",
        error_code,
        error_message,
      };
    }
    return {
      classification: "unknown_reject",
      status: "ERROR",
      reject_reason: "Unclassified UPDATE error",
      error_code,
      error_message,
    };
  }

  return {
    classification: "zero_rows_clean",
    status: "PASS",
    reject_reason: null,
    error_code: null,
    error_message: null,
  };
}

/**
 * @param {{ data: unknown, error: { code?: string | null, message?: string | null, details?: string | null, hint?: string | null } | null }} result
 * @param {{ table: string, target_company_id: string, actor: string, actor_user_id?: string | null }} context
 */
export function classifyInsertProbeOutcome(result, context) {
  void context;
  const error = result.error;
  const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];

  const error_code = error?.code ?? null;
  const error_message = error?.message ?? null;
  const base = { error_code, error_message, inserted_ids: [], possible_residue_without_observed_id: false };

  if (rows.length > 0) {
    const ids = rows.map((r) => (r && typeof r === "object" && "id" in r ? r.id : null)).filter(Boolean);
    return {
      ...base,
      classification: "insert_accepted",
      status: "FAIL",
      reject_reason: "Cross-tenant INSERT succeeded (RLS failure)",
      inserted_ids: ids,
      possible_residue_without_observed_id: ids.length < rows.length,
    };
  }

  if (!error) {
    return {
      ...base,
      classification: "ambiguous_no_error_no_row",
      status: "ERROR",
      reject_reason: "No error and no returned row; RLS block not proven",
      possible_residue_without_observed_id: true,
    };
  }

  const code = error.code ?? "";
  const message = error.message ?? "";

  if (isRlsPolicyViolationMessage(message)) {
    return {
      ...base,
      classification: "rls_reject",
      status: "PASS",
      reject_reason: null,
    };
  }

  if (code === "PGRST301" || /\bjwt\b/i.test(message)) {
    return {
      ...base,
      classification: "auth_misconfig",
      status: "NOT_TESTED",
      reject_reason: "Auth/JWT misconfiguration; isolation INSERT probe not valid",
    };
  }

  if (isGrantDeniedMessage(message)) {
    return {
      ...base,
      classification: "grant_denied",
      status: "ERROR",
      reject_reason: "PostgreSQL GRANT/privilege denied (not RLS policy text)",
    };
  }

  if (SCHEMA_CONSTRAINT_CODES.has(code)) {
    return {
      ...base,
      classification: "schema_constraint",
      status: "ERROR",
      reject_reason: `Constraint violation (${code}); not attributable to RLS`,
    };
  }

  if (isSchemaMismatch(code, message)) {
    return {
      ...base,
      classification: "schema_mismatch",
      status: "ERROR",
      reject_reason: "Schema/cache mismatch; not attributable to RLS",
    };
  }

  if (code === "42501" && /permission denied/i.test(message)) {
    return {
      ...base,
      classification: "privilege_ambiguous_42501",
      status: "ERROR",
      reject_reason: "42501 without RLS policy wording; cannot count as RLS PASS",
    };
  }

  return {
    ...base,
    classification: "unknown_reject",
    status: "ERROR",
    reject_reason: "Rejection not classified as RLS; manual review required",
  };
}

/**
 * @param {InsertClassification} classification
 * @param {ReturnType<typeof classifyInsertProbeOutcome>} outcome
 */
function formatInsertObserved(classification, outcome) {
  if (classification === "insert_accepted") {
    const ids = outcome.inserted_ids?.length ? ` ids=${outcome.inserted_ids.join(",")}` : "";
    return `insert accepted${ids}`;
  }
  if (outcome.error_message) return `${outcome.error_code ?? "?"}: ${outcome.error_message}`;
  return outcome.reject_reason ?? classification;
}

/**
 * @param {object} params
 */
function recordInsertProbe(params) {
  const { id, table, outcome, context, rls_or_fn } = params;
  const residue_key =
    table === "company_users"
      ? { company_id: context.target_company_id, user_id: context.actor_user_id ?? null }
      : null;

  record({
    id,
    actor: context.actor,
    actor_user_id: context.actor_user_id ?? null,
    target_company_id: context.target_company_id,
    resource: `${table} INSERT company_id=B`,
    kind: "practical_write",
    expected: "rls_reject",
    classification: outcome.classification,
    status: outcome.status,
    reject_reason: outcome.reject_reason ?? undefined,
    error_code: outcome.error_code,
    error_message: outcome.error_message,
    inserted_ids: outcome.inserted_ids,
    residue_key,
    possible_residue_without_observed_id: outcome.possible_residue_without_observed_id,
    observed: formatInsertObserved(outcome.classification, outcome),
    rls_or_fn,
  });
}

async function signIn(url, anonKey, email, password) {
  const boot = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await boot.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn failed: ${error?.message}`);
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

async function headCount(client, table, filters = {}) {
  const column = resolveHeadCountSelectColumn(table);
  let q = client.from(table).select(column, { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  const sanitized = sanitizePostgrestError(error);
  return {
    count: count ?? 0,
    error_message: sanitized?.message ?? null,
    error_code: sanitized?.code ?? null,
  };
}

function resolveInsertReturnSelect(table) {
  return table === "company_users" ? "company_id,user_id" : "id";
}

async function tryMutate(client, table, op, payload, match = {}) {
  let q;
  if (op === "insert") {
    const r = await client.from(table).insert(payload).select(resolveInsertReturnSelect(table));
    return { data: r.data, error: sanitizePostgrestError(r.error) };
  }
  q = client.from(table).update(payload);
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  const r = await q.select("id");
  const sanitized = sanitizePostgrestError(r.error);
  return {
    data: r.data,
    error: sanitized,
    rows: r.data?.length ?? 0,
  };
}

const TABLES_READ = [
  "companies",
  "company_users",
  "projects",
  "client_subscriptions",
  "payments",
  "invoices",
  "documents",
  "tickets",
  "notifications",
];

async function main() {
  loadEnvFile(resolve(ROOT, ".env.client-isolation.local"));
  const isolationTarget = assertPhase5IsolationTarget({ requirePhase5Flag: true });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const password = process.env.CLIENT_ISOLATION_TEST_PASSWORD;
  if (!url || !anonKey || !password) {
    throw new Error("Missing URL, anon key, or CLIENT_ISOLATION_TEST_PASSWORD");
  }

  const ctxPath = resolve(ROOT, "docs", "audit", "phase5-seed-context.json");
  if (!existsSync(ctxPath)) {
    throw new Error("Run seed first: npm run db:seed:client-multi-tenant");
  }
  const ctx = JSON.parse(readFileSync(ctxPath, "utf8"));
  const companyA = requireContextUuid(ctx.companies?.A?.id, "companies.A.id");
  const companyB = requireContextUuid(ctx.companies?.B?.id, "companies.B.id");
  const projectB = requireContextUuid(ctx.companies?.B?.project_id, "companies.B.project_id");

  const clientA = await signIn(url, anonKey, EMAIL_A, password);
  const clientB = await signIn(url, anonKey, EMAIL_B, password);

  // —— Test A / B read own vs cross ——
  for (const table of TABLES_READ) {
    const filtA = table === "notifications" ? {} : { company_id: companyA };
    const filtB = table === "notifications" ? {} : { company_id: companyB };
    const ownA = await headCount(clientA, table, table === "companies" ? { id: companyA } : filtA);
    const ownB = await headCount(clientB, table, table === "companies" ? { id: companyB } : filtB);
    const crossAB = await headCount(clientA, table, table === "companies" ? { id: companyB } : { company_id: companyB });
    const crossBA = await headCount(clientB, table, table === "companies" ? { id: companyA } : { company_id: companyA });

    const ownAOutcome = classifyOwnReadOutcome(ownA);
    const ownBOutcome = classifyOwnReadOutcome(ownB);
    const crossABOutcome = classifyCrossReadOutcome(crossAB);
    const crossBAOutcome = classifyCrossReadOutcome(crossBA);

    record({
      id: `P5-OWN-A-${table}`,
      actor: "CLIENT_A",
      resource: `${table} own`,
      kind: "practical_read",
      expected: ">=1 row",
      count: ownA.count,
      error_code: ownA.error_code,
      error_message: ownA.error_message,
      classification: ownAOutcome.classification,
      reject_reason: ownAOutcome.reject_reason ?? undefined,
      observed: formatReadObserved(ownA),
      rls_or_fn: table === "notifications" ? "user_id=auth.uid()" : "user_company_ids()",
      status: ownAOutcome.status,
    });
    record({
      id: `P5-OWN-B-${table}`,
      actor: "CLIENT_B",
      resource: `${table} own`,
      kind: "practical_read",
      expected: ">=1 row",
      count: ownB.count,
      error_code: ownB.error_code,
      error_message: ownB.error_message,
      classification: ownBOutcome.classification,
      reject_reason: ownBOutcome.reject_reason ?? undefined,
      observed: formatReadObserved(ownB),
      rls_or_fn: table === "notifications" ? "user_id=auth.uid()" : "user_company_ids()",
      status: ownBOutcome.status,
    });
    record({
      id: `P5-CROSS-A-TO-B-${table}`,
      actor: "CLIENT_A",
      resource: `${table} company B`,
      kind: "practical_read",
      expected: "0 rows",
      count: crossAB.count,
      error_code: crossAB.error_code,
      error_message: crossAB.error_message,
      classification: crossABOutcome.classification,
      reject_reason: crossABOutcome.reject_reason ?? undefined,
      observed: formatReadObserved(crossAB),
      rls_or_fn: "company scope",
      status: crossABOutcome.status,
    });
    record({
      id: `P5-CROSS-B-TO-A-${table}`,
      actor: "CLIENT_B",
      resource: `${table} company A`,
      kind: "practical_read",
      expected: "0 rows",
      count: crossBA.count,
      error_code: crossBA.error_code,
      error_message: crossBA.error_message,
      classification: crossBAOutcome.classification,
      reject_reason: crossBAOutcome.reject_reason ?? undefined,
      observed: formatReadObserved(crossBA),
      rls_or_fn: "company scope",
      status: crossBAOutcome.status,
    });
  }

  // Test C — direct ID (companies)
  const directB = await clientA.from("companies").select("id,name").eq("id", companyB).maybeSingle();
  record({
    id: "P5-DIRECT-ID-companies-A-reads-B",
    actor: "CLIENT_A",
    resource: "companies.id=B",
    kind: "practical_read",
    expected: "null row",
    observed: directB.error ? directB.error.message : directB.data ? "row returned" : "null",
    status: !directB.data && !directB.error ? "PASS" : directB.error && !directB.data ? "PASS" : "FAIL",
    rls_or_fn: "Company read companies / user_company_ids",
  });

  // Test C — company_users list for other company
  const cuCross = await headCount(clientA, "company_users", { company_id: companyB });
  const cuCrossOutcome = classifyCrossReadOutcome(cuCross);
  record({
    id: "P5-DIRECT-ID-company_users",
    actor: "CLIENT_A",
    resource: "company_users B",
    kind: "practical_read",
    expected: "0",
    count: cuCross.count,
    error_code: cuCross.error_code,
    error_message: cuCross.error_message,
    classification: cuCrossOutcome.classification,
    reject_reason: cuCrossOutcome.reject_reason ?? undefined,
    observed: formatReadObserved(cuCross),
    status: cuCrossOutcome.status,
    rls_or_fn: "company_users policies",
  });

  const actorUserId = (await clientA.auth.getUser()).data.user?.id ?? null;
  const insertContext = {
    table: "projects",
    target_company_id: companyB,
    actor: "CLIENT_A",
    actor_user_id: actorUserId,
  };

  // Test E — write cross (local synthetic)
  const insProject = await tryMutate(clientA, "projects", "insert", {
    company_id: companyB,
    name: "ISO Hack Project",
    project_type: "website",
  });
  recordInsertProbe({
    id: "P5-WRITE-INSERT-project-other-company",
    table: "projects",
    outcome: classifyInsertProbeOutcome(insProject, { ...insertContext, table: "projects" }),
    context: insertContext,
    rls_or_fn: "WITH CHECK company_id IN user_company_ids()",
  });

  const updProject = await tryMutate(
    clientA,
    "projects",
    "update",
    { name: "ISO Hijack" },
    { id: projectB },
  );
  const updOutcome = classifyUpdateProbeOutcome(updProject);
  record({
    id: "P5-WRITE-UPDATE-project-B",
    actor: "CLIENT_A",
    resource: "projects UPDATE B",
    kind: "practical_write",
    expected: "0 rows updated (RLS) or rls_reject",
    classification: updOutcome.classification,
    status: updOutcome.status,
    reject_reason: updOutcome.reject_reason ?? undefined,
    error_code: updOutcome.error_code,
    error_message: updOutcome.error_message,
    rows_updated: updProject.rows ?? 0,
    observed:
      updOutcome.error_message != null
        ? `${updOutcome.error_code ?? "?"}: ${updOutcome.error_message}`
        : `rows=${updProject.rows ?? 0}`,
    rls_or_fn: "USING company scope",
  });

  const insTicket = await tryMutate(clientA, "tickets", "insert", {
    company_id: companyB,
    subject: "ISO Cross Ticket",
    status: "new",
    created_by: actorUserId,
  });
  recordInsertProbe({
    id: "P5-WRITE-INSERT-ticket-B",
    table: "tickets",
    outcome: classifyInsertProbeOutcome(insTicket, { ...insertContext, table: "tickets" }),
    context: insertContext,
    rls_or_fn: "Company create tickets WITH CHECK",
  });

  const insCU = await tryMutate(clientA, "company_users", "insert", {
    company_id: companyB,
    user_id: actorUserId,
    is_primary: false,
    contact_role: "owner",
  });
  recordInsertProbe({
    id: "P5-WRITE-INSERT-company_users-B",
    table: "company_users",
    outcome: classifyInsertProbeOutcome(insCU, { ...insertContext, table: "company_users" }),
    context: insertContext,
    rls_or_fn: "company_users RLS",
  });

  // Static supplement (catalogued, not practical)
  record({
    id: "P5-STATIC-RLS-notifications",
    actor: "n/a",
    resource: "notifications",
    kind: "static_analysis",
    expected: "user_id scoped",
    observed: "Users read own notifications (SELECT qual user_id=auth.uid())",
    status: "NOT_TESTED",
    rls_or_fn: "RLS_INVENTORY",
    note: "Cross-user notification read covered indirectly via P5-CROSS-* notifications",
  });

  const summary = { PASS: 0, FAIL: 0, ERROR: 0, NOT_TESTED: 0, PARTIAL: 0 };
  for (const c of cases) {
    if (summary[c.status] !== undefined) summary[c.status] += 1;
  }

  const payload = {
    project_target: isolationTarget.kind === "sandbox" ? "sandbox" : "local",
    sandbox_project_ref: isolationTarget.kind === "sandbox" ? isolationTarget.ref : null,
    protected_remote_ref: PROTECTED_AUDIT_REF,
    remote_touched: false,
    audited_at: new Date().toISOString(),
    seed_context_marker: ctx.marker ?? null,
    cases,
    summary,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("\nSummary:", summary);
  console.log("Wrote", OUT);
  const practicalProbeBad = cases.some(
    (c) =>
      (c.kind === "practical_read" || c.kind === "practical_write") &&
      (c.status === "FAIL" || c.status === "ERROR"),
  );
  process.exit(practicalProbeBad ? 1 : 0);
}

const INSERT_PROBE_BASE_CTX = {
  table: "projects",
  target_company_id: "e5e54e45-5223-49f8-97f6-c18b9c65f521",
  actor: "CLIENT_A",
  actor_user_id: "00000000-0000-4000-8000-000000000001",
};

/** Static cases S1–S14 for classifyInsertProbeOutcome (no network/DB). */
function runInsertClassifierSelfTest() {
  const cases = [
    {
      label: "S1",
      result: {
        data: [],
        error: {
          code: "42501",
          message: 'new row violates row-level security policy for table "projects"',
        },
      },
      expected: { status: "PASS", classification: "rls_reject" },
    },
    {
      label: "S2",
      result: {
        data: null,
        error: { code: "42501", message: "violates row-level security policy" },
      },
      expected: { status: "PASS", classification: "rls_reject" },
    },
    {
      label: "S3",
      result: {
        data: null,
        error: { code: "42501", message: "permission denied for table projects" },
      },
      expected: { status: "ERROR", classification: "grant_denied" },
    },
    {
      label: "S4",
      result: {
        data: null,
        error: { code: "42501", message: "permission denied for schema public" },
      },
      expected: { status: "ERROR", classification: "grant_denied" },
    },
    {
      label: "S5",
      result: {
        data: null,
        error: { code: "42501", message: "permission denied" },
      },
      expected: { status: "ERROR", classification: "privilege_ambiguous_42501" },
    },
    {
      label: "S6",
      result: {
        data: null,
        error: { code: "23503", message: "insert or update on table violates foreign key constraint" },
      },
      expected: { status: "ERROR", classification: "schema_constraint" },
    },
    {
      label: "S7",
      result: {
        data: null,
        error: { code: "23502", message: 'null value in column "name" violates not-null constraint' },
      },
      expected: { status: "ERROR", classification: "schema_constraint" },
    },
    {
      label: "S8",
      result: {
        data: null,
        error: { code: "23514", message: "new row for relation violates check constraint" },
      },
      expected: { status: "ERROR", classification: "schema_constraint" },
    },
    {
      label: "S9",
      result: { data: [{ id: "11111111-1111-4111-8111-111111111111" }], error: null },
      expected: { status: "FAIL", classification: "insert_accepted" },
    },
    {
      label: "S10",
      result: { data: [{}], error: null },
      expected: { status: "FAIL", classification: "insert_accepted" },
    },
    {
      label: "S11",
      result: { data: [], error: null },
      expected: { status: "ERROR", classification: "ambiguous_no_error_no_row" },
    },
    {
      label: "S12",
      result: { data: null, error: { code: "PGRST301", message: "JWT expired" } },
      expected: { status: "NOT_TESTED", classification: "auth_misconfig" },
    },
    {
      label: "S13",
      result: {
        data: null,
        error: { code: "PGRST204", message: "column foo does not exist on schema cache" },
      },
      expected: { status: "ERROR", classification: "schema_mismatch" },
    },
    {
      label: "S14",
      result: { data: null, error: { code: "42501", message: "forbidden" } },
      expected: { status: "ERROR", classification: "unknown_reject" },
    },
  ];

  let failed = 0;
  for (const t of cases) {
    const outcome = classifyInsertProbeOutcome(t.result, INSERT_PROBE_BASE_CTX);
    const ok =
      outcome.status === t.expected.status && outcome.classification === t.expected.classification;
    if (ok) {
      console.log(`[self-test] ${t.label} OK`);
    } else {
      failed += 1;
      console.error(
        `[self-test] ${t.label} FAIL expected ${t.expected.classification}/${t.expected.status} got ${outcome.classification}/${outcome.status}`,
      );
    }
  }
  console.log(failed === 0 ? "Insert classifier self-test: all passed" : `Insert classifier self-test: ${failed} failed`);
  return failed;
}

/** Read / UPDATE classifiers — no network/DB. */
function runReadUpdateClassifierSelfTest() {
  const tests = [
    {
      label: "R1-cross-clean",
      fn: () => classifyCrossReadOutcome({ count: 0, error_message: null, error_code: null }),
      expected: { status: "PASS", classification: "zero_rows_clean" },
    },
    {
      label: "R2-cross-empty-msg",
      fn: () => classifyCrossReadOutcome({ count: 0, error_message: "", error_code: null }),
      expected: { status: "ERROR", classification: "empty_error_message" },
    },
    {
      label: "R3-cross-grant",
      fn: () =>
        classifyCrossReadOutcome({
          count: 0,
          error_message: "permission denied for table companies",
          error_code: "42501",
        }),
      expected: { status: "ERROR", classification: "grant_denied" },
    },
    {
      label: "R4-cross-leak",
      fn: () => classifyCrossReadOutcome({ count: 2, error_message: null, error_code: null }),
      expected: { status: "FAIL", classification: "cross_rows_visible" },
    },
    {
      label: "R5-own-visible",
      fn: () => classifyOwnReadOutcome({ count: 1, error_message: null, error_code: null }),
      expected: { status: "PASS", classification: "rows_visible" },
    },
    {
      label: "R6-own-grant",
      fn: () =>
        classifyOwnReadOutcome({
          count: 0,
          error_message: "permission denied for table invoices",
          error_code: "42501",
        }),
      expected: { status: "ERROR", classification: "grant_denied" },
    },
    {
      label: "U1-update-clean",
      fn: () => classifyUpdateProbeOutcome({ rows: 0, error: null }),
      expected: { status: "PASS", classification: "zero_rows_clean" },
    },
    {
      label: "U2-update-grant",
      fn: () =>
        classifyUpdateProbeOutcome({
          rows: 0,
          error: { code: "42501", message: "permission denied for table projects" },
        }),
      expected: { status: "ERROR", classification: "grant_denied" },
    },
    {
      label: "U3-update-rls",
      fn: () =>
        classifyUpdateProbeOutcome({
          rows: 0,
          error: { code: "42501", message: "new row violates row-level security policy for table projects" },
        }),
      expected: { status: "PASS", classification: "rls_reject" },
    },
    {
      label: "U4-update-leak",
      fn: () => classifyUpdateProbeOutcome({ rows: 1, error: null }),
      expected: { status: "FAIL", classification: "update_accepted" },
    },
    {
      label: "H1-company_users-column",
      fn: () => resolveHeadCountSelectColumn("company_users"),
      expected: "company_id",
    },
  ];

  let failed = 0;
  for (const t of tests) {
    const outcome = t.fn();
    const ok =
      typeof t.expected === "string"
        ? outcome === t.expected
        : outcome.status === t.expected.status && outcome.classification === t.expected.classification;
    if (ok) console.log(`[self-test] ${t.label} OK`);
    else {
      failed += 1;
      console.error(`[self-test] ${t.label} FAIL got ${JSON.stringify(outcome)}`);
    }
  }
  console.log(
    failed === 0 ? "Read/UPDATE classifier self-test: all passed" : `Read/UPDATE classifier self-test: ${failed} failed`,
  );
  return failed;
}

function runAllDiagnosticSelfTests() {
  const a = runInsertClassifierSelfTest();
  const b = runReadUpdateClassifierSelfTest();
  process.exit(a + b > 0 ? 1 : 0);
}

if (process.env.PHASE5_INSERT_CLASSIFIER_SELFTEST === "1") {
  runAllDiagnosticSelfTests();
} else {
  main().catch((e) => {
    console.error("FAIL", e.message ?? e);
    process.exit(1);
  });
}