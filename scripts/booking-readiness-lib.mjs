/**
 * Shared read-only probes and reporting for Booking readiness scripts.
 * REST probes use .select().limit(0) only — no writes.
 */

/** @typedef {'ok' | 'missing' | 'error' | 'unknown'} ReadinessStatus */

/** @typedef {{ migration: string; name: string; method: string; status: ReadinessStatus; detail?: string }} ReadinessCheck */

export const PLATFORM_TABLE_CHECKS = [
  { migration: "001", name: "profiles", table: "profiles" },
  { migration: "001", name: "companies", table: "companies" },
  { migration: "001", name: "projects", table: "projects" },
  { migration: "001", name: "invoices", table: "invoices" },
  { migration: "001", name: "payments", table: "payments" },
  { migration: "002", name: "services", table: "services" },
  { migration: "002", name: "service_plans", table: "service_plans" },
  { migration: "002", name: "client_subscriptions", table: "client_subscriptions" },
  {
    migration: "003",
    name: "staff_company_assignments",
    table: "staff_company_assignments",
    columns: "user_id,company_id",
  },
];

export const BOOKING_TABLE_CHECKS = [
  { migration: "012", name: "booking_businesses", table: "booking_businesses" },
  { migration: "012", name: "booking_appointments", table: "booking_appointments" },
  { migration: "013", name: "booking_member_invites", table: "booking_member_invites" },
  { migration: "013", name: "appointments.blocked_starts_at", table: "booking_appointments", columns: "blocked_starts_at" },
  { migration: "015", name: "appointments.idempotency_request_hash", table: "booking_appointments", columns: "idempotency_request_hash" },
  {
    migration: "022",
    name: "booking_customers_member",
    table: "booking_customers_member",
    /** View is SELECT-granted to authenticated only (022); service_role denial is expected. */
    serviceRoleExpectPermissionDenied: true,
  },
  {
    migration: "022",
    name: "booking_customer_internal_notes",
    table: "booking_customer_internal_notes",
    columns: "customer_id",
  },
];

/** @typedef {'anon' | 'service_role'} BookingReadinessRpcRole */

export const BOOKING_RPC_CHECKS = [
  {
    migration: "012",
    fn: "booking_public_get_business",
    clientRole: "anon",
    expectValidationFailure: true,
    args: { p_slug: "__readiness__" },
  },
  {
    migration: "014",
    fn: "booking_accept_member_invite",
    clientRole: "anon",
    expectValidationFailure: true,
    args: { p_token: "__readiness__" },
  },
  {
    migration: "015",
    fn: "booking_validate_public_slot",
    clientRole: "anon",
    expectValidationFailure: true,
    args: {
      p_business_id: "00000000-0000-0000-0000-000000000001",
      p_service_id: "00000000-0000-0000-0000-000000000002",
      p_staff_id: "00000000-0000-0000-0000-000000000003",
      p_starts_at: "2026-01-01T09:00:00+00:00",
    },
  },
  {
    migration: "017",
    name: "rpc:booking_public_idempotency_request_hash",
    fn: "booking_public_idempotency_request_hash",
    clientRole: "anon",
    expectSuccess: true,
    args: {
      p_service_id: "00000000-0000-0000-0000-000000000001",
      p_staff_id: "00000000-0000-0000-0000-000000000002",
      p_starts_at: "2026-01-01T09:00:00+00:00",
    },
  },
  {
    migration: "024",
    name: "rpc:booking_public_manage_token_hash",
    fn: "booking_public_manage_token_hash",
    clientRole: "anon",
    expectSuccess: true,
    args: { p_token: "readiness-test-token" },
  },
  {
    migration: "024",
    name: "rpc:booking_public_get_guest_appointment",
    fn: "booking_public_get_guest_appointment",
    clientRole: "anon",
    expectValidationFailure: true,
    args: { p_public_reference: "bk_invalid", p_manage_token: "invalid" },
  },
  {
    migration: "016",
    name: "rpc:booking_public_list_services",
    fn: "booking_public_list_services",
    clientRole: "anon",
    expectValidationFailure: true,
    args: { p_slug: "__readiness__" },
  },
  {
    migration: "016",
    name: "rpc:booking_public_list_day_slots",
    fn: "booking_public_list_day_slots",
    clientRole: "anon",
    expectValidationFailure: true,
    args: {
      p_business_slug: "__readiness__",
      p_service_id: "00000000-0000-0000-0000-000000000001",
      p_staff_id: null,
      p_local_date: "2099-01-01",
    },
  },
];

/** Optional PostgreSQL catalog probes (require DATABASE_URL or SUPABASE_DB_PASSWORD). */
export const PG_CATALOG_CHECKS = [
  { migration: "012", name: "extension:btree_gist", kind: "extension", id: "btree_gist" },
  { migration: "013", name: "extension:pgcrypto", kind: "extension", id: "pgcrypto" },
  { migration: "003", name: "function:is_owner_or_admin", kind: "function", id: "is_owner_or_admin" },
  { migration: "004", name: "function:set_updated_at", kind: "function", id: "set_updated_at" },
  { migration: "001", name: "supabase_migrations.schema_migrations", kind: "migrations_table" },
];

/** @param {unknown} error */
export function isMissingColumn(error) {
  if (!error || typeof error !== "object") return false;
  const code = /** @type {{ code?: string; message?: string }} */ (error).code ?? "";
  const msg = (/** @type {{ message?: string }} */ (error).message ?? "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "42703" ||
    (msg.includes("column") && msg.includes("does not exist")) ||
    (msg.includes("could not find") && msg.includes("column"))
  );
}

/** @param {unknown} error */
export function isMissingRelation(error) {
  if (!error || typeof error !== "object") return false;
  if (isMissingColumn(error)) return false;
  const code = /** @type {{ code?: string; message?: string }} */ (error).code ?? "";
  const msg = (/** @type {{ message?: string }} */ (error).message ?? "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    msg.includes("schema cache")
  );
}

/** @param {unknown} error */
export function isMissingRpc(error) {
  if (!error || typeof error !== "object") return false;
  const msg = (/** @type {{ message?: string }} */ (error).message ?? "").toLowerCase();
  return (
    msg.includes("could not find the function") ||
    (msg.includes("function") && msg.includes("not found")) ||
    msg.includes("without parameters in the schema cache")
  );
}

/** @param {unknown} error */
export function isPermissionDenied(error) {
  if (!error || typeof error !== "object") return false;
  const code = /** @type {{ code?: string; message?: string }} */ (error).code ?? "";
  const msg = (/** @type {{ message?: string }} */ (error).message ?? "").toLowerCase();
  return code === "42501" || msg.includes("permission denied");
}

/** PostgREST: wrong arity/overload (distinct from missing function entirely). @param {unknown} error */
export function isInvalidRpcArguments(error) {
  if (!error || typeof error !== "object") return false;
  if (isMissingRpc(error)) return true;
  const msg = (/** @type {{ message?: string }} */ (error).message ?? "").toLowerCase();
  return msg.includes("invalid input") || msg.includes("could not choose the best candidate function");
}

/**
 * @typedef {'ok' | 'ok_validation' | 'missing' | 'permission_denied' | 'invalid_arguments' | 'error'} RpcProbeOutcome
 */

/**
 * @param {unknown} error
 * @param {{ expectSuccess?: boolean; expectValidationFailure?: boolean }} opts
 * @returns {{ status: ReadinessStatus; outcome: RpcProbeOutcome; detail?: string }}
 */
export function classifyRpcProbeResult(error, opts = {}) {
  if (!error) {
    return { status: "ok", outcome: "ok" };
  }

  if (isMissingRpc(error)) {
    return { status: "missing", outcome: "missing", detail: error.message };
  }
  if (isInvalidRpcArguments(error)) {
    return { status: "error", outcome: "invalid_arguments", detail: error.message };
  }
  if (isPermissionDenied(error)) {
    return { status: "error", outcome: "permission_denied", detail: error.message };
  }

  if (opts.expectSuccess) {
    return { status: "error", outcome: "error", detail: `${error.code ?? "?"}: ${error.message}` };
  }

  if (opts.expectValidationFailure) {
    return {
      status: "ok",
      outcome: "ok_validation",
      detail: `validation/business rejection: ${error.message}`,
    };
  }

  return {
    status: "ok",
    outcome: "ok_validation",
    detail: `callable (non-permission error): ${error.message}`,
  };
}

/** @param {ReadinessCheck[]} checks */
export function summarizeByMigration(checks) {
  /** @type {Record<string, { ok: number; missing: number; error: number; unknown: number }>} */
  const summary = {};
  for (const c of checks) {
    summary[c.migration] ??= { ok: 0, missing: 0, error: 0, unknown: 0 };
    summary[c.migration][c.status] += 1;
  }
  return summary;
}

/** @param {ReadinessCheck[]} checks */
export function splitByVerifiability(checks) {
  const confirmedPresent = checks.filter((c) => c.status === "ok");
  const confirmedAbsent = checks.filter((c) => c.status === "missing");
  const notVerifiable = checks.filter((c) => c.status === "unknown");
  const errors = checks.filter((c) => c.status === "error");
  return { confirmedPresent, confirmedAbsent, notVerifiable, errors };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} table
 * @param {string} [columns]
 * @param {{ expectPermissionDenied?: boolean }} [opts]
 * @returns {Promise<Pick<ReadinessCheck, 'status' | 'detail' | 'outcome'>>}
 */
export async function probeTableRest(admin, table, columns = "id", opts = {}) {
  const { error } = await admin.from(table).select(columns).limit(0);
  if (!error) return { status: "ok", outcome: "ok" };
  if (isMissingRelation(error)) {
    return { status: "missing", outcome: "missing", detail: error.message };
  }
  if (isMissingColumn(error)) {
    return {
      status: "error",
      outcome: "error",
      detail: `${error.message} (column probe failed — table may still exist)`,
    };
  }
  if (isPermissionDenied(error)) {
    if (opts.expectPermissionDenied) {
      return {
        status: "ok",
        outcome: "ok",
        detail: `${error.message} (expected: member/authenticated-only surface)`,
      };
    }
    return { status: "error", outcome: "permission_denied", detail: error.message };
  }
  return { status: "error", outcome: "error", detail: error.message };
}

/** Summarise Booking 012–016 REST baseline (missing vs ok vs unknown). @param {ReadinessCheck[]} checks */
export function summarizeBookingBaseline(checks) {
  const names = new Set([
    ...BOOKING_TABLE_CHECKS.map((c) => c.name),
    ...BOOKING_RPC_CHECKS.map((c) => c.name ?? `rpc:${c.fn}`),
  ]);
  const relevant = checks.filter((c) => names.has(c.name));
  return {
    confirmedAbsent: relevant.filter((c) => c.status === "missing").map((c) => c.name),
    confirmedPresent: relevant.filter((c) => c.status === "ok").map((c) => c.name),
    notVerifiable: relevant.filter((c) => c.status === "unknown").map((c) => c.name),
    probeErrors: relevant.filter((c) => c.status === "error").map((c) => ({ name: c.name, detail: c.detail })),
    coreBookingAbsent:
      relevant.find((c) => c.name === "booking_businesses")?.status === "missing" &&
      relevant.filter((c) => c.migration === "012" && c.status === "ok").length === 0,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} fn
 * @param {Record<string, unknown>} args
 * @returns {Promise<Pick<ReadinessCheck, 'status' | 'detail'>>}
 */
export async function probeRpcRest(client, fn, args, opts = {}) {
  const { data, error } = await client.rpc(fn, args);
  if (!error) {
    if (opts.expectSuccess && (data == null || (Array.isArray(data) && data.length === 0))) {
      return { status: "error", outcome: "error", detail: "RPC returned no data" };
    }
    return { status: "ok", outcome: "ok" };
  }
  const classified = classifyRpcProbeResult(error, {
    expectSuccess: opts.expectSuccess,
    expectValidationFailure: opts.expectValidationFailure,
  });
  return {
    status: classified.status,
    outcome: classified.outcome,
    detail: classified.detail,
  };
}

/**
 * Same resolution pattern as scripts/seed-demo-data.mjs (optional SUPABASE_DB_PASSWORD).
 * @returns {string | null}
 */
export function resolveReadonlyDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!password || !url) return null;

  const match = url.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/i);
  if (!match) return null;

  const projectRef = match[1];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

/**
 * Read-only PostgreSQL catalog probes. No DDL/DML.
 * @returns {Promise<ReadinessCheck[]>}
 */
export async function runPgCatalogProbes(dbUrl) {
  const source = `
import pg from "pg";

const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();

const out = [];

async function ext(name) {
  const r = await client.query(
    "select 1 from pg_extension where extname = $1 limit 1",
    [name],
  );
  return r.rowCount > 0 ? "ok" : "missing";
}

async function fn(name) {
  const r = await client.query(
    \`select 1 from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = $1 limit 1\`,
    [name],
  );
  return r.rowCount > 0 ? "ok" : "missing";
}

async function migrationsTable() {
  const r = await client.query(
    \`select 1 from information_schema.tables
     where table_schema = 'supabase_migrations' and table_name = 'schema_migrations' limit 1\`,
  );
  return r.rowCount > 0 ? "ok" : "missing";
}

async function migrationRows() {
  try {
    const r = await client.query(
      "select version, name from supabase_migrations.schema_migrations order by version",
    );
    return { status: "ok", rows: r.rows };
  } catch (e) {
    return { status: "error", detail: e.message };
  }
}

out.push({ key: "extension:btree_gist", status: await ext("btree_gist") });
out.push({ key: "extension:pgcrypto", status: await ext("pgcrypto") });
out.push({ key: "function:is_owner_or_admin", status: await fn("is_owner_or_admin") });
out.push({ key: "function:set_updated_at", status: await fn("set_updated_at") });
out.push({ key: "migrations_table", status: await migrationsTable() });
out.push({ key: "migration_rows", ...(await migrationRows()) });

await client.end();
console.log(JSON.stringify(out));
`;

  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { spawn } = await import("node:child_process");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = await mkdtemp(join(tmpdir(), "artecium-readiness-"));
  const scriptPath = join(dir, "run.mjs");
  await writeFile(scriptPath, source);

  /** @type {ReadinessCheck[]} */
  const mapped = [];

  try {
    const stdout = await new Promise((resolve, reject) => {
      const child = spawn("npx", ["--yes", "-p", "pg", "node", scriptPath], {
        shell: true,
        env: process.env,
      });
      let buf = "";
      child.stdout?.on("data", (d) => {
        buf += d.toString();
      });
      child.stderr?.on("data", (d) => {
        buf += d.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) reject(new Error(`Postgres read-only probe failed (exit ${code})`));
        else resolve(buf);
      });
    });

    const line = stdout.trim().split("\n").filter(Boolean).pop();
    const parsed = JSON.parse(line ?? "[]");

    for (const def of PG_CATALOG_CHECKS) {
      if (def.kind === "migrations_table") {
        const row = parsed.find((p) => p.key === "migrations_table");
        mapped.push({
          migration: def.migration,
          name: def.name,
          method: "postgres-select",
          status: row?.status === "ok" ? "ok" : row?.status === "missing" ? "missing" : "error",
          detail: row?.status,
        });
        continue;
      }
      const row = parsed.find((p) => p.key === def.name);
      mapped.push({
        migration: def.migration,
        name: def.name,
        method: "postgres-select",
        status: /** @type {ReadinessStatus} */ (row?.status ?? "error"),
        detail: row?.detail,
      });
    }

    const migRows = parsed.find((p) => p.key === "migration_rows");
    if (migRows?.rows) {
      mapped.push({
        migration: "history",
        name: "schema_migrations.row_count",
        method: "postgres-select",
        status: "ok",
        detail: String(migRows.rows.length),
      });
      for (const row of migRows.rows) {
        mapped.push({
          migration: "history",
          name: `applied:${row.version ?? row.name}`,
          method: "postgres-select",
          status: "ok",
          detail: row.name ?? row.version,
        });
      }
    } else if (migRows?.status === "error") {
      mapped.push({
        migration: "history",
        name: "schema_migrations.rows",
        method: "postgres-select",
        status: "error",
        detail: migRows.detail,
      });
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  return mapped;
}

/** Mark PG catalog checks unknown when no DB URL. @returns {ReadinessCheck[]} */
export function pgCatalogChecksUnknown() {
  return PG_CATALOG_CHECKS.map((def) => ({
    migration: def.migration,
    name: def.name,
    method: "postgres-select",
    status: "unknown",
    detail: "Set DATABASE_URL, SUPABASE_DB_URL, or SUPABASE_DB_PASSWORD for read-only catalog checks",
  }));
}
