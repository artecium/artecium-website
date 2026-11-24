/**
 * SQL snippets for phase2_harness (Dashboard / CLI / MCP). No network.
 */

import { buildFixturePairsFromCustomerIds } from "./booking-phase2-harness-fixture-pairs.mjs";
import { assertUuid } from "./booking-phase2-p2-notes-lib.mjs";

/** @param {unknown} v */
function sqlJsonLiteral(v) {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

/** @param {string} s */
function sqlText(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/**
 * @param {string} runId
 * @param {string} operator
 * @param {{ businessAId: string, businessBId: string, customerIds?: Record<string, string>, harness_contract_version?: number }} metadata
 */
export function buildRunStartSql(runId, operator, metadata) {
  assertUuid(runId, "runId");
  const {
    businessAId,
    businessBId,
    customerIds,
    harness_contract_version = 3,
    ...rest
  } = metadata;
  const payload = {
    harness_contract_version,
    business_a_id: businessAId,
    business_b_id: businessBId,
    ...(customerIds ? { customer_ids: customerIds } : {}),
    ...rest,
  };
  return `-- phase2_harness.run_start
SELECT phase2_harness.run_start(
  '${runId}'::uuid,
  ${sqlText(operator)},
  ${sqlJsonLiteral(payload)}
);`;
}

/** @param {string} runId */
export function buildMarkPreparedSql(runId) {
  assertUuid(runId, "runId");
  return `SELECT phase2_harness.mark_prepared('${runId}'::uuid);`;
}

/**
 * @param {string} runId
 * @param {unknown} testResults
 */
export function buildMarkTestedSql(runId, testResults) {
  assertUuid(runId, "runId");
  return `SELECT phase2_harness.mark_tested('${runId}'::uuid, ${sqlJsonLiteral(testResults ?? [])});`;
}

/**
 * @param {string} runId
 * @param {string} operator
 * @param {Partial<Record<string, string>>} customerIds
 * @param {{ businessAId: string, businessBId: string }} biz
 */
export function buildCleanupPreviewSql(runId, operator, customerIds, biz) {
  assertUuid(runId, "runId");
  const pairs = buildFixturePairsFromCustomerIds(customerIds, biz);
  return `-- Human review required before approve/execute
SELECT phase2_harness.cleanup_preview(
  '${runId}'::uuid,
  ${sqlText(operator)},
  ${sqlJsonLiteral(pairs)}
);`;
}

/**
 * @param {string} runId
 * @param {string} operator
 * @param {string} digest lowercase hex
 */
export function buildCleanupApproveSql(runId, operator, digest) {
  assertUuid(runId, "runId");
  return `-- Approve ONLY after reviewing preview digest and audit_payload
SELECT phase2_harness.cleanup_approve(
  '${runId}'::uuid,
  ${sqlText(operator)},
  ${sqlText(digest.toLowerCase())}
);`;
}

/** @param {string} runId @param {string} operator @param {string} [reason] */
export function buildCleanupRejectSql(runId, operator, reason) {
  assertUuid(runId, "runId");
  return `SELECT phase2_harness.cleanup_reject(
  '${runId}'::uuid,
  ${sqlText(operator)},
  ${reason ? sqlText(reason) : "NULL"}
);`;
}

/**
 * @param {string} runId
 * @param {string} operator
 * @param {string} digest
 */
export function buildCleanupExecuteSql(runId, operator, digest) {
  assertUuid(runId, "runId");
  return `-- Destructive: requires prior approve; uses fixture_pairs from active snapshot only
SELECT phase2_harness.cleanup_execute(
  '${runId}'::uuid,
  ${sqlText(operator)},
  ${sqlText(digest.toLowerCase())}
);`;
}

/** @param {string} runId */
export function buildQueryRunTrackingSqlPersistent(runId) {
  assertUuid(runId, "runId");
  return `-- Persistent tracking (any connection / MCP call)
SELECT run_id::text AS run_id, kind, customer_id::text AS customer_id, fixture_key
FROM phase2_harness.run_tracking
WHERE run_id = '${runId}'::uuid
ORDER BY kind, fixture_key;`;
}

/** @param {string} runId */
export function buildSessionUserCheckSql() {
  return `SELECT current_user, session_user;`;
}
