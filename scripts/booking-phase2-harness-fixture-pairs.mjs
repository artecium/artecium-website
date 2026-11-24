/**
 * Fixture pair validation (v2.1) — mirrors phase2_harness.validate_fixture_pairs.
 */

import {
  PHASE2_NOTES_CUSTOMER_KEYS,
  PHASE2_NOTES_FIXTURE_CUSTOMERS,
  expectedBusinessIdForFixtureKey,
  assertUuid,
} from "./booking-phase2-p2-notes-lib.mjs";
import { normalizeEmail, normalizeUuid } from "./booking-phase2-harness-digest.mjs";

const REQUIRED_KEYS = [...PHASE2_NOTES_CUSTOMER_KEYS];

/**
 * @param {Partial<Record<string, string>>} customerIds
 * @param {{ businessAId: string, businessBId: string }} biz
 */
export function buildFixturePairsFromCustomerIds(customerIds, biz) {
  assertUuid(biz.businessAId, "businessAId");
  assertUuid(biz.businessBId, "businessBId");
  /** @type {import('./booking-phase2-harness-digest.mjs').FixturePair[]} */
  const pairs = [];
  for (const key of REQUIRED_KEYS) {
    const id = customerIds[key];
    if (!id) throw new Error(`missing customerIds.${key}`);
    assertUuid(id, key);
    pairs.push({
      fixture_key: key,
      customer_id: normalizeUuid(id),
      email_normalized: normalizeEmail(PHASE2_NOTES_FIXTURE_CUSTOMERS[key]),
      business_id: normalizeUuid(expectedBusinessIdForFixtureKey(key, biz.businessAId, biz.businessBId)),
    });
  }
  return validateFixturePairs(pairs, biz.businessAId, biz.businessBId);
}

/**
 * @param {import('./booking-phase2-harness-digest.mjs').FixturePair[]} input
 * @param {string} businessAId
 * @param {string} businessBId
 */
export function validateFixturePairs(input, businessAId, businessBId) {
  if (!Array.isArray(input)) throw new Error("fixture_pairs must be an array");
  const keys = new Set();
  const ids = new Set();
  /** @type {import('./booking-phase2-harness-digest.mjs').FixturePair[]} */
  const normalized = [];

  for (const raw of input) {
    const fixture_key = String(raw?.fixture_key ?? "");
    if (!REQUIRED_KEYS.includes(fixture_key)) {
      throw new Error(`unknown fixture_key: ${fixture_key}`);
    }
    if (keys.has(fixture_key)) throw new Error(`duplicate fixture_key: ${fixture_key}`);
    keys.add(fixture_key);

    const customer_id = normalizeUuid(raw.customer_id);
    const email_normalized = normalizeEmail(raw.email_normalized ?? raw.email);
    const business_id = normalizeUuid(raw.business_id);

    if (!customer_id) throw new Error(`missing customer_id for ${fixture_key}`);
    if (ids.has(customer_id)) throw new Error(`duplicate customer_id: ${customer_id}`);
    ids.add(customer_id);

    const expectedEmail = normalizeEmail(PHASE2_NOTES_FIXTURE_CUSTOMERS[fixture_key]);
    const expectedBiz = normalizeUuid(
      expectedBusinessIdForFixtureKey(fixture_key, businessAId, businessBId),
    );

    if (email_normalized !== expectedEmail) {
      throw new Error(`email mismatch for ${fixture_key}`);
    }
    if (business_id !== expectedBiz) {
      throw new Error(`business_id mismatch for ${fixture_key}`);
    }
    if (!email_normalized.includes("phase2-notes-fixture")) {
      throw new Error(`email not a phase2-notes-fixture address for ${fixture_key}`);
    }

    normalized.push({ fixture_key, customer_id, email_normalized, business_id });
  }

  for (const k of REQUIRED_KEYS) {
    if (!keys.has(k)) throw new Error(`missing fixture_key: ${k}`);
  }

  normalized.sort((a, b) => a.fixture_key.localeCompare(b.fixture_key));
  return normalized;
}
