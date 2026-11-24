/**
 * Static contract: migration 019 least-privilege service_role grants.
 * Usage: npm run verify:booking-service-role-grants
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(__dirname, "../supabase/migrations/019_booking_service_role_grants.sql");
const sql = readFileSync(migrationPath, "utf8");

const FULL_DML_TABLES = [
  "booking_businesses",
  "booking_business_members",
  "booking_business_subscriptions",
  "booking_services",
  "booking_staff",
  "booking_staff_services",
  "booking_working_hours",
  "booking_staff_breaks",
  "booking_time_off",
  "booking_appointments",
];

const SELECT_ONLY_TABLES = ["booking_customers", "booking_member_invites"];

/** @type {{ name: string; pass: boolean }[]} */
const results = [];

function check(name, condition) {
  results.push({ name, pass: Boolean(condition) });
}

function main() {
  check("migration file exists", sql.length > 0);
  check("no revoke on anon", !/revoke\s+all\s+on\s+table\s+public\.booking_/i.test(sql));
  check("no alter policy", !/drop policy|create policy/i.test(sql));
  check("no disable row level", !/disable row level security/i.test(sql));
  check("no service_role execute on hash", !/idempotency_request_hash[\s\S]*service_role/i.test(sql));

  for (const table of FULL_DML_TABLES) {
    const pattern = new RegExp(
      `grant select, insert, update, delete on table public\\.${table} to service_role`,
      "i",
    );
    check(`full DML service_role on ${table}`, pattern.test(sql));
  }

  for (const table of SELECT_ONLY_TABLES) {
    const full = new RegExp(
      `grant select, insert, update, delete on table public\\.${table} to service_role`,
      "i",
    );
    const sel = new RegExp(`grant select on table public\\.${table} to service_role`, "i");
    check(`SELECT-only service_role on ${table}`, sel.test(sql) && !full.test(sql));
  }

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
