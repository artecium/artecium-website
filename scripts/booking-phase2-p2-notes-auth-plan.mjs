/**
 * Prints authorized Phase 2 notes DML plan (fixture prep vs JWT auth tests). No DB I/O.
 *
 * node scripts/booking-phase2-p2-notes-auth-plan.mjs
 */

import { PHASE2_RLS_CASES } from "./booking-professional-rls-phase2-lib.mjs";
import { buildNotesTestSql, summarizeP2Matrix } from "./booking-phase2-p2-harness-lib.mjs";
import {
  P2_NOTES_EXPECTATIONS,
  PHASE2_NOTES_FIXTURE_CUSTOMERS,
  assertUuid,
  buildNotesAuthTestSql,
  buildNotesFixtureSql,
  createNotesRunCreationProof,
  notesActorEmails,
  validateNotesSqlContext,
} from "./booking-phase2-p2-notes-lib.mjs";

const PLACEHOLDER = {
  businessAId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  businessBId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  managerUserId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  ownerUserId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  customerIds: {
    p15: "11111111-1111-4111-8111-111111111101",
    p16: "11111111-1111-4111-8111-111111111102",
    p17: "11111111-1111-4111-8111-111111111103",
    p19: "11111111-1111-4111-8111-111111111104",
    p21: "11111111-1111-4111-8111-111111111105",
    p22: "11111111-1111-4111-8111-111111111106",
  },
};

function main() {
  validateNotesSqlContext(PLACEHOLDER);
  const creationProof = createNotesRunCreationProof("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");

  console.log("=== Phase 2 notes — execution plan (local only, no remote) ===\n");
  console.log("Security:");
  console.log("  - Fixture customers: service_role INSERT with RETURNING + id/email verification.");
  console.log("  - Notes proofs: SET LOCAL authenticated + JWT sub, or PostgREST with fresh client per actor.");
  console.log("  - Never use service_role to impersonate manager/owner/professional.");
  console.log("  - postgres superuser is not an RLS proof.");
  console.log("  - Each block ends with JWT claim reset + RESET ROLE; ROLLBACK on mutating probes.");
  console.log("Tracking (phase2_harness v2.1 — persistent, any connection):");
  console.log("  1. runStart → fixturePrep → markPrepared");
  console.log("  2. queryRunTrackingSql → syncCreationProofFromTrackingQuery(proof, rows)");
  console.log("  3. auth tests (ROLLBACK — do not add to tracking) → markTested");
  console.log("  4. cleanupPreview → human review → cleanupApprove → cleanupExecute");
  console.log("  See docs/booking/PHASE2_PERSISTENT_TRACKING_RUNBOOK.md\n");

  console.log("Fixture customer emails (independent per P2-15/16/21/22):");
  for (const [k, email] of Object.entries(PHASE2_NOTES_FIXTURE_CUSTOMERS)) {
    console.log(`  ${k}: ${email}`);
  }

  console.log("\n--- Expectations ---\n");
  for (const id of ["P2-15", "P2-16", "P2-17", "P2-19", "P2-21", "P2-22"]) {
    const meta = PHASE2_RLS_CASES.find((c) => c.id === id);
    const exp = P2_NOTES_EXPECTATIONS[id];
    console.log(`${id}  ${meta?.title ?? ""}`);
    console.log(`  actors: ${notesActorEmails(id).join(", ") || "—"}`);
    console.log(`  expectSuccess: ${exp.expectSuccess}`);
    if (exp.expectBusinessId) console.log(`  expectBusinessId: ${exp.expectBusinessId}`);
    if (exp.rejectCodes) console.log(`  rejectCodes: ${exp.rejectCodes.join(", ")}`);
    console.log("");
  }

  console.log("--- Fixture prep SQL (validated UUID placeholders) ---\n");
  console.log(buildNotesFixtureSql({ ...PLACEHOLDER, creationProof }));

  console.log("\n--- Auth test SQL (ROLLBACK + RETURNING) ---\n");
  const auth = buildNotesAuthTestSql({ ...PLACEHOLDER, creationProof });
  for (const [k, sql] of Object.entries(auth)) {
    console.log(`### ${k}\n${sql}\n`);
  }

  console.log("--- UUID validation smoke ---");
  try {
    assertUuid("not-a-uuid", "bad");
    console.log("FAIL  assertUuid should throw");
  } catch {
    console.log("PASS  assertUuid rejects invalid values");
  }

  console.log("\n--- P2 matrix (local planned remote) ---\n");
  const { counts, rows } = summarizeP2Matrix();
  for (const row of rows.filter((r) => /^P2-(15|16|17|19|21|22|10)$/.test(r.id))) {
    console.log(`${row.combined.padEnd(7)} ${row.id}  remote=${row.remote.status}  ${row.title}`);
  }
  console.log(`\nCombined totals: ${JSON.stringify(counts)}`);
  console.log("\nP2-10 remains BLOCKED (no 2001-row fixture in this phase).");

  const bundle = buildNotesTestSql({ ...PLACEHOLDER, creationProof, operator: "operator@artecium.test" });
  console.log("\n--- Harness SQL (run / preview / execute) ---\n");
  console.log(bundle.runStart);
  console.log("\n" + bundle.cleanupPreview);
  console.log("\n-- cleanupApprove(digest) and cleanupExecute(digest) after human review\n");

  console.log("\nAwait explicit authorization before applying migration 023 or remote DML.");
}

main();
