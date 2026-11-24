/**
 * Shared embedded-PostgreSQL harness for local v2.6 tests (never remote).
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { buildFixturePairsFromCustomerIds } from "./booking-phase2-harness-fixture-pairs.mjs";
import { GOLDEN_FIXTURE_PAIRS } from "./booking-phase2-harness-digest-golden.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const HASH_023 = "f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36";
export const BIZ_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const BIZ_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const IDS = {
  p15: "11111111-1111-4111-8111-111111111101",
  p16: "11111111-1111-4111-8111-111111111102",
  p17: "11111111-1111-4111-8111-111111111103",
  p19: "11111111-1111-4111-8111-111111111104",
  p21: "11111111-1111-4111-8111-111111111105",
  p22: "11111111-1111-4111-8111-111111111106",
};

const FIXTURE_ROWS = [
  ["p15", IDS.p15, BIZ_A, "phase2-notes-fixture-a@artecium.test"],
  ["p16", IDS.p16, BIZ_A, "phase2-notes-fixture-p16-a@artecium.test"],
  ["p17", IDS.p17, BIZ_A, "phase2-notes-fixture-p17-a@artecium.test"],
  ["p19", IDS.p19, BIZ_B, "phase2-notes-fixture-b@artecium.test"],
  ["p21", IDS.p21, BIZ_A, "phase2-notes-fixture-p21-a@artecium.test"],
  ["p22", IDS.p22, BIZ_A, "phase2-notes-fixture-p22-a@artecium.test"],
];

export function readMigration023Utf8() {
  return readFileSync(join(__dirname, "../supabase/migrations/023_phase2_harness_persistent_tracking.sql"), "utf8").replace(
    /⊃/g,
    "superset of",
  );
}

export async function startEmbeddedHarness() {
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const dataDir = await mkdtemp(join(tmpdir(), "artecium-harness-pg-"));
  const port = 54500 + Math.floor(Math.random() * 100);
  const ep = new EmbeddedPostgres({
    databaseDir: dataDir,
    port,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });
  await ep.initialise();
  await ep.start();
  const conn = `postgresql://postgres:password@127.0.0.1:${port}/postgres`;
  return {
    ep,
    dataDir,
    conn,
    async stop() {
      await ep.stop();
      if (process.platform === "win32") {
        console.warn(`[harness-pg] Windows: temp cluster under ${dataDir} (OS/tmp cleanup)`);
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
      await rm(dataDir, { recursive: true, force: true });
    },
  };
}

export async function loadHarnessSchema(client) {
  const hash = createHash("sha256")
    .update(readFileSync(join(__dirname, "../supabase/migrations/023_phase2_harness_persistent_tracking.sql")))
    .digest("hex");
  if (hash !== HASH_023) throw new Error(`023 hash mismatch ${hash}`);
  await client.query("set client_encoding to 'UTF8'");
  await client.query(readFileSync(join(__dirname, "booking-phase2-harness-pg-minimal-prereq.sql"), "utf8"));
  await client.query(readMigration023Utf8());
  await client.query(readFileSync(join(__dirname, "booking-phase2-harness-pg-test-local.sql"), "utf8"));
}

export async function seedBusinesses(client) {
  await client.query(
    `insert into booking_businesses (id, slug, name) values ($1,'biz-a','A'),($2,'biz-b','B') on conflict do nothing`,
    [BIZ_A, BIZ_B],
  );
}

/** @param {pg.Client} client @param {string[]} excludeKeys e.g. ['p22'] */
export async function seedFixtureCustomers(client, excludeKeys = []) {
  const skip = new Set(excludeKeys);
  for (const [key, id, biz, email] of FIXTURE_ROWS) {
    if (skip.has(key)) continue;
    await client.query(
      `insert into booking_customers (id, business_id, full_name, email, created_at)
       values ($1,$2,'fixture',$3, now()) on conflict (id) do nothing`,
      [id, biz, email],
    );
  }
}

export async function seedAllFixtureCustomers(client) {
  return seedFixtureCustomers(client, []);
}

export function fixturePairsJson() {
  return JSON.stringify(buildFixturePairsFromCustomerIds(IDS, { businessAId: BIZ_A, businessBId: BIZ_B }));
}

/** @param {pg.Client} client */
export async function armGuard(client) {
  await client.query(
    `update phase2_harness.deployment_guard set cleanup_armed = true, armed_at = now(), armed_by = 'local-test' where id = 1`,
  );
}

/** @returns {Promise<string>} approved digest */
export async function prepareApprovedRun(client, runId, { arm = true } = {}) {
  await ensureRunRow(client, runId);
  await client.query(`select phase2_harness.mark_prepared($1::uuid)`, [runId]);
  await client.query(`select phase2_harness.mark_tested($1::uuid, '[]'::jsonb)`, [runId]);
  const prev = (
    await client.query(`select phase2_harness.cleanup_preview($1::uuid, 'op', $2::jsonb) j`, [runId, fixturePairsJson()])
  ).rows[0].j;
  const digest = prev.digest;
  await client.query(`select phase2_harness.cleanup_approve($1::uuid, 'op', $2::text)`, [runId, digest]);
  if (arm) await armGuard(client);
  return digest;
}

export async function sqlDigest(client, runId) {
  const r = await client.query(`select phase2_harness.compute_cleanup_digest($1::uuid, $2::jsonb) d`, [
    runId,
    fixturePairsJson(),
  ]);
  return String(r.rows[0].d).toLowerCase();
}

export async function dbCounts(client) {
  const [cust, notes, runs, track] = await Promise.all([
    client.query(`select count(*)::int n from booking_customers`),
    client.query(`select count(*)::int n from booking_customer_internal_notes`),
    client.query(`select count(*)::int n from phase2_harness.runs`),
    client.query(`select count(*)::int n from phase2_harness.run_tracking`),
  ]);
  return {
    customers: cust.rows[0].n,
    notes: notes.rows[0].n,
    runs: runs.rows[0].n,
    tracking: track.rows[0].n,
  };
}

export async function runRow(client, runId) {
  const r = await client.query(
    `select status, cleanup_status, cleanup_approval_digest, failure_reason from phase2_harness.runs where run_id = $1`,
    [runId],
  );
  return r.rows[0] ?? null;
}

export async function ensureRunRow(client, runId) {
  const exists = await client.query(`select 1 from phase2_harness.runs where run_id = $1`, [runId]);
  if (exists.rowCount === 0) {
    await client.query(`select phase2_harness.run_start($1::uuid, 'op', $2::jsonb)`, [
      runId,
      JSON.stringify({ business_a_id: BIZ_A, business_b_id: BIZ_B }),
    ]);
  }
}

/** Seed p17 eligible delete path: customer + note + tracking */
export async function seedP17TrackedRun(client, runId) {
  await ensureRunRow(client, runId);
  await client.query(
    `insert into booking_customers (id, business_id, full_name, email, created_at) values ($1,$2,'P17',$3, now()) on conflict do nothing`,
    [IDS.p17, BIZ_A, "phase2-notes-fixture-p17-a@artecium.test"],
  );
  await client.query(
    `insert into booking_customer_internal_notes (customer_id, business_id, notes) values ($1,$2,'phase2-read-fixture')
     on conflict (customer_id) do update set notes = excluded.notes`,
    [IDS.p17, BIZ_A],
  );
  await client.query(
    `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'customer',$2,'p17')
     on conflict do nothing`,
    [runId, IDS.p17],
  );
  await client.query(
    `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'note',$2,'p17')
     on conflict do nothing`,
    [runId, IDS.p17],
  );
}

/** p16 created_this_run only (golden) */
export async function seedP16TrackingOnly(client, runId) {
  await ensureRunRow(client, runId);
  await client.query(
    `insert into booking_customers (id, business_id, full_name, email, created_at) values ($1,$2,'P16',$3, now()) on conflict do nothing`,
    [IDS.p16, BIZ_A, "phase2-notes-fixture-p16-a@artecium.test"],
  );
  await client.query(
    `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'customer',$2,'p16')`,
    [runId, IDS.p16],
  );
}

export { GOLDEN_FIXTURE_PAIRS, buildFixturePairsFromCustomerIds };
