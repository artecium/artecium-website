/**
 * Digest v3 SQL vs JS full golden parity (embedded PostgreSQL only).
 */

import pg from "pg";
import { computeCleanupDigestHex } from "./booking-phase2-harness-digest.mjs";
import {
  GOLDEN_DIGEST_HEX,
  goldenRecordsP16CustomerOnly,
  goldenRecordsP17Full,
  goldenRecordsP17MutatedNote,
  GOLDEN_FIXTURE_PAIRS as FIXTURE_PAIRS,
} from "./booking-phase2-harness-digest-golden.mjs";
import {
  BIZ_A,
  IDS,
  loadHarnessSchema,
  seedBusinesses,
  seedP16TrackingOnly,
  seedP17TrackedRun,
  sqlDigest,
  startEmbeddedHarness,
} from "./booking-phase2-harness-pg-lib.mjs";

const RUN_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

async function resetDb(client) {
  await client.query(`delete from phase2_harness.run_tracking`);
  await client.query(`delete from phase2_harness.cleanup_audit_snapshots`);
  await client.query(`delete from phase2_harness.runs`);
  await client.query(`delete from booking_customer_internal_notes`);
  await client.query(`delete from booking_customers`);
  await client.query(`delete from booking_businesses`);
  await seedBusinesses(client);
  await client.query(`select phase2_harness.run_start($1::uuid, 'op', $2::jsonb)`, [
    RUN_ID,
    JSON.stringify({ business_a_id: BIZ_A, business_b_id: (await import("./booking-phase2-harness-pg-lib.mjs")).BIZ_B }),
  ]);
}

async function main() {
  const { conn, stop } = await startEmbeddedHarness();
  const client = new pg.Client(conn);
  await client.connect();
  await loadHarnessSchema(client);

  const vectors = [
    { id: "empty_records", golden: GOLDEN_DIGEST_HEX.emptyRecords, jsRecords: [], setup: async () => {} },
    {
      id: "p16_customer_only",
      golden: GOLDEN_DIGEST_HEX.createdCustomerP16,
      jsRecords: goldenRecordsP16CustomerOnly(),
      setup: async (c) => {
        await seedP16TrackingOnly(c, RUN_ID);
      },
    },
    {
      id: "p17_full",
      golden: GOLDEN_DIGEST_HEX.p17Full,
      jsRecords: goldenRecordsP17Full(),
      setup: async (c) => {
        await seedP17TrackedRun(c, RUN_ID);
      },
    },
    {
      id: "p17_note_mutated",
      golden: GOLDEN_DIGEST_HEX.p17NoteMutated,
      jsRecords: goldenRecordsP17MutatedNote(),
      setup: async (c) => {
        await seedP17TrackedRun(c, RUN_ID);
        await c.query(`update booking_customer_internal_notes set notes = 'phase2-read-fixture-alt' where customer_id = $1`, [
          IDS.p17,
        ]);
      },
    },
    {
      id: "unicode_note",
      golden: null,
      jsRecords: goldenRecordsP17Full().map((r) =>
        r.notes === "phase2-read-fixture" ? { ...r, notes: 'phase2-uni "slash\\" café 🎭' } : r,
      ),
      setup: async (c) => {
        await seedP17TrackedRun(c, RUN_ID);
        await c.query(`update booking_customer_internal_notes set notes = $1 where customer_id = $2`, [
          'phase2-uni "slash\\" café 🎭',
          IDS.p17,
        ]);
      },
    },
    {
      id: "email_normalization",
      golden: null,
      jsRecords: [
        {
          section: "pre_existing_untracked_customer",
          run_id: RUN_ID,
          kind: null,
          fixture_key: "p15",
          customer_id: IDS.p15,
          email_normalized: "phase2-notes-fixture-a@artecium.test",
          business_id: BIZ_A,
          notes: null,
        },
      ],
      setup: async (c) => {
        await c.query(
          `insert into booking_customers (id, business_id, full_name, email) values ($1,$2,'x',$3) on conflict (id) do update set email = excluded.email`,
          [IDS.p15, BIZ_A, "phase2-notes-fixture-A@artecium.test"],
        );
      },
    },
    {
      id: "multiple_tracked_customers",
      golden: null,
      jsRecords: null,
      setup: async (c) => {
        await seedP16TrackingOnly(c, RUN_ID);
        await seedP17TrackedRun(c, RUN_ID);
      },
      customJs: async () => {
        const { goldenRecordsP16CustomerOnly, goldenRecordsP17Full } = await import(
          "./booking-phase2-harness-digest-golden.mjs"
        );
        const merged = [...goldenRecordsP16CustomerOnly(), ...goldenRecordsP17Full()];
        return computeCleanupDigestHex(
          RUN_ID,
          (await import("./booking-phase2-harness-digest-golden.mjs")).GOLDEN_FIXTURE_PAIRS,
          merged,
        );
      },
    },
    {
      id: "empty_string_note_ineligible",
      golden: null,
      jsRecords: [
        {
          section: "created_this_run",
          run_id: RUN_ID,
          kind: "customer",
          fixture_key: "p16",
          customer_id: IDS.p16,
          email_normalized: null,
          business_id: null,
          notes: null,
        },
        {
          section: "created_this_run",
          run_id: RUN_ID,
          kind: "note",
          fixture_key: "p16",
          customer_id: IDS.p16,
          email_normalized: null,
          business_id: null,
          notes: "",
        },
      ],
      setup: async (c) => {
        await seedP16TrackingOnly(c, RUN_ID);
        await c.query(
          `insert into booking_customer_internal_notes (customer_id, business_id, notes) values ($1,$2,'')
           on conflict (customer_id) do update set notes = excluded.notes`,
          [IDS.p16, BIZ_A],
        );
        await c.query(
          `insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key) values ($1,'note',$2,'p16')
           on conflict do nothing`,
          [RUN_ID, IDS.p16],
        );
      },
    },
    {
      id: "json_escape_special_chars",
      golden: null,
      jsRecords: null,
      setup: async (c) => {
        await seedP17TrackedRun(c, RUN_ID);
        await c.query(`update booking_customer_internal_notes set notes = $1 where customer_id = $2`, [
          'phase2-tab\there"quote"',
          IDS.p17,
        ]);
      },
      customJs: async () => {
        const base = goldenRecordsP17Full().map((r) =>
          r.notes === "phase2-read-fixture" ? { ...r, notes: 'phase2-tab\there"quote"' } : r,
        );
        return computeCleanupDigestHex(RUN_ID, FIXTURE_PAIRS, base);
      },
    },
  ];

  const results = [];
  for (const v of vectors) {
    await resetDb(client);
    await v.setup(client);
    const sql = await sqlDigest(client, RUN_ID);
    const js = v.customJs
      ? String(await v.customJs()).toLowerCase()
      : computeCleanupDigestHex(
          RUN_ID,
          (await import("./booking-phase2-harness-digest-golden.mjs")).GOLDEN_FIXTURE_PAIRS,
          v.jsRecords,
        ).toLowerCase();
    const pass = v.golden ? sql === js && js === v.golden : sql === js;
    results.push({ id: v.id, sql, js, golden: v.golden, pass });
  }

  console.log(JSON.stringify({ results }, null, 2));
  await client.end();
  await stop();
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
}

main().catch((e) => {
  console.error("FAIL", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
