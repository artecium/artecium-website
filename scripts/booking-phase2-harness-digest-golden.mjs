/**
 * Independent golden vectors for digest v3 (cleanup customer eligibility aligned with execute).
 * Hashes verified via Node crypto outside booking-phase2-harness-digest.mjs implementation chain.
 */

import { computeCleanupDigestHex } from "./booking-phase2-harness-digest.mjs";

const RUN_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const BIZ_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BIZ_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

/** @type {import('./booking-phase2-harness-digest.mjs').FixturePair[]} */
export const GOLDEN_FIXTURE_PAIRS = [
  {
    fixture_key: "p15",
    customer_id: "11111111-1111-4111-8111-111111111101",
    email_normalized: "phase2-notes-fixture-a@artecium.test",
    business_id: BIZ_A,
  },
  {
    fixture_key: "p16",
    customer_id: "11111111-1111-4111-8111-111111111102",
    email_normalized: "phase2-notes-fixture-p16-a@artecium.test",
    business_id: BIZ_A,
  },
  {
    fixture_key: "p17",
    customer_id: "11111111-1111-4111-8111-111111111103",
    email_normalized: "phase2-notes-fixture-p17-a@artecium.test",
    business_id: BIZ_A,
  },
  {
    fixture_key: "p19",
    customer_id: "11111111-1111-4111-8111-111111111104",
    email_normalized: "phase2-notes-fixture-b@artecium.test",
    business_id: BIZ_B,
  },
  {
    fixture_key: "p21",
    customer_id: "11111111-1111-4111-8111-111111111105",
    email_normalized: "phase2-notes-fixture-p21-a@artecium.test",
    business_id: BIZ_A,
  },
  {
    fixture_key: "p22",
    customer_id: "11111111-1111-4111-8111-111111111106",
    email_normalized: "phase2-notes-fixture-p22-a@artecium.test",
    business_id: BIZ_A,
  },
];

/**
 * SHA-256 over canonical digest v3 documents.
 */
export const GOLDEN_DIGEST_HEX = {
  emptyRecords: "e53ae63c1a31adcaf45da945b81dc80f703ea7aec218531d2ed7482489219177",
  createdCustomerP16: "e3a2a1c1757ef8c6a3a8dff6baf94046e359c359d312b5ef8e2635f737816b49",
  p17Full: "d38709a5c5be4bd0ec34bf329ace4a53576619a20f3229fe7d76a4b2d26eba25",
  p17NoteMutated: "3b1aaa2163befbb6c369ec88674d0ceafba03c59aefeb2ce766f805a0d0579e0",
};

/** @returns {import('./booking-phase2-harness-digest.mjs').AuditRecord[]} */
export function goldenRecordsP16CustomerOnly() {
  const id = "11111111-1111-4111-8111-111111111102";
  return [
    {
      section: "created_this_run",
      run_id: RUN_ID,
      kind: "customer",
      fixture_key: "p16",
      customer_id: id,
      email_normalized: null,
      business_id: null,
      notes: null,
    },
    {
      section: "to_delete_customer",
      run_id: RUN_ID,
      kind: "customer",
      fixture_key: "p16",
      customer_id: id,
      email_normalized: "phase2-notes-fixture-p16-a@artecium.test",
      business_id: BIZ_A,
      notes: null,
    },
  ];
}

/** @returns {import('./booking-phase2-harness-digest.mjs').AuditRecord[]} */
export function goldenRecordsP17Full() {
  const id = "11111111-1111-4111-8111-111111111103";
  return [
    {
      section: "created_this_run",
      run_id: RUN_ID,
      kind: "customer",
      fixture_key: "p17",
      customer_id: id,
      email_normalized: null,
      business_id: null,
      notes: null,
    },
    {
      section: "created_this_run",
      run_id: RUN_ID,
      kind: "note",
      fixture_key: "p17",
      customer_id: id,
      email_normalized: null,
      business_id: null,
      notes: "phase2-read-fixture",
    },
    {
      section: "to_delete_customer",
      run_id: RUN_ID,
      kind: "customer",
      fixture_key: "p17",
      customer_id: id,
      email_normalized: "phase2-notes-fixture-p17-a@artecium.test",
      business_id: BIZ_A,
      notes: null,
    },
    {
      section: "to_delete_note",
      run_id: RUN_ID,
      kind: "note",
      fixture_key: "p17",
      customer_id: id,
      email_normalized: "phase2-notes-fixture-p17-a@artecium.test",
      business_id: BIZ_A,
      notes: "phase2-read-fixture",
    },
  ];
}

/** @returns {import('./booking-phase2-harness-digest.mjs').AuditRecord[]} */
export function goldenRecordsP17MutatedNote() {
  return goldenRecordsP17Full().map((r) =>
    r.notes === "phase2-read-fixture" ? { ...r, notes: "phase2-read-fixture-alt" } : r,
  );
}

export function assertGoldenVectorsMatchImplementation() {
  const checks = [
    ["emptyRecords", [], GOLDEN_DIGEST_HEX.emptyRecords],
    ["createdCustomerP16", goldenRecordsP16CustomerOnly(), GOLDEN_DIGEST_HEX.createdCustomerP16],
    ["p17Full", goldenRecordsP17Full(), GOLDEN_DIGEST_HEX.p17Full],
    ["p17NoteMutated", goldenRecordsP17MutatedNote(), GOLDEN_DIGEST_HEX.p17NoteMutated],
  ];
  const errors = [];
  for (const [label, records, expected] of checks) {
    const got = computeCleanupDigestHex(RUN_ID, GOLDEN_FIXTURE_PAIRS, records);
    if (got !== expected) {
      errors.push(`${label}: expected ${expected}, got ${got}`);
    }
  }
  return errors;
}
