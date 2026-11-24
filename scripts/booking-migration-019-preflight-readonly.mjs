/**
 * Read-only preflight for migration 019 (no DDL/DML, no secrets printed).
 *
 * BOOKING_M019_PREFLIGHT=1 node --env-file=.env.booking.test.local scripts/booking-migration-019-preflight-readonly.mjs
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { BOOKING_ALLOWLISTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  BOOKING_REMOTE_TESTS_ENV,
  extractSupabaseProjectRef,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_REF = "bwxhdoxesqtdqwkxrmom";

const REPO_MIGRATIONS = [
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
  "018",
  "019",
];

function maskPresent(label, value) {
  const ok = Boolean(value?.trim());
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${ok ? "set" : "missing"}`);
  return ok;
}

async function queryMigration019Grant(dbUrl) {
  const source = `
import pg from "pg";
const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();
const grant = await client.query(
  "select 1 from information_schema.role_table_grants where grantee = 'service_role' and table_schema = 'public' and table_name = 'booking_businesses' and privilege_type = 'DELETE' limit 1"
);
const customers = await client.query(
  "select string_agg(privilege_type, ',' order by privilege_type) as privs from information_schema.role_table_grants where grantee = 'service_role' and table_schema = 'public' and table_name = 'booking_customers' group by grantee"
);
const hashExec = await client.query(
  "select 1 from information_schema.routine_privileges where grantee = 'service_role' and routine_schema = 'public' and routine_name = 'booking_public_idempotency_request_hash' limit 1"
);
let rows = [];
try {
  const r = await client.query("select version, name from supabase_migrations.schema_migrations order by version");
  rows = r.rows;
} catch (e) {
  rows = { error: e.message };
}
await client.end();
console.log(JSON.stringify({
  m019Applied: grant.rowCount > 0,
  customersPrivs: customers.rows[0]?.privs ?? null,
  serviceRoleHashExec: hashExec.rowCount > 0,
  schemaMigrations: rows,
}));
`;
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "artecium-m019-ro-"));
  const scriptPath = join(dir, "run.mjs");
  await writeFile(scriptPath, source);
  try {
    const stdout = await new Promise((resolve, reject) => {
      let buf = "";
      const child = spawn("npx", ["--yes", "-p", "pg", "node", scriptPath], { shell: true });
      child.stdout?.on("data", (d) => {
        buf += d.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve(buf) : reject(new Error(`exit ${code}`))));
    });
    const line = stdout.trim().split("\n").filter(Boolean).pop();
    return JSON.parse(line ?? "{}");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function migrationRowStatus(version, schemaRows, m019Applied) {
  if (version === "019") {
    return m019Applied ? "applied (grants)" : "pending";
  }
  if (!Array.isArray(schemaRows)) return "unknown (no schema_migrations)";
  const hit = schemaRows.some((r) => String(r.version).startsWith(version));
  return hit ? "applied (schema_migrations)" : "not listed";
}

async function main() {
  if (process.env.BOOKING_M019_PREFLIGHT !== "1") {
    console.log("Skip: set BOOKING_M019_PREFLIGHT=1");
    process.exit(0);
  }

  console.log("=== Migration 019 preflight (read-only) ===\n");

  const env = getSupabaseEnv();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const publicUrl = env.url?.trim();

  if (publicUrl) {
    const ref = extractSupabaseProjectRef(publicUrl);
    const match = ref === EXPECTED_REF;
    console.log(`${match ? "PASS" : "FAIL"}  NEXT_PUBLIC_SUPABASE_URL ref: ${ref ?? "(invalid)"}`);
  } else {
    console.log("FAIL  NEXT_PUBLIC_SUPABASE_URL missing");
  }

  if (supabaseUrl) {
    const ref = extractSupabaseProjectRef(supabaseUrl);
    const match = ref === EXPECTED_REF;
    console.log(`${match ? "PASS" : "FAIL"}  SUPABASE_URL ref: ${ref ?? "(invalid)"}`);
  } else {
    console.log("INFO  SUPABASE_URL not set (using NEXT_PUBLIC_SUPABASE_URL in scripts)");
  }

  try {
    const target = assertBookingDatabaseTarget(publicUrl || supabaseUrl);
    console.log(`PASS  Allowlisted test target: ${target.projectRef}`);
    console.log(
      `${BOOKING_ALLOWLISTED_PROJECT_REFS.includes(target.projectRef ?? "") ? "PASS" : "FAIL"}  Project on allowlist`,
    );
  } catch (e) {
    console.log(`FAIL  Target guard: ${e.message}`);
    process.exit(1);
  }

  console.log(
    `${process.env[BOOKING_REMOTE_TESTS_ENV] === "1" ? "PASS" : "FAIL"}  ${BOOKING_REMOTE_TESTS_ENV}=1`,
  );

  maskPresent("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", env.anonKey);
  maskPresent("SUPABASE_SERVICE_ROLE_KEY", env.serviceKey);
  maskPresent("SUPABASE_DB_PASSWORD or DATABASE_URL", resolveReadonlyDatabaseUrl());

  const applyScript = readFileSync(
    resolve(__dirname, "booking-apply-migration-019.mjs"),
    "utf8",
  );
  const applyGuarded =
    applyScript.includes("assertBookingDatabaseTarget") &&
    applyScript.includes("BOOKING_APPLY_MIGRATION_019") &&
    !applyScript.includes("production");
  console.log(`${applyGuarded ? "PASS" : "FAIL"}  Apply script gated (allowlist + BOOKING_APPLY_MIGRATION_019)`);

  const sql019 = readFileSync(
    resolve(__dirname, "../supabase/migrations/019_booking_service_role_grants.sql"),
    "utf8",
  );
  const hardenedOk =
    !/idempotency_request_hash[\s\S]*service_role/i.test(sql019) &&
    /grant select on table public\.booking_customers to service_role/i.test(sql019) &&
    !/grant select, insert, update, delete on table public\.booking_customers to service_role/i.test(
      sql019,
    );
  console.log(`${hardenedOk ? "PASS" : "FAIL"}  Repo 019 matches hardened least-privilege contract`);

  const dbUrl = resolveReadonlyDatabaseUrl();
  /** @type {{ m019Applied?: boolean; schemaMigrations?: unknown; customersPrivs?: string | null; serviceRoleHashExec?: boolean }} */
  let pg = {};
  if (dbUrl) {
    try {
      pg = await queryMigration019Grant(dbUrl);
      console.log(`PASS  Postgres read-only catalog probe succeeded`);
    } catch (e) {
      console.log(`FAIL  Postgres read-only probe: ${e.message}`);
    }
  } else {
    console.log("WARN  No DB URL — schema_migrations and 019 grant state unknown via SQL");
  }

  const schemaRows = Array.isArray(pg.schemaMigrations) ? pg.schemaMigrations : null;
  const m019Applied = Boolean(pg.m019Applied);

  console.log("\n--- Migration status ---");
  console.log("version\tstatus");
  for (const v of REPO_MIGRATIONS) {
    console.log(`${v}\t${migrationRowStatus(v, schemaRows, m019Applied)}`);
  }

  if (pg.customersPrivs != null) {
    console.log(`\nINFO  booking_customers service_role privs: ${pg.customersPrivs}`);
  }
  console.log(
    `INFO  service_role EXECUTE on hash RPC: ${pg.serviceRoleHashExec ? "yes" : "no"} (hardened 019: should be no)`,
  );

  const through18Ok =
    schemaRows != null &&
    REPO_MIGRATIONS.slice(0, 18).every((v) =>
      schemaRows.some((r) => String(r.version).startsWith(v)),
    );

  const ready =
    hardenedOk &&
    applyGuarded &&
    process.env[BOOKING_REMOTE_TESTS_ENV] === "1" &&
    extractSupabaseProjectRef(publicUrl) === EXPECTED_REF &&
    !m019Applied &&
    (schemaRows == null ? null : through18Ok);

  console.log("\n--- Readiness ---");
  if (ready === true) {
    console.log("READY  Safe to apply hardened 019 to test project (credentials + 001–018 on schema_migrations).");
  } else if (m019Applied) {
    console.log("SKIP  Migration 019 grants already present — apply not needed.");
  } else if (schemaRows == null) {
    console.log("BLOCKED  Set SUPABASE_DB_PASSWORD (read-only) to confirm 001–018 before apply.");
  } else if (!through18Ok) {
    console.log("BLOCKED  schema_migrations missing one or more versions 001–018.");
  } else {
    console.log("BLOCKED  Fix failed checks above before apply.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
