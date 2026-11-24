/**
 * Static verification for Phase 2 incremental fixtures + notes test contracts.
 * No Supabase network.
 */

import fs from "node:fs";
import path from "node:path";
import {
  P2_NOTES_EXPECTATIONS,
  PHASE2_NOTES_FIXTURE_CUSTOMERS,
  PHASE2_NOTES_RUN_TRACKING_TABLE,
  assertNotesCaseOutcome,
  assertUuid,
  buildNotesAuthTestSql,
  buildNotesCleanupSql,
  buildNotesFixtureSql,
  buildQueryRunTrackingSql,
  createNotesRunCreationProof,
  evaluateCleanupTargets,
  evaluateFixtureCustomerPrep,
  evaluateFixtureNotePrep,
  recordCustomerCreated,
  recordNoteCreated,
  syncCreationProofFromTrackingQuery,
  validateDistinctNotesCustomerIds,
  validateNotesSqlContext,
} from "./booking-phase2-p2-notes-lib.mjs";

const biz = (bizA, bizB) => ({ businessAId: bizA, businessBId: bizB });
import { buildNotesTestSql } from "./booking-phase2-p2-harness-lib.mjs";
import { BOOKING_INTEGRATION_MEMBERSHIP_ROWS, computeSamTimeOffInterval } from "./booking-integration-fixtures.mjs";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${msg}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

function assertThrows(fn, msg) {
  try {
    fn();
    assert(false, msg);
  } catch (e) {
    assert(true, `${msg} (${e instanceof Error ? e.message : e})`);
  }
}

function main() {
  const incPath = path.join(process.cwd(), "scripts/booking-phase2-incremental-fixtures.mjs");
  const inc = fs.readFileSync(incPath, "utf8");

  assert(!/from\(["']booking_businesses["']\)[\s\S]{0,80}\.delete\s*\(/.test(inc), "incremental: no delete() on booking_businesses");
  assert(!/\.delete\s*\(\)/.test(inc), "incremental: no Supabase delete() calls");
  assert(inc.includes("--dry-run") || inc.includes("DRY RUN"), "incremental: dry-run path documented");
  assert(inc.includes("assertLocalBookingTestEnabled"), "incremental: gated by booking test guards when applying");

  const authPlanPath = path.join(process.cwd(), "scripts/booking-phase2-p2-notes-auth-plan.mjs");
  const authPlan = fs.readFileSync(authPlanPath, "utf8");
  assert(!/createClient|from\s+["']pg["']/.test(authPlan), "auth-plan: no DB client imports");
  assert(/no DB I\/O|local only, no remote/i.test(authPlan), "auth-plan: documents no DB I/O");

  const bizA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const bizB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const runId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const proof = createNotesRunCreationProof(runId);
  const ids = {
    p15: "11111111-1111-4111-8111-111111111101",
    p16: "11111111-1111-4111-8111-111111111102",
    p17: "11111111-1111-4111-8111-111111111103",
    p19: "11111111-1111-4111-8111-111111111104",
    p21: "11111111-1111-4111-8111-111111111105",
    p22: "11111111-1111-4111-8111-111111111106",
  };

  validateNotesSqlContext({
    businessAId: bizA,
    businessBId: bizB,
    managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ownerUserId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    customerIds: ids,
  });

  const fixtureSql = buildNotesFixtureSql({
    businessAId: bizA,
    businessBId: bizB,
    customerIds: ids,
    managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    creationProof: proof,
  });
  assert(fixtureSql.includes(PHASE2_NOTES_RUN_TRACKING_TABLE), "fixture prep uses persistent run_tracking");
  assert(!fixtureSql.includes("CREATE TEMP TABLE"), "fixture prep does not create TEMP tracking");
  assert(fixtureSql.includes("phase2_harness.runs"), "fixture prep verifies harness run row");
  assert(fixtureSql.includes("track_fixture_customer"), "customer INSERT registers tracking via track_fixture_customer");
  const queryIdx = fixtureSql.lastIndexOf("ORDER BY kind, fixture_key");
  const firstCustomerDo = fixtureSql.indexOf("fixture_customer_");
  assert(firstCustomerDo >= 0 && queryIdx > firstCustomerDo, "fixture SQL: customer prep before trailing tracking SELECT");

  const trackingQuery = buildQueryRunTrackingSql(runId);
  assert(trackingQuery.includes(`FROM ${PHASE2_NOTES_RUN_TRACKING_TABLE}`), "tracking query reads phase2_harness.run_tracking");
  assert(
    !/FROM public\.(booking_customers|booking_customer_internal_notes)/.test(trackingQuery),
    "tracking query does not read live fixture tables",
  );
  assert(trackingQuery.includes(`WHERE run_id = '${runId}'`), "tracking query scoped to current run_id");

  const cleanupSql = buildNotesCleanupSql(ids, { businessAId: bizA, businessBId: bizB }, proof);
  assert(cleanupSql.includes("created_this_run"), "cleanup audit labels created_this_run");
  assert(cleanupSql.includes("phase2_harness.cleanup_audit_snapshots"), "cleanup references harness snapshots");
  assert(cleanupSql.includes("cleanup_preview"), "cleanup documents preview step");
  assert(cleanupSql.includes("cleanup_execute"), "cleanup documents execute step");
  assert(cleanupSql.includes("created_this_run"), "cleanup read-only audit for tracking");
  assert(!cleanupSql.includes("DELETE FROM public.booking_customers"), "cleanup SQL has no raw DELETE (use cleanup_execute)");

  assertThrows(
    () => buildNotesCleanupSql(ids, { businessAId: bizA, businessBId: bizB }, undefined),
    "cleanup requires creationProof",
  );

  const preExistingCustomer = evaluateCleanupTargets(
    [
      {
        id: ids.p16,
        email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p16,
        business_id: bizA,
      },
    ],
    ids,
    proof,
    biz(bizA, bizB),
  );
  assert(!preExistingCustomer.customers.includes(ids.p16), "pre-existing customer not deletable without proof");
  assert(
    preExistingCustomer.preserved.some((p) => p.id === ids.p16 && p.reason.includes("pre-existing")),
    "id+email+business correct but no creation proof → preserved",
  );

  const proofBizMismatch = createNotesRunCreationProof("aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  recordCustomerCreated(proofBizMismatch, ids.p16);
  const wrongBusiness = evaluateCleanupTargets(
    [
      {
        id: ids.p16,
        email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p16,
        business_id: bizB,
      },
    ],
    ids,
    proofBizMismatch,
    biz(bizA, bizB),
  );
  assert(!wrongBusiness.customers.includes(ids.p16), "wrong business_id not eligible");
  assert(
    wrongBusiness.preserved.some((p) => p.id === ids.p16 && p.reason === "business_id mismatch"),
    "id+email correct business_id wrong → business_id mismatch",
  );

  recordCustomerCreated(proof, ids.p16);
  const createdCustomer = evaluateCleanupTargets(
    [
      {
        id: ids.p16,
        email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p16,
        business_id: bizA,
      },
    ],
    ids,
    proof,
    biz(bizA, bizB),
  );
  assert(createdCustomer.customers.includes(ids.p16), "created this run + all attributes correct → eligible");

  const preExistingNote = evaluateCleanupTargets(
    [
      {
        id: ids.p17,
        email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p17,
        business_id: bizA,
        notes: "phase2-read-fixture",
      },
    ],
    ids,
    proof,
    biz(bizA, bizB),
  );
  assert(!preExistingNote.notes.includes(ids.p17), "pre-existing phase2- note not deletable without note proof");
  assert(
    preExistingNote.preserved.some((p) => p.reason.includes("pre-existing phase2- note")),
    "pre-existing phase2- note preserved",
  );

  recordCustomerCreated(proof, ids.p17);
  recordNoteCreated(proof, ids.p17);
  const createdNote = evaluateCleanupTargets(
    [
      {
        id: ids.p17,
        email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p17,
        business_id: bizA,
        notes: "phase2-read-fixture",
      },
    ],
    ids,
    proof,
    biz(bizA, bizB),
  );
  assert(createdNote.notes.includes(ids.p17), "note created this run is eligible");

  const proofWrongEmail = createNotesRunCreationProof("ffffffff-ffff-4fff-8fff-ffffffffffff");
  recordCustomerCreated(proofWrongEmail, ids.p15);
  const wrongEmail = evaluateCleanupTargets(
    [
      {
        id: ids.p15,
        email: "legacy@artecium.test",
        business_id: bizA,
        notes: "phase2-x",
      },
    ],
    ids,
    proofWrongEmail,
    biz(bizA, bizB),
  );
  assert(!wrongEmail.customers.includes(ids.p15), "wrong email never eligible even with customer proof");

  const proofEmpty = createNotesRunCreationProof(runId);
  proofEmpty.customersCreated.add(ids.p15);
  syncCreationProofFromTrackingQuery(proofEmpty, []);
  assert(proofEmpty.customersCreated.size === 0 && proofEmpty.notesCreated.size === 0, "sync: empty tracking clears Sets");

  const proofCustomersOnly = createNotesRunCreationProof(runId);
  syncCreationProofFromTrackingQuery(proofCustomersOnly, [
    { kind: "customer", customer_id: ids.p16, run_id: runId },
    { kind: "customer", customer_id: ids.p21, run_id: runId },
  ]);
  assert(
    proofCustomersOnly.customersCreated.size === 2 && proofCustomersOnly.notesCreated.size === 0,
    "sync: customers only",
  );

  const proofNotesOnly = createNotesRunCreationProof(runId);
  syncCreationProofFromTrackingQuery(proofNotesOnly, [{ kind: "note", customer_id: ids.p17 }]);
  assert(proofNotesOnly.notesCreated.has(ids.p17) && proofNotesOnly.customersCreated.size === 0, "sync: notes only");

  const proofSync = createNotesRunCreationProof(runId);
  proofSync.customersCreated.add("99999999-9999-4999-8999-999999999999");
  syncCreationProofFromTrackingQuery(proofSync, [
    { kind: "customer", customer_id: ids.p21 },
    { kind: "note", customer_id: ids.p22 },
  ]);
  assert(!proofSync.customersCreated.has("99999999-9999-4999-8999-999999999999"), "sync clears inferred IDs");
  assert(proofSync.customersCreated.has(ids.p21) && proofSync.notesCreated.has(ids.p22), "sync from tracking rows only");

  syncCreationProofFromTrackingQuery(proofSync, [{ kind: "customer", customer_id: ids.p15 }]);
  assert(
    proofSync.customersCreated.size === 1 &&
      proofSync.customersCreated.has(ids.p15) &&
      !proofSync.notesCreated.has(ids.p22),
    "sync: second pass replaces prior Sets (no merge)",
  );

  assertThrows(
    () =>
      syncCreationProofFromTrackingQuery(proofSync, [
        { kind: "customer", customer_id: ids.p16, run_id: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
      ]),
    "sync rejects row run_id different from proof.runId",
  );
  assertThrows(
    () => syncCreationProofFromTrackingQuery(proofSync, [{ kind: "appointment", customer_id: ids.p16 }]),
    "sync rejects invalid kind",
  );
  assertThrows(
    () => syncCreationProofFromTrackingQuery(proofSync, [{ kind: "customer", customer_id: "not-a-uuid" }]),
    "sync rejects invalid UUID",
  );
  assertThrows(
    () => syncCreationProofFromTrackingQuery(proofSync, [{ kind: "note", customer_id: "" }]),
    "sync rejects missing customer_id",
  );

  assertThrows(
    () => evaluateCleanupTargets([], ids, undefined, biz(bizA, bizB)),
    "evaluateCleanupTargets requires proof",
  );

  const authSql = buildNotesAuthTestSql({
    customerIds: ids,
    businessAId: bizA,
    businessBId: bizB,
    managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ownerUserId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    creationProof: createNotesRunCreationProof(runId),
  });
  assert(authSql.revert.includes("cleanup_execute"), "auth revert documents harness cleanup_execute");

  const bundle = buildNotesTestSql({
    businessAId: bizA,
    businessBId: bizB,
    managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    customerIds: ids,
    runId,
  });
  assert(
    bundle.queryRunTrackingSql.includes(PHASE2_NOTES_RUN_TRACKING_TABLE),
    "harness exposes persistent tracking query",
  );
  assert(bundle.runStart?.includes("phase2_harness.run_start"), "harness bundle includes runStart");
  assert(typeof bundle.syncCreationProofFromTrackingQuery === "function", "harness exports syncCreationProofFromTrackingQuery");

  const customerConflict = evaluateFixtureCustomerPrep(
    [{ id: ids.p15, business_id: bizA, email: "other@artecium.test" }],
    { id: ids.p15, business_id: bizA, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p15 },
  );
  assert(customerConflict.action === "abort", "customer prep aborts id/email conflict");

  const noteMismatch = evaluateFixtureNotePrep(
    { customer_id: ids.p17, notes: "phase2-other-text" },
    "phase2-read-fixture",
  );
  assert(noteMismatch.action === "abort", "note prep aborts fixture content mismatch");

  assert(!assertNotesCaseOutcome("P2-19", { ok: false, errorCode: "PGRST301" }).pass, "P2-19 rejects PGRST301");

  assert(BOOKING_INTEGRATION_MEMBERSHIP_ROWS === 6, "integration membership row count documented as 6");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
