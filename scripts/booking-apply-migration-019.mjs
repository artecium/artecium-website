/**
 * Apply migration 019 SQL to allowlisted test DB only (requires DB password).
 *
 * BOOKING_APPLY_MIGRATION_019=1 node --env-file=.env.booking.test.local scripts/booking-apply-migration-019.mjs
 *
 * Requires: scripts/booking-pre-apply-guards.mjs checks + SUPABASE_DB_PASSWORD or DATABASE_URL
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";
import { assertBookingExplicitSandboxEnv } from "./booking-test-guards.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSql(dbUrl, sql) {
  const source = `
import pg from "pg";
const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();
await client.query(${JSON.stringify(sql)});
await client.end();
console.log("OK");
`;
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "artecium-m019-"));
  const scriptPath = join(dir, "run.mjs");
  await writeFile(scriptPath, source);
  try {
    await new Promise((resolve, reject) => {
      const child = spawn("npx", ["--yes", "-p", "pg", "node", scriptPath], {
        shell: true,
        stdio: "inherit",
      });
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function migration019AlreadyApplied(dbUrl) {
  const source = `
import pg from "pg";
const client = new pg.Client({ connectionString: ${JSON.stringify(dbUrl)} });
await client.connect();
const r = await client.query(
  "select 1 from information_schema.role_table_grants where grantee = 'service_role' and table_name = 'booking_businesses' and privilege_type = 'DELETE' limit 1"
);
await client.end();
console.log(r.rowCount > 0 ? "applied" : "pending");
`;
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "artecium-m019-check-"));
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
    return stdout.trim().endsWith("applied");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  if (process.env.BOOKING_APPLY_MIGRATION_019 !== "1") {
    console.log("Skip: set BOOKING_APPLY_MIGRATION_019=1");
    process.exit(0);
  }

  assertBookingExplicitSandboxEnv();

  const dbUrl = resolveReadonlyDatabaseUrl();
  if (!dbUrl) {
    console.error(
      "FAIL  Set SUPABASE_DB_PASSWORD or DATABASE_URL to apply migration (Dashboard → Database → connection string).",
    );
    process.exit(1);
  }

  if (await migration019AlreadyApplied(dbUrl)) {
    console.log("SKIP  Migration 019 grants already present on booking_businesses for service_role.");
    process.exit(0);
  }

  const sql = readFileSync(
    resolve(__dirname, "../supabase/migrations/019_booking_service_role_grants.sql"),
    "utf8",
  );

  console.log("Applying 019_booking_service_role_grants.sql to test database...");
  await runSql(dbUrl, sql);
  console.log("PASS  Migration 019 applied.");
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
