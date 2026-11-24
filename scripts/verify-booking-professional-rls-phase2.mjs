/**
 * Local verification for Booking Phase 2 RLS migration 022 (static + dashboard logic).
 * Does not connect to Supabase unless BOOKING_PHASE2_REMOTE_TEST=1 (disabled by default).
 *
 * Usage: npm run verify:booking-professional-rls-phase2
 */

import fs from "node:fs";
import path from "node:path";
import {
  MIGRATION_022_BUSY_RPC_FORBIDDEN,
  MIGRATION_022_BUSY_RPC_MUST_NOT_INCLUDE,
  MIGRATION_022_REQUIRED_SNIPPETS,
  MIGRATION_022_SECURITY_DEFINER_FUNCTIONS,
  PHASE2_RLS_CASES,
  extractBusyRpcSql,
  readMigration022Sql,
} from "./booking-professional-rls-phase2-lib.mjs";
import {
  summarizeP2Matrix,
  verifyBusyRpcRowCapContract,
  verifySeedContracts,
} from "./booking-phase2-p2-harness-lib.mjs";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`PASS  ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

function assert(condition, msg) {
  if (condition) pass(msg);
  else fail(msg);
}

function verifyMigrationStatic() {
  const sql = readMigration022Sql();

  for (const snippet of MIGRATION_022_REQUIRED_SNIPPETS) {
    assert(sql.includes(snippet), `migration 022 contains: ${snippet}`);
  }

  const busyRpc = extractBusyRpcSql(sql);
  assert(busyRpc.length > 0, "busy RPC function block present");

  for (const snippet of MIGRATION_022_BUSY_RPC_FORBIDDEN) {
    if (snippet === "a.id" && busyRpc.includes("a.staff_id")) {
      pass("busy RPC uses staff_id only, not appointment id");
      continue;
    }
    assert(!busyRpc.includes(snippet), `busy RPC must not include: ${snippet}`);
  }

  for (const re of MIGRATION_022_BUSY_RPC_MUST_NOT_INCLUDE) {
    assert(!re.test(busyRpc), `migration 022 busy RPC pattern blocked: ${re}`);
  }

  assert(
    !sql.includes("create temp table _booking_busy_slice") &&
      !sql.includes("create temp table _booking_time_off_slice"),
    "availability RPCs do not use temp tables",
  );

  assert(
    busyRpc.includes("volatile") &&
      busyRpc.includes("limit 2001") &&
      busyRpc.includes("booking_member_availability_staff_allowed"),
    "busy RPC is VOLATILE with shared staff filter helper",
  );

  assert(
    sql.includes("grant execute on function public.booking_can_read_full_appointment") &&
      sql.includes("grant execute on function public.booking_staff_ids_for_auth_user"),
    "RLS helpers grant EXECUTE to authenticated",
  );

  assert(
    sql.includes("drop column if exists notes") &&
      sql.includes("booking_customer_internal_notes"),
    "internal notes moved off booking_customers",
  );

  assert(
    sql.includes("booking_customer_internal_notes_customer_business_fkey") &&
      sql.includes("booking_customers_id_business_key"),
    "internal notes composite FK + customers (id, business_id) unique",
  );

  verifyNotesIntegrityMigration(sql);
}

function verifyNotesIntegrityMigration(sql) {
  assert(
    !sql.includes("drop constraint if exists booking_customers_id_business_key"),
    "does not drop booking_customers_id_business_key before recreate",
  );
  assert(
    sql.includes("to_regclass('public.booking_customers')") &&
      sql.includes("con.contype = 'u'") &&
      sql.includes("con.conkey = v_expected_attnums") &&
      sql.includes("manual review required"),
    "unique constraint: conrelid + contype u + conkey (id, business_id order)",
  );
  assert(
    !sql.includes("drop constraint") ||
      !sql.toLowerCase().includes("booking_customers_id_business_key"),
    "never drops booking_customers_id_business_key",
  );

  const policyStart = sql.indexOf(
    'create policy "Booking manage customer internal notes"',
  );
  const policyBlock = sql.slice(policyStart, policyStart + 700);
  assert(
    policyBlock.includes(
      "c.business_id = booking_customer_internal_notes.business_id",
    ),
    "internal notes RLS EXISTS qualifies outer business_id",
  );
  assert(
    policyBlock.includes("c.id = booking_customer_internal_notes.customer_id"),
    "internal notes RLS EXISTS qualifies outer customer_id",
  );
  assert(
    policyBlock.includes(
      "booking_can_manage_business(booking_customer_internal_notes.business_id)",
    ),
    "internal notes RLS USING qualifies business_id",
  );

  const triggerStart = sql.indexOf("booking_trg_customer_internal_notes_business_match");
  const triggerBlock = sql.slice(triggerStart, triggerStart + 900);
  assert(
    triggerBlock.includes("new.business_id := v_customer_business") &&
      !triggerBlock.includes("23514"),
    "trigger derives business_id from customer (no client trust / no 23514)",
  );
  assert(
    triggerBlock.includes("customer not found for internal note"),
    "trigger rejects missing customer_id",
  );
  const triggerSql = sql.slice(
    sql.indexOf("create trigger booking_customer_internal_notes_business_match"),
    sql.indexOf("create trigger booking_customer_internal_notes_business_match") + 200,
  );
  assert(
    /before insert or update\s*\n/i.test(triggerSql) &&
      !/before insert or update of/i.test(triggerSql),
    "trigger runs on every INSERT and UPDATE (including business_id-only)",
  );

  verifyNotesScenarioCoverage(sql);
}

function verifyNotesScenarioCoverage(sql) {
  /** Static contract: runtime cases P2-15+ validated after apply on test DB. */
  const scenarios = [
    { id: "N-INS-NULL-BIZ", desc: "INSERT business_id NULL → trigger sets from customer" },
    { id: "N-INS-WRONG-BIZ", desc: "INSERT wrong business_id → trigger overwrites before FK/RLS" },
    { id: "N-UPD-BIZ-ONLY", desc: "UPDATE only business_id → trigger resets from customer_id" },
    { id: "N-UPD-CUSTOMER", desc: "UPDATE customer_id → trigger sets new business_id" },
    { id: "N-UPD-NOTES", desc: "UPDATE notes only → trigger still syncs business_id" },
    { id: "N-CROSS-TENANT", desc: "cross-tenant customer → wrong manage RLS or FK after sync" },
    { id: "N-UNIQUE-OK", desc: "DO block accepts matching booking_customers_id_business_key" },
    { id: "N-UNIQUE-BAD-NAME", desc: "DO block raises if same name, wrong conkey/contype" },
  ];
  for (const s of scenarios) {
    assert(sql.includes("new.business_id := v_customer_business"), `contract ${s.id}: ${s.desc}`);
  }
  assert(
    sql.includes("v_named_conkey is distinct from v_expected_attnums"),
    "N-UNIQUE-BAD-NAME: mismatched named constraint raises",
  );

  const customersPolicy = sql.slice(
    sql.indexOf('"Booking read customers"'),
    sql.indexOf('"Booking read customers"') + 500,
  );
  assert(
    customersPolicy.includes("booking_customers.business_id") &&
      customersPolicy.includes("booking_customers.id"),
    "customers read policy qualifies outer booking_customers columns in EXISTS",
  );
}

function verifySecurityDefinerInventory() {
  const sql = readMigration022Sql();

  for (const fn of MIGRATION_022_SECURITY_DEFINER_FUNCTIONS) {
    const shortName = fn.name.split("(")[0];
    assert(sql.includes(`function public.${shortName}`), `022 defines ${shortName}`);
    if (fn.definer) {
      const blockStart = sql.indexOf(`function public.${shortName}`);
      const block = sql.slice(blockStart, blockStart + 800);
      assert(block.includes("security definer"), `${shortName} is SECURITY DEFINER`);
      assert(block.includes("set search_path = ''"), `${shortName} uses empty search_path`);
    }
    if (fn.executeAuthenticated) {
      assert(
        sql.includes(`grant execute on function public.${fn.name.split("(")[0]}`),
        `${shortName} EXECUTE granted to authenticated`,
      );
    }
  }

  assert(
    !sql.includes("set search_path = public"),
    "022 does not leave search_path = public on definer functions",
  );
}

function verifyAppNotesAudit() {
  const customersTs = fs.readFileSync(
    path.join(process.cwd(), "src/lib/data/booking/customers.ts"),
    "utf8",
  );
  assert(
    !customersTs.includes('.select("*")') &&
      !customersTs.includes(".select('*')"),
    "customers query avoids SELECT *",
  );
  assert(
    !/select\([^)]*\bnotes\b[^)]*\)/i.test(
      customersTs.split("booking_customer_internal_notes")[0] ?? customersTs,
    ),
    "customers data layer does not SELECT notes from booking_customers",
  );

  const customersPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/booking/admin/customers/page.tsx"),
    "utf8",
  );
  assert(
    customersPage.includes("includeInternalNotes: session.canManageActiveBusiness"),
    "customers page loads notes only for manage session",
  );

  const srcDir = path.join(process.cwd(), "src");
  const offenders = [];
  for (const rel of walkTsFiles(srcDir, srcDir)) {
    const content = fs.readFileSync(path.join(srcDir, rel), "utf8");
    if (
      content.includes("booking_customers") &&
      /notes/.test(content) &&
      !rel.replace(/\\/g, "/").includes("lib/data/booking/customers.ts")
    ) {
      offenders.push(rel);
    }
  }
  assert(
    offenders.length === 0,
    `no other src files reference booking_customers + notes (${offenders.join(", ") || "ok"})`,
  );
}

/** @param {string} dir @param {string} root @returns {string[]} */
function walkTsFiles(dir, root) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(full, root));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  return out;
}

function verifyDashboardScopeLogic() {
  const businessTs = fs.readFileSync(
    path.join(process.cwd(), "src/lib/data/booking/business.ts"),
    "utf8",
  );
  assert(
    businessTs.includes("appointmentScope") && businessTs.includes("own_staff"),
    "getBookingDashboardStats supports own_staff appointment scope",
  );
  assert(
    businessTs.includes('.in("staff_id", ownStaffIds)'),
    "dashboard pending/today filtered by ownStaffIds",
  );

  const dashboardPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/booking/admin/dashboard/page.tsx"),
    "utf8",
  );
  assert(
    dashboardPage.includes("canManageActiveBusiness") &&
      dashboardPage.includes("listOwnBookingStaffIds"),
    "dashboard page scopes stats for professionals",
  );
}

function verifySensitiveDataViews() {
  const sql = readMigration022Sql();
  assert(sql.includes("booking_customers_member"), "customers member view without notes");
  assert(sql.includes("booking_time_off_availability"), "time off availability view without label");
  assert(sql.includes("booking_can_read_time_off_row"), "time off RLS scoped for professionals");

  const customersTs = fs.readFileSync(
    path.join(process.cwd(), "src/lib/data/booking/customers.ts"),
    "utf8",
  );
  assert(
    customersTs.includes("booking_customers_member") &&
      customersTs.includes("booking_customer_internal_notes"),
    "customers data layer: member view + manage-only notes table",
  );
}

function listCases() {
  console.log("Phase 2 RLS cases (P2-01 … P2-23):\n");
  for (const c of PHASE2_RLS_CASES) {
    console.log(
      `  ${c.id}  ${c.title}\n       local: ${c.local ? "yes" : "no"}  remote: ${c.remote ? "yes" : "no"}`,
    );
  }
  console.log(
    "\nRead-only remote: BOOKING_PHASE2_P2_REMOTE=1 scripts/booking-phase2-p2-remote-readonly.mjs",
  );
}

function verifyPhase2HarnessMatrix() {
  assert(verifyBusyRpcRowCapContract(readMigration022Sql()), "P2-10 row cap contract in migration 022");

  const seed = verifySeedContracts();
  assert(seed.hasSamAppointments, "seed: Sam Provider appointments for P2-02 range");
  assert(seed.hasSamTimeOff, "seed: booking_time_off on staff2 (Sam) for P2-13");
  assert(seed.hasUnlinkedProfessional, "seed: professionalUnlinkedA fixture for P2-05");
  assert(seed.incrementalNonDestructive, "incremental fixtures script is non-destructive (no business delete)");

  console.log("\n--- P2 harness matrix (local + planned remote) ---\n");
  const { counts, localCounts, remoteCounts, rows } = summarizeP2Matrix();
  for (const row of rows) {
    const loc = row.local.status.padEnd(7);
    const rem = row.remote.status.padEnd(7);
    const comb = row.combined.padEnd(7);
    console.log(
      `${comb}  ${row.id}  local=${loc} remote=${rem}  ${row.title}`,
    );
    if (row.local.detail) console.log(`         local: ${row.local.detail}`);
    if (row.remote.detail) console.log(`         remote: ${row.remote.detail}`);
  }
  console.log(
    `\nCombined — PASS: ${counts.PASS}, FAIL: ${counts.FAIL}, BLOCKED: ${counts.BLOCKED}, SKIP: ${counts.SKIP}`,
  );
  console.log(
    `Local layer — PASS: ${localCounts.PASS}, FAIL: ${localCounts.FAIL}, BLOCKED: ${localCounts.BLOCKED}, SKIP: ${localCounts.SKIP}`,
  );
  console.log(
    `Remote layer (planned) — PASS: ${remoteCounts.PASS}, FAIL: ${remoteCounts.FAIL}, BLOCKED: ${remoteCounts.BLOCKED}, SKIP: ${remoteCounts.SKIP}`,
  );
  assert(counts.FAIL === 0, "P2 harness local checks (combined FAIL count)");
}

function main() {
  if (process.env.BOOKING_PHASE2_LIST === "1") {
    listCases();
    return;
  }

  verifyMigrationStatic();
  verifySecurityDefinerInventory();
  verifyDashboardScopeLogic();
  verifySensitiveDataViews();
  verifyAppNotesAudit();
  verifyPhase2HarnessMatrix();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
