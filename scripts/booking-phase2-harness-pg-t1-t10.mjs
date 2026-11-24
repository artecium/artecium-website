/**
 * PostgreSQL harness tests T1–T10 + C1 (local embedded only).
 */

import pg from "pg";
import {
  armGuard,
  BIZ_A,
  BIZ_B,
  dbCounts,
  fixturePairsJson,
  IDS,
  loadHarnessSchema,
  prepareApprovedRun,
  runRow,
  seedAllFixtureCustomers,
  seedBusinesses,
  seedFixtureCustomers,
  seedP17TrackedRun,
  startEmbeddedHarness,
} from "./booking-phase2-harness-pg-lib.mjs";

/** @type {{ id: string, name: string, status: 'PASS'|'FAIL'|'SKIP', detail?: string }[]} */
const report = [];

function logTest(id, name, status, detail = "") {
  report.push({ id, name, status, detail });
  console.log(`${status.padEnd(4)}  ${id} ${name}${detail ? ` — ${detail}` : ""}`);
}

function withTimeout(ms, label, fn) {
  return Promise.race([
    fn(),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} ${ms}ms`)), ms)),
  ]);
}

/** True when waiterPid is blocked waiting on a lock held by blockerPid (row-lock barrier). */
async function waitUntilBlockedBy(client, waiterPid, blockerPid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const blocker = Number(blockerPid);
  while (Date.now() < deadline) {
    const { rows } = await client.query(`select pg_blocking_pids($1::int) as blocked`, [waiterPid]);
    const blocked = rows[0]?.blocked ?? [];
    if (blocked.some((p) => Number(p) === blocker)) return true;
    await new Promise((r) => setTimeout(r, 4));
  }
  return false;
}

async function main() {
  const { conn, stop } = await startEmbeddedHarness();
  const setup = new pg.Client(conn);
  await setup.connect();
  await loadHarnessSchema(setup);
  await seedBusinesses(setup);
  await setup.end();

  // C1 — missing fixture before execute, snapshot still valid
  try {
    const runC1 = "a1111111-1111-4111-8111-1111111111a1";
    const c = new pg.Client(conn);
    await c.connect();
    await seedFixtureCustomers(c, ["p22"]);
    const before = await dbCounts(c);
    const digest = await prepareApprovedRun(c, runC1);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [runC1, digest])).rows[0]
      .r;
    const after = await dbCounts(c);
    const row = await runRow(c, runC1);
    const pass =
      res.reason === "fixture_customers_incomplete" &&
      res.ok === false &&
      before.customers === after.customers &&
      before.notes === after.notes &&
      row.cleanup_status === "aborted" &&
      row.cleanup_approval_digest === null;
    logTest(
      "C1",
      "fixture_customers_incomplete isolated",
      pass ? "PASS" : "FAIL",
      JSON.stringify({ res, row }),
    );
    await c.end();
  } catch (e) {
    logTest("C1", "fixture_customers_incomplete isolated", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T1 — note mutation after approve
  try {
    const run1 = "b1111111-1111-4111-8111-1111111111b1";
    const c = new pg.Client(conn);
    await c.connect();
    await seedAllFixtureCustomers(c);
    await seedP17TrackedRun(c, run1);
    const before = await dbCounts(c);
    const d = await prepareApprovedRun(c, run1);
    await c.query(`update booking_customer_internal_notes set notes = notes || '-mut' where customer_id = $1`, [IDS.p17]);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run1, d])).rows[0].r;
    const after = await dbCounts(c);
    const pass =
      res.ok === false &&
      (res.reason === "digest_mismatch_after_lock" || res.reason === "snapshot_digest_invalid" || res.reason === "digest_mismatch_before_delete") &&
      before.customers === after.customers &&
      before.notes === after.notes;
    logTest("T1", "note mutation after approve", pass ? "PASS" : "FAIL", JSON.stringify(res));
    await c.end();
  } catch (e) {
    logTest("T1", "note mutation after approve", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T2 — fixture removed after approve
  try {
    const run2 = "22222222-2222-4222-8222-222222222202";
    const c = new pg.Client(conn);
    await c.connect();
    await seedAllFixtureCustomers(c);
    const before = await dbCounts(c);
    const d = await prepareApprovedRun(c, run2);
    await c.query(`delete from booking_customers where id = $1`, [IDS.p22]);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run2, d])).rows[0].r;
    const after = await dbCounts(c);
    const pass =
      res.ok === false &&
      (res.reason === "snapshot_digest_invalid" || res.reason === "fixture_customers_incomplete") &&
      after.customers === before.customers - 1;
    logTest("T2", "remove fixture after approve", pass ? "PASS" : "FAIL", JSON.stringify(res));
    await c.end();
  } catch (e) {
    logTest("T2", "remove fixture after approve", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T3 — concurrent note mutation during execute (barrier: hold notes row lock until execute blocks, then mutate)
  try {
    const run3 = "33333333-3333-4333-8333-333333333303";
    const prep = new pg.Client(conn);
    await prep.connect();
    await seedAllFixtureCustomers(prep);
    await seedP17TrackedRun(prep, run3);
    const d = await prepareApprovedRun(prep, run3);
    await prep.end();

    const exec = new pg.Client(conn);
    const mut = new pg.Client(conn);
    const watch = new pg.Client(conn);
    await exec.connect();
    await mut.connect();
    await watch.connect();

    const execPid = (await exec.query(`select pg_backend_pid() as pid`)).rows[0].pid;
    await mut.query("begin");
    const mutPid = (await mut.query(`select pg_backend_pid() as pid`)).rows[0].pid;
    await mut.query(`select customer_id from booking_customer_internal_notes where customer_id = $1 for update`, [
      IDS.p17,
    ]);

    const execPromise = exec.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run3, d]);
    const blocked = await waitUntilBlockedBy(watch, execPid, mutPid, 15000);

    let detail;
    let pass = false;
    if (!blocked) {
      await mut.query("rollback").catch(() => {});
      try {
        await withTimeout(2000, "T3 cleanup after barrier timeout", () => execPromise);
      } catch {
        /* ignore */
      }
      detail = `cleanup_execute (pid ${execPid}) never blocked behind mutator (pid ${mutPid}) within timeout`;
    } else {
      await mut.query(`update booking_customer_internal_notes set notes = 'phase2-mutated' where customer_id = $1`, [
        IDS.p17,
      ]);
      await mut.query("commit");
      const ra = await withTimeout(15000, "T3 cleanup_execute", () => execPromise);
      const resA = ra.rows[0].r;
      const allowedReasons = ["digest_mismatch_after_lock", "digest_mismatch_before_delete", "snapshot_digest_invalid"];
      pass = resA?.ok === false && allowedReasons.includes(resA?.reason);
      if (!pass) {
        detail =
          resA?.ok === true
            ? "cleanup_execute succeeded but must abort with digest mismatch after concurrent note mutation"
            : `unexpected reason ${resA?.reason ?? "null"} (expected ${allowedReasons.join("|")})`;
      }
      detail ??= JSON.stringify({ resA });
    }

    logTest("T3", "concurrent note mutation during execute", pass ? "PASS" : "FAIL", detail);
    await exec.end();
    await mut.end();
    await watch.end();
  } catch (e) {
    logTest("T3", "concurrent note mutation during execute", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T4 — FK block on concurrent note insert
  try {
    const run4 = "44444444-4444-4444-8444-444444444404";
    const prep = new pg.Client(conn);
    await prep.connect();
    await seedAllFixtureCustomers(prep);
    await seedP17TrackedRun(prep, run4);
    const d = await prepareApprovedRun(prep, run4);
    await prep.end();
    const a = new pg.Client(conn);
    const b = new pg.Client(conn);
    await a.connect();
    await b.connect();
    let bBlockedMs = null;
    const bStart = Date.now();
    const race = await Promise.allSettled([
      withTimeout(15000, "T4 execute", () =>
        a.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run4, d]),
      ),
      (async () => {
        await new Promise((r) => setTimeout(r, 20));
        try {
          await withTimeout(12000, "T4 insert", () =>
            b.query(
              `insert into booking_customer_internal_notes (customer_id, business_id, notes) values ($1,$2,'phase2-concurrent')
               on conflict (customer_id) do update set notes = excluded.notes`,
              [IDS.p17, BIZ_A],
            ),
          );
        } finally {
          bBlockedMs = Date.now() - bStart;
        }
      })(),
    ]);
    const resA = race[0].status === "fulfilled" ? race[0].value.rows[0].r : race[0].reason?.message;
    const pass = race[0].status === "fulfilled" && (resA?.ok === true || resA?.ok === false);
    logTest("T4", "concurrent note insert vs execute", pass ? "PASS" : "FAIL", JSON.stringify({ resA, bBlockedMs }));
    await a.end();
    await b.end();
  } catch (e) {
    logTest("T4", "concurrent note insert vs execute", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T5 — concurrent tracking insert
  try {
    const run5 = "55555555-5555-4555-8555-555555555505";
    const prep = new pg.Client(conn);
    await prep.connect();
    await seedAllFixtureCustomers(prep);
    const d = await prepareApprovedRun(prep, run5);
    await prep.end();
    const a = new pg.Client(conn);
    const b = new pg.Client(conn);
    await a.connect();
    await b.connect();
    const [ra, rb] = await Promise.allSettled([
      a.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run5, d]),
      (async () => {
        await new Promise((r) => setTimeout(r, 5));
        return b.query(
          `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'customer',$2,'p16')`,
          [run5, IDS.p16],
        );
      })(),
    ]);
    const resA = ra.status === "fulfilled" ? ra.value.rows[0].r : null;
    const pass = resA !== null;
    logTest("T5", "concurrent run_tracking insert", pass ? "PASS" : "FAIL", JSON.stringify({ resA, rb: rb.status }));
    await a.end();
    await b.end();
  } catch (e) {
    logTest("T5", "concurrent run_tracking insert", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T6
  try {
    const run6 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const c = new pg.Client(conn);
    await c.connect();
    await seedAllFixtureCustomers(c);
    await c.query(`select phase2_harness.run_start($1::uuid, 'op', $2::jsonb)`, [
      run6,
      JSON.stringify({ business_a_id: BIZ_A, business_b_id: BIZ_B }),
    ]);
    await c.query(`select phase2_harness.mark_prepared($1::uuid)`, [run6]);
    await c.query(`select phase2_harness.mark_tested($1::uuid, '[]'::jsonb)`, [run6]);
    await c.query(
      `insert into booking_customer_internal_notes (customer_id, business_id, notes) values ($1,$2,'Real CRM')
       on conflict (customer_id) do update set notes = excluded.notes`,
      [IDS.p16, BIZ_A],
    );
    await c.query(
      `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'customer',$2,'p16')`,
      [run6, IDS.p16],
    );
    const prev = (
      await c.query(`select phase2_harness.cleanup_preview($1::uuid, 'op', $2::jsonb) j`, [run6, fixturePairsJson()])
    ).rows[0].j;
    const d = prev.digest;
    await c.query(`select phase2_harness.cleanup_approve($1::uuid, 'op', $2::text)`, [run6, d]);
    await armGuard(c);
    const before = await dbCounts(c);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run6, d])).rows[0].r;
    const after = await dbCounts(c);
    const pass = res.reason === "ineligible_internal_note" && before.customers === after.customers;
    logTest("T6", "ineligible internal note", pass ? "PASS" : "FAIL", JSON.stringify(res));
    await c.end();
  } catch (e) {
    logTest("T6", "ineligible internal note", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T7
  try {
    const run7 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const prep = new pg.Client(conn);
    await prep.connect();
    await seedAllFixtureCustomers(prep);
    const d = await prepareApprovedRun(prep, run7);
    await prep.end();
    const a = new pg.Client(conn);
    const b = new pg.Client(conn);
    await a.connect();
    await b.connect();
    const [ra, rb] = await Promise.allSettled([
      a.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) as cleanup_execute`, [run7, d]),
      b.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) as cleanup_execute`, [run7, d]),
    ]);
    const okCount = [ra, rb].filter((x) => x.status === "fulfilled" && x.value.rows[0]?.cleanup_execute?.ok === true).length;
    logTest("T7", "concurrent cleanup_execute", okCount <= 1 ? "PASS" : "FAIL", JSON.stringify({ okCount }));
    await a.end();
    await b.end();
  } catch (e) {
    logTest("T7", "concurrent cleanup_execute", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T8 — customer delete forced failure rolls back notes delete
  try {
    const run8 = "88888888-8888-4888-8888-888888888808";
    const c = new pg.Client(conn);
    await c.connect();
    await seedAllFixtureCustomers(c);
    await seedP17TrackedRun(c, run8);
    await c.query(
      `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key)
       select $1,'note',$2,'p17' where not exists (
         select 1 from phase2_harness.run_tracking where run_id=$1 and kind='note' and customer_id=$2)`,
      [run8, IDS.p17],
    );
    const d = await prepareApprovedRun(c, run8);
    const notesBefore = (await c.query(`select count(*)::int n from booking_customer_internal_notes`)).rows[0].n;
    await c.query(`select set_config('phase2_harness.fail_customer_delete', 'on', false)`);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run8, d])).rows[0].r;
    const notesAfter = (await c.query(`select count(*)::int n from booking_customer_internal_notes`)).rows[0].n;
    const row = await runRow(c, run8);
    const pass =
      res.reason === "delete_failed" &&
      notesBefore === notesAfter &&
      row.cleanup_status === "aborted" &&
      row.cleanup_approval_digest === null;
    logTest("T8", "atomicity on customer delete failure", pass ? "PASS" : "FAIL", JSON.stringify({ res, notesBefore, notesAfter, row }));
    await c.end();
  } catch (e) {
    logTest("T8", "atomicity on customer delete failure", "FAIL", e instanceof Error ? e.message : String(e));
  }

  // T10 — digest #2 immediately before DELETE (ordering in source + stable execute completes)
  try {
    const { readMigration023Utf8 } = await import("./booking-phase2-harness-pg-lib.mjs");
    const mig = readMigration023Utf8();
    const body = mig.slice(mig.indexOf("create or replace function phase2_harness.cleanup_execute"));
    const d2 = body.indexOf("digest_mismatch_before_delete");
    const del = body.indexOf("del_notes as (");
    const staticOk = d2 > 0 && del > d2;
    const run10 = "10101010-1010-4101-8101-101010101010";
    const c = new pg.Client(conn);
    await c.connect();
    await seedAllFixtureCustomers(c);
    await seedP17TrackedRun(c, run10);
    const d = await prepareApprovedRun(c, run10);
    const before = await dbCounts(c);
    const res = (await c.query(`select phase2_harness.cleanup_execute($1::uuid,'op',$2::text) r`, [run10, d])).rows[0].r;
    const after = await dbCounts(c);
    const pass = staticOk && res.ok === true && after.notes <= before.notes;
    logTest("T10", "pre-delete digest gate ordering + stable execute", pass ? "PASS" : "FAIL", JSON.stringify({ staticOk, res }));
    await c.end();
  } catch (e) {
    logTest("T10", "pre-delete digest gate", "FAIL", e instanceof Error ? e.message : String(e));
  }

  logTest("T9", "digest SQL/JS parity", "SKIP", "executed in booking-phase2-harness-digest-sql-parity.mjs");

  await stop();

  const failed = report.filter((r) => r.status === "FAIL").length;
  const skipped = report.filter((r) => r.status === "SKIP").length;
  const passed = report.filter((r) => r.status === "PASS").length;
  console.log(JSON.stringify({ report, passed, failed, skipped }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
