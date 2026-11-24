/**
 * Local verification for phase2_harness persistent tracking (v2.6 applied). No network.
 *
 * Active migration file: 023_phase2_harness_persistent_tracking.sql (v2.6, hash f9baa572…).
 * Historical baseline: supabase/migrations_archive/023_phase2_harness_persistent_tracking_v2.5.sql (hash 8d43cde0…).
 * Preserved candidata copy: supabase/migrations_archive/023_phase2_harness_persistent_tracking_v2.6.sql (same as active).
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  buildCanonicalDigestDocument,
  computeCleanupDigestHex,
  DIGEST_ALGORITHM_VERSION,
} from "./booking-phase2-harness-digest.mjs";
import {
  GOLDEN_DIGEST_HEX,
  assertGoldenVectorsMatchImplementation,
  goldenRecordsP16CustomerOnly,
  goldenRecordsP17Full,
  goldenRecordsP17MutatedNote,
  GOLDEN_FIXTURE_PAIRS,
} from "./booking-phase2-harness-digest-golden.mjs";
import {
  buildFixturePairsFromCustomerIds,
  validateFixturePairs,
} from "./booking-phase2-harness-fixture-pairs.mjs";
import {
  canCleanupApprove,
  canCleanupExecute,
  canCleanupPreview,
  isAllowedStatusTransition,
} from "./booking-phase2-harness-state.mjs";
import { buildRunStartSql } from "./booking-phase2-harness-sql.mjs";
import { buildNotesTestSql } from "./booking-phase2-p2-harness-lib.mjs";
import {
  PHASE2_HARNESS_SCHEMA,
  PHASE2_NOTES_RUN_TRACKING_TABLE,
  evaluateCleanupTargets,
  createNotesRunCreationProof,
  recordCustomerCreated,
  recordNoteCreated,
  syncCreationProofFromTrackingQuery,
} from "./booking-phase2-p2-notes-lib.mjs";
import {
  internalNoteBlocksCustomerDelete,
  isCustomerDeleteEligibleForHarness,
} from "./booking-phase2-harness-cleanup-eligibility.mjs";

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

const bizA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bizB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const runId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ids = {
  p15: "11111111-1111-4111-8111-111111111101",
  p16: "11111111-1111-4111-8111-111111111102",
  p17: "11111111-1111-4111-8111-111111111103",
  p19: "11111111-1111-4111-8111-111111111104",
  p21: "11111111-1111-4111-8111-111111111105",
  p22: "11111111-1111-4111-8111-111111111106",
};

const HASH_023_ACTIVE = "f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36";
const HASH_023_V25 = "8d43cde043f14dca974b635001d8209f10387270f85b375c13bda1db83ae3e63";
const HASH_022 = "961bb64ae6c71b3d2d5d419682513c89083d1f06540cf82bc871ae05acf2dd99";

function sha256File(absPath) {
  return createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function main() {
  const migDir = path.join(process.cwd(), "supabase/migrations");
  const migArchiveDir = path.join(process.cwd(), "supabase/migrations_archive");
  const migPathActive = path.join(migDir, "023_phase2_harness_persistent_tracking.sql");
  const migPathV25 = path.join(migArchiveDir, "023_phase2_harness_persistent_tracking_v2.5.sql");
  const migPathV26 = path.join(migArchiveDir, "023_phase2_harness_persistent_tracking_v2.6.sql");
  const migPath022 = path.join(migDir, "022_booking_professional_rls_scope.sql");

  const hashActive = sha256File(migPathActive);
  const hashV25 = sha256File(migPathV25);
  const hashV26 = sha256File(migPathV26);
  const hash022 = sha256File(migPath022);

  assert(hashActive === HASH_023_ACTIVE, `active 023 hash v2.6 (${hashActive})`);
  assert(hashV25 === HASH_023_V25, `historical v2.5 hash (${hashV25})`);
  assert(hashV26 === HASH_023_ACTIVE, `preserved v2.6 candidata hash (${hashV26})`);
  assert(hashActive === hashV26, "active 023 file byte-identical to preserved v2.6 candidata");
  assert(hash022 === HASH_022, `migration 022 hash unchanged (${hash022})`);

  const migV25 = fs.readFileSync(migPathV25, "utf8");
  const mig = fs.readFileSync(migPathActive, "utf8");

  assert(migV25.includes("v2.5") && !migV25.includes("digest_mismatch_before_delete"), "v2.5 archive: no pre-delete digest gate");
  assert(!migV25.includes("fixture_customers_incomplete"), "v2.5 archive: no fixture C1 gate");
  assert(sha256File(migPathV25) === HASH_023_V25, "v2.5 archive hash stable");

  assert(mig.includes("v2.6"), "active migration documents harness v2.6");
  assert(!mig.includes("persistent run tracking (v2.5)"), "active migration is not v2.5 header");
  assert(mig.includes("digest_mismatch_before_delete"), "active migration includes pre-delete digest gate");
  assert(mig.includes("fixture_customers_incomplete"), "active migration includes fixture C1 gate");

  assert(mig.includes("create schema if not exists phase2_harness"), "migration v2.6 creates phase2_harness schema");
  assert(mig.includes("on delete restrict"), "migration FK RESTRICT");
  assert(!/references public\.booking_customers/.test(mig), "migration: no FK customer_id to product");
  assert(mig.includes("enable row level security"), "migration enables RLS on harness tables");
  assert(mig.includes("revoke all on phase2_harness.runs from public, anon, authenticated, service_role"), "migration revokes harness tables from API roles");
  assert(mig.includes("revoke all on all functions in schema phase2_harness from public"), "migration REVOKE functions from PUBLIC");
  assert(mig.includes("grant execute on all functions in schema phase2_harness to postgres"), "migration GRANT EXECUTE to postgres only");
  assert(!/grant execute.*authenticated/.test(mig), "migration: no EXECUTE grant to authenticated");
  assert(mig.includes("set search_path = ''"), "migration functions use empty search_path");
  assert(mig.includes("for update"), "migration uses FOR UPDATE on runs");
  assert(mig.includes("for update of n"), "migration locks note rows before cleanup delete");
  assert(mig.includes("for update of c"), "migration locks customer rows before cleanup delete");
  assert(mig.includes("phase2_harness._cleanup_abort_run"), "shared cleanup abort helper");
  assert(mig.includes("digest_mismatch_after_lock"), "post-lock digest mismatch reason");
  assert(mig.includes("digest_mismatch_before_delete"), "pre-delete digest mismatch reason (v2.6 Solution A)");
  assert(mig.includes("fixture_customers_incomplete"), "fixture customers C1 completeness abort");
  assert(mig.includes("invalid_fixture_pairs"), "invalid snapshot fixture_pairs abort");
  assert(mig.includes("snapshot_digest_invalid"), "snapshot digest tamper abort");
  assert(mig.includes("order by c.id"), "deterministic customer lock order");
  assert(mig.includes("order by n.customer_id"), "deterministic note lock order");
  assert(mig.includes("order by tr.kind, tr.customer_id"), "deterministic run_tracking lock order");

  const cleanupFn = mig.slice(mig.indexOf("create or replace function phase2_harness.cleanup_execute"));
  const cleanupBody = cleanupFn.slice(0, cleanupFn.indexOf("-- Function privileges", 1) || cleanupFn.length);
  assert(
    cleanupBody.includes("v_fixture_pairs := phase2_harness.validate_fixture_pairs"),
    "cleanup_execute validates fixture_pairs",
  );
  assert(!cleanupBody.includes("jsonb_array_elements(v_snap.fixture_pairs)"), "cleanup_execute uses validated v_fixture_pairs only");
  assert(cleanupBody.includes("jsonb_array_elements(v_fixture_pairs)"), "DELETE/lock paths use v_fixture_pairs");

  const fixtureC1Idx = cleanupBody.indexOf("_cleanup_abort_run(p_run_id, 'fixture_customers_incomplete')");
  const lockTrackIdx = cleanupBody.indexOf("from phase2_harness.run_tracking tr");
  const lockCIdx = cleanupBody.indexOf("for update of c");
  const lockNIdx = cleanupBody.indexOf("for update of n");
  const postLockDigestIdx = cleanupBody.indexOf("v_recalc := phase2_harness.compute_cleanup_digest");
  const preDeleteDigestIdx = cleanupBody.lastIndexOf("v_recalc := phase2_harness.compute_cleanup_digest");
  const digestAfterLockAbortIdx = cleanupBody.indexOf("_cleanup_abort_run(p_run_id, 'digest_mismatch_after_lock')");
  const digestBeforeDeleteAbortIdx = cleanupBody.indexOf("_cleanup_abort_run(p_run_id, 'digest_mismatch_before_delete')");
  const ineligibleIdx = cleanupBody.indexOf("perform phase2_harness._cleanup_abort_run(p_run_id, 'ineligible_internal_note')");
  const delNotesIdx = cleanupBody.indexOf("del_notes as (");
  assert(fixtureC1Idx > 0 && lockTrackIdx > fixtureC1Idx, "C1 fixture completeness gate before row locks");
  assert(lockTrackIdx > 0 && lockCIdx > lockTrackIdx, "cleanup_execute locks run_tracking before customers");
  assert(lockNIdx > lockCIdx, "cleanup_execute locks customers before notes");
  assert(postLockDigestIdx > lockNIdx, "digest #1 recalc after product row locks");
  assert(digestAfterLockAbortIdx > postLockDigestIdx, "digest_mismatch_after_lock after digest #1");
  assert(ineligibleIdx > digestAfterLockAbortIdx, "strict A after post-lock digest gate");
  assert(preDeleteDigestIdx > ineligibleIdx, "digest #2 after strict A (pre-delete)");
  assert(digestBeforeDeleteAbortIdx > preDeleteDigestIdx, "digest_mismatch_before_delete after digest #2");
  assert(delNotesIdx > digestBeforeDeleteAbortIdx, "DELETE block only after pre-delete digest gate");
  assert((cleanupBody.match(/v_recalc := phase2_harness\.compute_cleanup_digest/g) ?? []).length === 2, "exactly two post-validate digest recalcs in execute");
  const abortBeforeDelNotes = cleanupBody.slice(0, delNotesIdx);
  assert(!abortBeforeDelNotes.includes("delete from public.booking_customer_internal_notes"), "no note DELETE before del_notes CTE");
  assert(!abortBeforeDelNotes.includes("delete from public.booking_customers"), "no customer DELETE before del_notes CTE");
  assert((cleanupBody.match(/for update of c/g) ?? []).length === 1, "single customer FOR UPDATE pass in cleanup_execute");
  assert((cleanupBody.match(/for update of n/g) ?? []).length === 1, "single note FOR UPDATE pass in cleanup_execute");
  assert(
    !/raise exception 'cleanup_execute: ineligible internal note/.test(cleanupBody),
    "ineligible revalidation does not raise (uses _cleanup_abort_run)",
  );
  assert(
    (cleanupBody.match(/perform phase2_harness._cleanup_abort_run/g) ?? []).length >= 6,
    "abort paths invalidate approval via _cleanup_abort_run (incl. C1 + pre-delete digest)",
  );
  assert(!/failure_reason = 'digest_mismatch'/.test(cleanupBody), "pre-lock digest_mismatch removed from execute");

  const mutatedBetweenApproveLock = goldenRecordsP17Full();
  const digestAtApprove = computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, mutatedBetweenApproveLock);
  const digestIfNoteMutated = computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, goldenRecordsP17MutatedNote());
  assert(digestAtApprove !== digestIfNoteMutated, "note mutation changes digest (post-lock mismatch scenario)");
  const digestStableUnderSameState = computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, mutatedBetweenApproveLock);
  assert(digestAtApprove === digestStableUnderSameState, "digest unchanged when fixture state unchanged (static)");
  assert(mig.includes("track_fixture_customer"), "migration defines track_fixture_customer");
  assert(mig.includes("track_fixture_note"), "migration defines track_fixture_note");
  assert(!/track_fixture_note[\s\S]*SET\s+LOCAL\s+ROLE/m.test(mig), "track functions do not SET ROLE");
  assert(mig.includes("phase2_harness.deployment_guard"), "migration deployment_guard table");
  assert(mig.includes("cleanup_armed boolean not null default false"), "deployment_guard default disarmed");
  assert(mig.includes("phase2_harness._assert_cleanup_armed"), "migration _assert_cleanup_armed");
  assert(mig.includes("phase2_harness.internal_note_blocks_customer_delete"), "migration internal_note_blocks helper");
  assert(mig.includes("'cleanup_not_armed'"), "migration abort reason cleanup_not_armed");
  assert(mig.includes("'ineligible_internal_note'"), "migration abort reason ineligible_internal_note");
  assert(mig.includes("not phase2_harness.internal_note_blocks_customer_delete"), "customer delete uses note eligibility");
  assert(mig.includes("digest_algorithm_version\":3"), "migration digest version 3");
  assert(mig.includes("next_snapshot_seq"), "migration next_snapshot_seq on runs");
  assert(mig.includes("is_superseded"), "migration snapshot supersede flag");
  assert(!/rollback to savepoint/i.test(mig), "migration: no SAVEPOINT rollback pattern");
  assert(mig.includes("exception when others"), "migration: PL/pgSQL EXCEPTION for delete rollback");

  const pairs = buildFixturePairsFromCustomerIds(ids, { businessAId: bizA, businessBId: bizB });
  assert(pairs.length === 6, "fixture_pairs has six entries");

  assertThrows(() => validateFixturePairs(pairs.filter((p) => p.fixture_key !== "p22"), bizA, bizB), "reject missing p22");
  assertThrows(
    () => validateFixturePairs([...pairs, { ...pairs[0], fixture_key: "p15" }], bizA, bizB),
    "reject duplicate fixture_key",
  );
  assertThrows(
    () =>
      validateFixturePairs(
        pairs.map((p) => (p.fixture_key === "p16" ? { ...p, email_normalized: pairs[0].email_normalized } : p)),
        bizA,
        bizB,
      ),
    "reject email mismatch for key",
  );
  assertThrows(
    () =>
      validateFixturePairs(
        pairs.map((p) => (p.fixture_key === "p19" ? { ...p, business_id: bizA } : p)),
        bizA,
        bizB,
      ),
    "reject p19 business A",
  );

  const runStartSql = buildRunStartSql(runId, "op@test", { businessAId: bizA, businessBId: bizB });
  assert(runStartSql.includes("business_a_id"), "run_start metadata uses business_a_id");
  assert(runStartSql.includes("business_b_id"), "run_start metadata uses business_b_id");

  const emptyDigest = computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, []);
  const doc = buildCanonicalDigestDocument(runId, GOLDEN_FIXTURE_PAIRS, []);
  assert(doc.includes('"digest_algorithm_version":3'), "digest doc includes algorithm version 3");
  assert(
    createHash("sha256").update(doc, "utf8").digest("hex") === emptyDigest,
    "digest hex matches sha256 of canonical doc",
  );
  assert(emptyDigest === GOLDEN_DIGEST_HEX.emptyRecords, "golden empty-records digest matches");
  assert(
    computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, goldenRecordsP16CustomerOnly()) ===
      GOLDEN_DIGEST_HEX.createdCustomerP16,
    "golden p16 customer digest",
  );
  assert(
    computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, goldenRecordsP17Full()) === GOLDEN_DIGEST_HEX.p17Full,
    "golden p17 full digest",
  );
  assert(
    computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, goldenRecordsP17MutatedNote()) ===
      GOLDEN_DIGEST_HEX.p17NoteMutated,
    "golden p17 mutated note digest",
  );
  const goldenErrors = assertGoldenVectorsMatchImplementation();
  assert(goldenErrors.length === 0, `golden module self-check (${goldenErrors.join("; ") || "ok"})`);

  const otherRun = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  assert(computeCleanupDigestHex(otherRun, GOLDEN_FIXTURE_PAIRS, []) !== emptyDigest, "digest differs for other run_id");

  const preExistingProof = createNotesRunCreationProof(runId);
  const pre = evaluateCleanupTargets(
    [{ id: ids.p16, email: "phase2-notes-fixture-p16-a@artecium.test", business_id: bizA }],
    ids,
    preExistingProof,
    { businessAId: bizA, businessBId: bizB },
  );
  assert(!pre.customers.includes(ids.p16), "pre-existing customer without tracking not eligible");

  const proof = createNotesRunCreationProof(runId);
  syncCreationProofFromTrackingQuery(proof, [{ kind: "note", customer_id: ids.p17 }]);
  const preNote = evaluateCleanupTargets(
    [
      {
        id: ids.p17,
        email: "phase2-notes-fixture-p17-a@artecium.test",
        business_id: bizA,
        notes: "phase2-read-fixture",
      },
    ],
    ids,
    proof,
    { businessAId: bizA, businessBId: bizB },
  );
  assert(!preNote.customers.includes(ids.p17) || preNote.notes.length === 0, "note tracked without customer proof preserved");

  assert(canCleanupPreview("tested", "aborted"), "preview allowed after aborted");
  assert(canCleanupPreview("tested", "rejected"), "preview allowed after rejected");
  assert(!canCleanupPreview("failed", "not_requested"), "preview blocked when failed");
  assert(!canCleanupExecute("tested", "approved"), "execute blocked without cleanup_approved status");
  assert(canCleanupExecute("cleanup_approved", "approved"), "execute allowed when approved");
  assert(!canCleanupApprove("cleanup_approved"), "approve only from tested");
  assert(isAllowedStatusTransition("cleanup_approved", "cleaned"), "transition to cleaned");
  assert(!isAllowedStatusTransition("failed", "cleaned"), "failed cannot become cleaned");

  const bundle = buildNotesTestSql({
    businessAId: bizA,
    businessBId: bizB,
    managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    customerIds: ids,
    runId,
  });
  assert(bundle.runStart.includes("phase2_harness.run_start"), "harness bundle exposes runStart");
  assert(bundle.cleanupPreview.includes("cleanup_preview"), "harness bundle exposes cleanupPreview");
  assert(bundle.cleanupExecute("abc").includes("cleanup_execute"), "harness bundle exposes cleanupExecute");
  assert(!bundle.fixturePrep.includes("CREATE TEMP TABLE"), "fixture prep no TEMP table");
  assert(bundle.fixturePrep.includes("track_fixture_customer"), "fixture prep uses track_fixture_customer");
  assert(bundle.fixturePrep.includes("track_fixture_note"), "fixture prep uses track_fixture_note");
  assert(!bundle.fixturePrep.includes(`INSERT INTO ${PHASE2_NOTES_RUN_TRACKING_TABLE}`), "fixture prep no direct tracking INSERT");
  assert(bundle.queryRunTrackingSql.includes("phase2_harness.run_tracking"), "query uses persistent table");
  assert(bundle.revert.includes("cleanup_execute"), "revert documents harness execute");
  assert(!bundle.revert.includes("DELETE FROM public.booking_customers"), "revert has no raw customer DELETE");

  assert(PHASE2_HARNESS_SCHEMA === "phase2_harness", "schema constant");
  assert(DIGEST_ALGORITHM_VERSION === 3, "digest version constant");

  const proofFull = createNotesRunCreationProof(runId);
  recordCustomerCreated(proofFull, ids.p17);
  recordNoteCreated(proofFull, ids.p17);
  assert(
    isCustomerDeleteEligibleForHarness(
      {
        id: ids.p17,
        email: "phase2-notes-fixture-p17-a@artecium.test",
        business_id: bizA,
        notes: "phase2-read-fixture",
        internalNoteRow: true,
      },
      ids.p17,
      proofFull.customersCreated,
      proofFull.notesCreated,
      "phase2-notes-fixture-p17-a@artecium.test",
      bizA,
    ),
    "eligible: customer+fixture note tracked",
  );

  assert(
    !isCustomerDeleteEligibleForHarness(
      {
        id: ids.p16,
        email: "phase2-notes-fixture-p16-a@artecium.test",
        business_id: bizA,
        notes: "Real CRM note",
        internalNoteRow: true,
      },
      ids.p16,
      new Set([ids.p16]),
      new Set(),
      "phase2-notes-fixture-p16-a@artecium.test",
      bizA,
    ),
    "ineligible: non-fixture note blocks customer delete",
  );

  assert(
    internalNoteBlocksCustomerDelete({ notes: "phase2-x" }, false),
    "ineligible: phase2 note without tracking blocks customer delete",
  );

  assert(
    internalNoteBlocksCustomerDelete({ notes: null }, true),
    "ineligible: NULL notes column blocks customer delete",
  );

  assert(
    !internalNoteBlocksCustomerDelete(undefined, false),
    "eligible customer delete: no internal note row",
  );

  assert(
    isCustomerDeleteEligibleForHarness(
      {
        id: ids.p16,
        email: "phase2-notes-fixture-p16-a@artecium.test",
        business_id: bizA,
      },
      ids.p16,
      new Set([ids.p16]),
      new Set(),
      "phase2-notes-fixture-p16-a@artecium.test",
      bizA,
    ),
    "eligible: tracked customer without internal note row",
  );

  const mutated = goldenRecordsP17MutatedNote();
  const mutatedDigest = computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, mutated);
  assert(
    mutatedDigest !== computeCleanupDigestHex(runId, GOLDEN_FIXTURE_PAIRS, goldenRecordsP17Full()),
    "note mutation changes digest (approval/execute mismatch path)",
  );

  console.log(`\nGolden digests v3: empty=${GOLDEN_DIGEST_HEX.emptyRecords}`);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
