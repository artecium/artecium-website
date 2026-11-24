/**
 * Phase 2 internal notes — fixture contracts, JWT SQL runners, assertion helpers.
 * Fixture prep (customers) may use service_role; authorization tests must use real JWT only.
 */

import {
  BOOKING_TEST_USERS,
  PHASE2_NOTES_CUSTOMER_EMAIL,
  PHASE2_NOTES_CUSTOMER_EMAIL_B,
  PHASE2_NOTES_CUSTOMER_EMAIL_P21,
  PHASE2_NOTES_FIXTURE_NOTE_PREFIX,
} from "./booking-integration-fixtures.mjs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {string} value @param {string} label */
export function assertUuid(value, label) {
  if (!UUID_RE.test(String(value).trim())) {
    throw new Error(`invalid UUID for ${label}: ${value}`);
  }
}

/**
 * @param {{
 *   businessAId: string,
 *   businessBId: string,
 *   managerUserId: string,
 *   ownerUserId?: string,
 *   customerIds: Partial<Record<keyof typeof PHASE2_NOTES_FIXTURE_CUSTOMERS, string>>,
 * }} ctx
 */
export function validateNotesSqlContext(ctx) {
  assertUuid(ctx.businessAId, "businessAId");
  assertUuid(ctx.businessBId, "businessBId");
  assertUuid(ctx.managerUserId, "managerUserId");
  if (ctx.ownerUserId) assertUuid(ctx.ownerUserId, "ownerUserId");
  for (const [key, id] of Object.entries(ctx.customerIds ?? {})) {
    if (id) assertUuid(id, `customerIds.${key}`);
  }
}

/**
 * Require distinct UUIDs for every notes fixture slot used in a full authorized round.
 * @param {Partial<Record<string, string>>} customerIds
 * @param {{ requireAll?: boolean }} [opts]
 */
export function validateDistinctNotesCustomerIds(customerIds, opts = {}) {
  const keys = opts.requireAll ? PHASE2_NOTES_CUSTOMER_KEYS : Object.keys(customerIds ?? {});
  const missing = PHASE2_NOTES_CUSTOMER_KEYS.filter((k) => opts.requireAll && !customerIds?.[k]);
  if (missing.length) {
    throw new Error(
      `Phase 2 notes fixtures: missing customerIds for ${missing.join(", ")} (each case needs an independent UUID)`,
    );
  }
  const seen = new Map();
  for (const key of keys) {
    const id = customerIds?.[key];
    if (!id) continue;
    assertUuid(id, `customerIds.${key}`);
    if (seen.has(id)) {
      throw new Error(
        `Phase 2 notes fixtures: duplicate customer_id ${id} used for ${seen.get(id)} and ${key}`,
      );
    }
    seen.set(id, key);
  }
  for (const key of PHASE2_NOTES_MUTATING_CUSTOMER_KEYS) {
    if (opts.requireAll && !customerIds?.[key]) {
      throw new Error(`Phase 2 notes fixtures: mutating case ${key} requires its own customerIds.${key}`);
    }
  }
}

/**
 * Pure validation mirroring fixture customer SQL (for unit tests).
 * @param {{ id: string, business_id: string, email: string }[]} existingRows
 * @param {{ id: string, business_id: string, email: string }} fixture
 */
export function evaluateFixtureCustomerPrep(existingRows, fixture) {
  const byId = existingRows.find((r) => r.id === fixture.id);
  const byEmail = existingRows.find(
    (r) =>
      r.business_id === fixture.business_id &&
      String(r.email).toLowerCase() === String(fixture.email).toLowerCase(),
  );
  if (byId) {
    if (
      byId.business_id !== fixture.business_id ||
      String(byId.email).toLowerCase() !== String(fixture.email).toLowerCase()
    ) {
      return { action: "abort", reason: "id exists with different email or business_id" };
    }
  }
  if (byEmail && byEmail.id !== fixture.id) {
    return { action: "abort", reason: "email exists with different id on business" };
  }
  if (byId && byEmail && byId.id === byEmail.id) {
    return { action: "ok_existing", reason: "verified existing row" };
  }
  if (!byId && !byEmail) {
    return { action: "insert", reason: "no conflict" };
  }
  if (byId && !byEmail) {
    return { action: "ok_existing", reason: "id row verified" };
  }
  return { action: "abort", reason: "ambiguous customer fixture state" };
}

/**
 * @param {{ customer_id: string, notes: string | null } | null} existingNote
 * @param {string} expectedNotes
 */
export function evaluateFixtureNotePrep(existingNote, expectedNotes) {
  if (!existingNote?.customer_id) {
    return { action: "insert", reason: "note missing" };
  }
  const notes = existingNote.notes ?? "";
  if (!notes.startsWith(PHASE2_NOTES_FIXTURE_NOTE_PREFIX)) {
    return { action: "abort", reason: "existing non-fixture note" };
  }
  if (notes !== expectedNotes) {
    return { action: "abort", reason: "fixture note content mismatch" };
  }
  return { action: "ok_existing", reason: "fixture note already correct" };
}

/** Persistent harness schema (v2.1 — test Supabase only). */
export const PHASE2_HARNESS_SCHEMA = "phase2_harness";

/** Fully qualified tracking table (replaces TEMP phase2_notes_run_created). */
export const PHASE2_NOTES_RUN_TRACKING_TABLE = "phase2_harness.run_tracking";

/** Allowed tracking row kinds (SQL CHECK + JS sync). */
export const PHASE2_NOTES_TRACKING_KINDS = ["customer", "note"];

/**
 * @typedef {Object} NotesRunCreationProof
 * @property {string} runId
 * @property {Set<string>} customersCreated
 * @property {Set<string>} notesCreated
 */

/**
 * @param {string} [runId]
 * @returns {NotesRunCreationProof}
 */
export function createNotesRunCreationProof(runId) {
  const id =
    runId ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "00000000-0000-4000-8000-000000000001");
  assertUuid(id, "runId");
  return {
    runId: id,
    customersCreated: new Set(),
    notesCreated: new Set(),
  };
}

/** @param {NotesRunCreationProof} proof */
export function validateCreationProof(proof) {
  if (!proof?.runId) throw new Error("creationProof.runId is required");
  assertUuid(proof.runId, "creationProof.runId");
  if (!(proof.customersCreated instanceof Set) || !(proof.notesCreated instanceof Set)) {
    throw new Error("creationProof requires customersCreated and notesCreated Sets");
  }
}

/**
 * @param {NotesRunCreationProof} proof
 * @param {string} customerId
 * @param {string} [fixtureKey]
 */
export function recordCustomerCreated(proof, customerId) {
  validateCreationProof(proof);
  assertUuid(customerId, "recordCustomerCreated.customerId");
  proof.customersCreated.add(customerId);
}

/**
 * @param {NotesRunCreationProof} proof
 * @param {string} customerId
 */
export function recordNoteCreated(proof, customerId) {
  validateCreationProof(proof);
  assertUuid(customerId, "recordNoteCreated.customerId");
  proof.notesCreated.add(customerId);
}

/**
 * @param {string} key @param {string} businessAId @param {string} businessBId
 */
export function expectedBusinessIdForFixtureKey(key, businessAId, businessBId) {
  return key === "p19" ? businessBId : businessAId;
}

/**
 * @param {{ id: string, email: string, business_id: string, notes?: string | null }[]} customers
 * @param {Partial<Record<string, string>>} customerIds
 * @param {NotesRunCreationProof} proof
 * @param {{ businessAId: string, businessBId: string }} biz
 */
export function evaluateCleanupTargets(customers, customerIds, proof, biz) {
  validateCreationProof(proof);
  assertUuid(biz.businessAId, "biz.businessAId");
  assertUuid(biz.businessBId, "biz.businessBId");
  /** @type {{ customers: string[], notes: string[], preserved: { id: string, reason: string }[] }} */
  const eligible = { customers: [], notes: [], preserved: [] };
  for (const key of PHASE2_NOTES_CUSTOMER_KEYS) {
    const id = customerIds[key];
    if (!id) continue;
    const expectedEmail = PHASE2_NOTES_FIXTURE_CUSTOMERS[key];
    const expectedBusinessId = expectedBusinessIdForFixtureKey(key, biz.businessAId, biz.businessBId);
    const row = customers.find((c) => c.id === id);
    if (!row) continue;

    if (String(row.email).toLowerCase() !== expectedEmail.toLowerCase()) {
      eligible.preserved.push({ id, reason: "email mismatch" });
      continue;
    }
    if (!String(row.email).toLowerCase().includes("phase2-notes-fixture")) {
      eligible.preserved.push({ id, reason: "email not a phase2-notes-fixture address" });
      continue;
    }
    if (String(row.business_id) !== expectedBusinessId) {
      eligible.preserved.push({ id, reason: "business_id mismatch" });
      continue;
    }

    if (!proof.customersCreated.has(id)) {
      eligible.preserved.push({ id, reason: "pre-existing customer (not created this run)" });
      if (row.notes != null && String(row.notes).startsWith(PHASE2_NOTES_FIXTURE_NOTE_PREFIX)) {
        eligible.preserved.push({ id, reason: "pre-existing phase2- note without run proof" });
      }
      continue;
    }

    eligible.customers.push(id);

    if (row.notes != null && String(row.notes).startsWith(PHASE2_NOTES_FIXTURE_NOTE_PREFIX)) {
      if (proof.notesCreated.has(id)) {
        eligible.notes.push(id);
      } else {
        eligible.preserved.push({ id, reason: "pre-existing phase2- note (not created this run)" });
      }
    }
  }
  return eligible;
}

/**
 * Read tracking rows from the same PostgreSQL session as fixture prep (do not infer from table existence).
 * @param {string} runId
 */
export function buildQueryRunTrackingSql(runId) {
  assertUuid(runId, "runId");
  return `-- Persistent harness tracking (Dashboard / CLI / MCP — no shared session required)
-- Source: phase2_harness.run_tracking ONLY (never infer from product tables)
SELECT run_id::text AS run_id, kind, customer_id::text AS customer_id, fixture_key
FROM ${PHASE2_NOTES_RUN_TRACKING_TABLE}
WHERE run_id = '${runId}'::uuid
ORDER BY kind, fixture_key;`;
}

/**
 * Replace proof Sets from tracking query results only (never merge with prior guesses).
 * @param {NotesRunCreationProof} proof
 * @param {{ kind: string, customer_id: string, run_id?: string }[]} trackingRows
 */
export function syncCreationProofFromTrackingQuery(proof, trackingRows) {
  validateCreationProof(proof);
  proof.customersCreated.clear();
  proof.notesCreated.clear();
  for (const row of trackingRows ?? []) {
    if (row?.run_id != null && String(row.run_id) !== proof.runId) {
      throw new Error(
        `syncCreationProofFromTrackingQuery: row run_id ${row.run_id} !== proof.runId ${proof.runId}`,
      );
    }
    const kind = String(row?.kind ?? "");
    if (!PHASE2_NOTES_TRACKING_KINDS.includes(kind)) {
      throw new Error(`syncCreationProofFromTrackingQuery: invalid kind "${kind}"`);
    }
    if (row?.customer_id == null || String(row.customer_id).trim() === "") {
      throw new Error("syncCreationProofFromTrackingQuery: missing customer_id");
    }
    const customerId = String(row.customer_id);
    assertUuid(customerId, "trackingRow.customer_id");
    if (kind === "customer") {
      proof.customersCreated.add(customerId);
    } else {
      proof.notesCreated.add(customerId);
    }
  }
  return proof;
}

/**
 * @deprecated TEMP tracking removed in v2.1 — use phase2_harness.run_start + persistent run_tracking.
 * @param {string} runId
 */
export function buildRunTrackingSetupSql(runId) {
  assertUuid(runId, "runId");
  return `-- v2.1: run must exist in phase2_harness.runs (call run_start before fixture prep)
-- Tracking rows go to ${PHASE2_NOTES_RUN_TRACKING_TABLE} only after successful product INSERT
SELECT run_id, status FROM phase2_harness.runs WHERE run_id = '${runId}'::uuid;`;
}

/** All Phase 2 notes fixture customer slots (each must use a distinct UUID at runtime). */
export const PHASE2_NOTES_CUSTOMER_KEYS = ["p15", "p16", "p17", "p19", "p21", "p22"];

/** Mutating P2 cases — must never share customer_id. */
export const PHASE2_NOTES_MUTATING_CUSTOMER_KEYS = ["p15", "p16", "p21", "p22"];

/** One row per customer_id (PK). Each mutating case uses its own customer. */
export const PHASE2_NOTES_FIXTURE_CUSTOMERS = {
  p15: PHASE2_NOTES_CUSTOMER_EMAIL,
  p16: "phase2-notes-fixture-p16-a@artecium.test",
  p17: "phase2-notes-fixture-p17-a@artecium.test",
  p19: PHASE2_NOTES_CUSTOMER_EMAIL_B,
  p21: PHASE2_NOTES_CUSTOMER_EMAIL_P21,
  p22: "phase2-notes-fixture-p22-a@artecium.test",
};

/** @type {Record<string, import('./booking-phase2-p2-notes-lib.mjs').P2NotesExpectation>} */
export const P2_NOTES_EXPECTATIONS = {
  "P2-15": {
    auth: "jwt_only",
    operation: "insert",
    actors: ["managerA"],
    sqlOmitBusinessId: true,
    expectSuccess: true,
    expectBusinessId: "A",
    expectNotesContains: "phase2-insert-omit-business-id",
    expectRowCount: 1,
    cleanupNoteAfter: true,
  },
  "P2-16": {
    auth: "jwt_only",
    operation: "insert",
    actors: ["managerA"],
    expectSuccess: true,
    expectBusinessId: "A",
    expectNotesContains: "phase2-wrong-biz",
    expectRowCount: 1,
    cleanupNoteAfter: true,
  },
  "P2-17": {
    auth: "jwt",
    operation: "select",
    actors: ["ownerA", "managerA"],
    expectSuccess: true,
    expectRowCount: 1,
    expectNotesContains: "phase2-read-fixture",
    postgrest: true,
  },
  "P2-19": {
    auth: "jwt",
    operation: "insert",
    actors: ["managerA"],
    expectSuccess: false,
    rejectCodes: ["42501"],
    postgrest: true,
  },
  "P2-21": {
    auth: "jwt_only",
    operation: "insert",
    actors: ["managerA"],
    sqlOmitBusinessId: true,
    expectSuccess: true,
    expectBusinessId: "A",
    expectNotesContains: "phase2-p21-omit-business-id",
    expectRowCount: 1,
    cleanupNoteAfter: true,
  },
  "P2-22": {
    auth: "jwt_only",
    operation: "update",
    actors: ["managerA"],
    expectSuccess: true,
    expectBusinessId: "unchanged",
    expectRowCount: 1,
  },
};

/**
 * @typedef {Object} P2NotesExpectation
 * @property {'jwt'|'jwt_only'} auth
 * @property {'insert'|'update'|'select'} operation
 * @property {string[]} [actors]
 * @property {boolean} expectSuccess
 * @property {'A'|'unchanged'} [expectBusinessId]
 * @property {string} [expectNotesContains]
 * @property {number} [expectRowCount]
 * @property {string[]} [rejectCodes]
 * @property {boolean} [postgrest]
 * @property {boolean} [sqlOmitBusinessId]
 * @property {boolean} [cleanupNoteAfter]
 */

/**
 * @typedef {Object} NotesCaseOutcome
 * @property {boolean} ok
 * @property {number} [rowCount]
 * @property {string} [businessId]
 * @property {string} [expectedBusinessId]
 * @property {string} [originalBusinessId]
 * @property {string} [notes]
 * @property {string} [errorCode]
 * @property {unknown[]} [rows]
 */

const JWT_CLEAR_FOOTER = `
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', '', true);
RESET ROLE;`;

/** @param {string} userId @param {string} body */
export function wrapAuthenticatedSql(userId, body) {
  assertUuid(userId, "jwt userId");
  return `-- RLS as authenticated (not postgres superuser)
BEGIN;
SELECT set_config('request.jwt.claim.sub', '${userId}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

${body.trim()}

${JWT_CLEAR_FOOTER}
COMMIT;`;
}

/** @param {string} userId @param {string} body */
export function wrapAuthenticatedSqlRollback(userId, body) {
  return wrapAuthenticatedSql(userId, body).replace("COMMIT;", "ROLLBACK;");
}

/**
 * @param {string} id @param {string} biz @param {string} email @param {string} key @param {string} runId
 */
function buildFixtureCustomerPrepSql(id, biz, email, key, runId) {
  const tag = `fixture_customer_${key}`;
  return `-- Fixture customer ${key}: effective validation (abort on id/email/business conflict)
DO $${tag}$
DECLARE
  v_id uuid := '${id}'::uuid;
  v_biz uuid := '${biz}'::uuid;
  v_email text := '${email}';
  r_id public.booking_customers%ROWTYPE;
  r_email public.booking_customers%ROWTYPE;
  v_inserted uuid;
BEGIN
  SELECT * INTO r_id FROM public.booking_customers WHERE id = v_id;
  SELECT * INTO r_email FROM public.booking_customers
    WHERE business_id = v_biz AND lower(email) = lower(v_email);

  IF r_id.id IS NOT NULL THEN
    IF r_id.business_id IS DISTINCT FROM v_biz
       OR lower(r_id.email) IS DISTINCT FROM lower(v_email) THEN
      RAISE EXCEPTION '${tag}: id % already bound to different email/business', v_id;
    END IF;
  END IF;

  IF r_email.id IS NOT NULL AND r_email.id IS DISTINCT FROM v_id THEN
    RAISE EXCEPTION '${tag}: email % on business % already uses id %', v_email, v_biz, r_email.id;
  END IF;

  IF r_id.id IS NULL AND r_email.id IS NULL THEN
    INSERT INTO public.booking_customers (id, business_id, email, full_name)
    VALUES (v_id, v_biz, v_email, 'Phase2 Notes ${key}')
    RETURNING id INTO v_inserted;
    IF v_inserted IS NULL THEN
      RAISE EXCEPTION '${tag}: INSERT returned no row (not a success)';
    END IF;
    PERFORM phase2_harness.track_fixture_customer('${runId}'::uuid, v_inserted, '${key}');
  ELSIF r_id.id IS NOT NULL THEN
    NULL; -- pre-existing: do NOT track (not deletable by this run cleanup)
  ELSE
    RAISE EXCEPTION '${tag}: ambiguous booking_customers state for % / %', v_id, v_email;
  END IF;
END $${tag}$;`;
}

/**
 * @param {string} customerId @param {string} expectedNotes @param {string} purpose
 */
function buildFixtureNotePrepSql(customerId, expectedNotes, purpose) {
  const tag = purpose.replace(/\W+/g, "_").toLowerCase();
  const escNotes = String(expectedNotes).replace(/'/g, "''");
  return `-- ${purpose}: effective validation (no update of pre-existing notes)
DO $${tag}$
DECLARE
  v_customer uuid := '${customerId}'::uuid;
  v_expected text := '${escNotes}';
  v_notes text;
BEGIN
  SELECT notes INTO v_notes
  FROM public.booking_customer_internal_notes
  WHERE customer_id = v_customer;

  IF FOUND THEN
    IF v_notes NOT LIKE '${PHASE2_NOTES_FIXTURE_NOTE_PREFIX}%' THEN
      RAISE EXCEPTION '${tag}: customer % has non-fixture note (abort)', v_customer;
    END IF;
    IF v_notes IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION '${tag}: customer % fixture note mismatch (expected %, got %)', v_customer, v_expected, v_notes;
    END IF;
  END IF;
END $${tag}$;`;
}

/**
 * Authenticated INSERT (session SET ROLE) + harness track in same DO transaction (not SECURITY DEFINER).
 * Administrative fixture prep — not an RLS authorization proof.
 * @param {string} runId @param {string} customerId @param {string} fixtureKey @param {string} expectedNotes @param {string} managerUserId @param {string} purpose
 */
function buildFixtureNoteCreateAndTrackSql(runId, customerId, fixtureKey, expectedNotes, managerUserId, purpose) {
  const tag = `${purpose.replace(/\W+/g, "_").toLowerCase()}_create_track`;
  const escNotes = String(expectedNotes).replace(/'/g, "''");
  return `-- ${purpose}: JWT INSERT + track_fixture_note (same transaction; prep only, not RLS proof)
DO $${tag}$
DECLARE
  v_customer uuid := '${customerId}'::uuid;
  v_inserted uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '${managerUserId}', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.booking_customer_internal_notes (customer_id, notes)
  SELECT v_customer, '${escNotes}'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_customer_internal_notes n WHERE n.customer_id = v_customer
  )
  RETURNING customer_id INTO v_inserted;

  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', '', true);

  IF v_inserted IS NOT NULL THEN
    PERFORM phase2_harness.track_fixture_note(
      '${runId}'::uuid,
      v_inserted,
      '${fixtureKey}',
      '${escNotes}'
    );
  END IF;
END $${tag}$;`;
}

/**
 * @param {{
 *   businessAId: string,
 *   businessBId: string,
 *   customerIds: Partial<Record<keyof typeof PHASE2_NOTES_FIXTURE_CUSTOMERS, string>>,
 *   managerUserId: string,
 *   creationProof: NotesRunCreationProof,
 * }} ctx
 */
export function buildNotesFixtureSql(ctx) {
  validateNotesSqlContext({
    businessAId: ctx.businessAId,
    businessBId: ctx.businessBId,
    managerUserId: ctx.managerUserId,
    customerIds: ctx.customerIds,
  });
  validateCreationProof(ctx.creationProof);
  validateDistinctNotesCustomerIds(ctx.customerIds, { requireAll: false });
  const { businessAId, businessBId, customerIds, managerUserId, creationProof } = ctx;
  const runId = creationProof.runId;
  const lines = [
    `-- Fixture prep run_id=${runId} → ${PHASE2_NOTES_RUN_TRACKING_TABLE}`,
    buildRunTrackingSetupSql(runId),
  ];
  const fixtureRows = [
    { key: "p15", biz: businessAId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p15 },
    { key: "p16", biz: businessAId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p16 },
    { key: "p17", biz: businessAId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p17 },
    { key: "p21", biz: businessAId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p21 },
    { key: "p22", biz: businessAId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p22 },
    { key: "p19", biz: businessBId, email: PHASE2_NOTES_FIXTURE_CUSTOMERS.p19 },
  ];
  for (const row of fixtureRows) {
    const id = customerIds[row.key];
    if (!id) continue;
    lines.push(buildFixtureCustomerPrepSql(id, row.biz, row.email, row.key, runId));
  }
  const p17Id = customerIds.p17;
  if (p17Id && managerUserId) {
    lines.push(buildFixtureNotePrepSql(p17Id, "phase2-read-fixture", "P2-17 note prep"));
    lines.push(
      buildFixtureNoteCreateAndTrackSql(runId, p17Id, "p17", "phase2-read-fixture", managerUserId, "P2-17 note prep"),
    );
  }
  const p22Id = customerIds.p22;
  if (p22Id && managerUserId) {
    lines.push(buildFixtureNotePrepSql(p22Id, "phase2-p22-before-update", "P2-22 note prep"));
    lines.push(
      buildFixtureNoteCreateAndTrackSql(
        runId,
        p22Id,
        "p22",
        "phase2-p22-before-update",
        managerUserId,
        "P2-22 note prep",
      ),
    );
  }
  lines.push(buildQueryRunTrackingSql(runId));
  return lines.join("\n\n");
}

/**
 * @param {{
 *   customerIds: Partial<Record<keyof typeof PHASE2_NOTES_FIXTURE_CUSTOMERS, string>>,
 *   businessAId: string,
 *   businessBId: string,
 *   managerUserId: string,
 *   ownerUserId?: string,
 *   creationProof: NotesRunCreationProof,
 * }} ids
 */
export function buildNotesAuthTestSql(ids) {
  validateNotesSqlContext({
    businessAId: ids.businessAId,
    businessBId: ids.businessBId,
    managerUserId: ids.managerUserId,
    ownerUserId: ids.ownerUserId,
    customerIds: ids.customerIds,
  });
  validateCreationProof(ids.creationProof);
  validateDistinctNotesCustomerIds(ids.customerIds, { requireAll: true });
  const { customerIds, businessAId, businessBId, managerUserId, ownerUserId } = ids;
  const p15 = customerIds.p15;
  const p16 = customerIds.p16;
  const p21 = customerIds.p21;
  const p22 = customerIds.p22;
  const p19 = customerIds.p19;
  const p17 = customerIds.p17;

  /** @type {Record<string, string>} */
  const blocks = {};

  if (p15) {
    blocks.p2_15 = wrapAuthenticatedSqlRollback(
      managerUserId,
      `INSERT INTO public.booking_customer_internal_notes (customer_id, notes)
VALUES ('${p15}'::uuid, 'phase2-insert-omit-business-id')
RETURNING customer_id, business_id, notes;`,
    );
  }
  if (p16) {
    blocks.p2_16 = wrapAuthenticatedSqlRollback(
      managerUserId,
      `INSERT INTO public.booking_customer_internal_notes (customer_id, business_id, notes)
VALUES ('${p16}'::uuid, '${businessBId}'::uuid, 'phase2-wrong-biz')
RETURNING customer_id, business_id, notes;`,
    );
  }
  if (p21) {
    blocks.p2_21 = wrapAuthenticatedSqlRollback(
      managerUserId,
      `INSERT INTO public.booking_customer_internal_notes (customer_id, notes)
VALUES ('${p21}'::uuid, 'phase2-p21-omit-business-id')
RETURNING customer_id, business_id, notes;`,
    );
  }
  if (p22) {
    blocks.p2_22 = wrapAuthenticatedSqlRollback(
      managerUserId,
      `-- Capture business_id before UPDATE (must equal after — trigger keeps tenant A)
SELECT business_id AS business_id_before
FROM public.booking_customer_internal_notes
WHERE customer_id = '${p22}'::uuid;

UPDATE public.booking_customer_internal_notes
SET business_id = '${businessBId}'::uuid
WHERE customer_id = '${p22}'::uuid
RETURNING customer_id, business_id AS business_id_after, notes;`,
    );
  }
  if (p19) {
    blocks.p2_19 = wrapAuthenticatedSqlRollback(
      managerUserId,
      `-- Manager A: customer on B, business_id A in payload → trigger aligns to B → RLS 42501
INSERT INTO public.booking_customer_internal_notes (customer_id, business_id, notes)
VALUES ('${p19}'::uuid, '${businessAId}'::uuid, 'phase2-cross-tenant')
RETURNING customer_id, business_id, notes;`,
    );
    blocks.p2_19_postgrest = `-- Optional mirror: PostgREST new SupabaseClient per actor after signOut
-- POST booking_customer_internal_notes with manager A access_token
-- body: { "customer_id": "${p19}", "business_id": "${businessAId}", "notes": "phase2-cross-tenant" }
-- Expect HTTP error with code 42501 (RLS), not PGRST301 (JWT).`;
  }

  blocks.p2_17 = buildP17VerifySql({
    customerId: p17,
    managerUserId,
    ownerUserId,
  });

  blocks.revert = buildNotesCleanupSql(customerIds, {
    businessAId,
    businessBId,
  }, ids.creationProof);
  blocks.session_isolation =
    "-- After each case: signOut / discard client; never reuse Authorization header across actors.";

  return blocks;
}

/**
 * @param {{ customerId?: string, managerUserId?: string, ownerUserId?: string }} p
 */
export function buildP17VerifySql(p) {
  const { customerId, managerUserId, ownerUserId } = p;
  if (!customerId) return "";
  const parts = [
    `-- P2-17: isolated JWT session per actor; verify notes text exactly`,
    `-- SELECT ... WHERE customer_id = '${customerId}' AND notes = 'phase2-read-fixture' → 1 row`,
  ];
  if (ownerUserId) {
    parts.push(
      wrapAuthenticatedSqlRollback(
        ownerUserId,
        `SELECT customer_id, business_id, notes
FROM public.booking_customer_internal_notes
WHERE customer_id = '${customerId}'::uuid;`,
      ),
    );
  }
  if (managerUserId) {
    parts.push(
      wrapAuthenticatedSqlRollback(
        managerUserId,
        `SELECT customer_id, business_id, notes
FROM public.booking_customer_internal_notes
WHERE customer_id = '${customerId}'::uuid;`,
      ),
    );
  }
  return parts.join("\n\n");
}

/**
 * @param {Partial<Record<keyof typeof PHASE2_NOTES_FIXTURE_CUSTOMERS, string>>} customerIds
 * @param {{ businessAId: string, businessBId: string }} biz
 * @param {NotesRunCreationProof} proof
 */
export function buildNotesCleanupSql(customerIds, biz, proof) {
  validateDistinctNotesCustomerIds(customerIds, { requireAll: true });
  validateCreationProof(proof);
  const runId = proof.runId;
  const operator = "REPLACE_WITH_OPERATOR";
  const jsCustomersCreated = [...proof.customersCreated];
  const jsNotesCreated = [...proof.notesCreated];

  return `-- v2.1 harness cleanup run_id=${runId}
-- Do NOT run raw DELETE here. Workflow: preview → human review → approve → execute.
-- JS Sets (optional): sync via syncCreationProofFromTrackingQuery — customers=[${jsCustomersCreated.join(", ")}] notes=[${jsNotesCreated.join(", ")}]
-- See docs/booking/PHASE2_PERSISTENT_TRACKING_RUNBOOK.md

-- 1) Preview (returns digest — copy for approve/execute)
-- SELECT phase2_harness.cleanup_preview('${runId}'::uuid, '${operator}', '<fixture_pairs jsonb>');

-- 2) Approve (separate human step, same digest)
-- SELECT phase2_harness.cleanup_approve('${runId}'::uuid, '${operator}', '<digest hex>');

-- 3) Execute (uses fixture_pairs from active snapshot only)
-- SELECT phase2_harness.cleanup_execute('${runId}'::uuid, '${operator}', '<digest hex>');

-- Read-only audit mirror (same logic as compute_cleanup_digest inputs)
SELECT 'created_this_run' AS ownership, t.kind, t.customer_id, t.fixture_key
FROM ${PHASE2_NOTES_RUN_TRACKING_TABLE} t
WHERE t.run_id = '${runId}'::uuid
ORDER BY t.kind, t.fixture_key;

SELECT run_id, status, cleanup_status, cleanup_approval_digest
FROM phase2_harness.runs
WHERE run_id = '${runId}'::uuid;

SELECT run_id, snapshot_seq, digest, is_superseded, snapshot_at
FROM phase2_harness.cleanup_audit_snapshots
WHERE run_id = '${runId}'::uuid
ORDER BY snapshot_seq DESC;`;
}

/**
 * @param {string} caseId
 * @param {NotesCaseOutcome} outcome
 */
export function assertNotesCaseOutcome(caseId, outcome) {
  const exp = P2_NOTES_EXPECTATIONS[caseId];
  if (!exp) return { pass: false, reason: `unknown case ${caseId}` };

  if (exp.expectSuccess) {
    if (outcome.ok !== true) {
      return { pass: false, reason: `expected success, got ok=${outcome.ok} code=${outcome.errorCode ?? "—"}` };
    }
    if (exp.expectRowCount == null) {
      return { pass: false, reason: "contract missing expectRowCount for success case" };
    }
    if (outcome.rowCount !== exp.expectRowCount) {
      return {
        pass: false,
        reason: `rowCount ${outcome.rowCount ?? "undefined"} !== ${exp.expectRowCount}`,
      };
    }
    if (exp.expectBusinessId === "A") {
      if (!outcome.expectedBusinessId) {
        return { pass: false, reason: "missing expectedBusinessId for tenant A check" };
      }
      if (!outcome.businessId) {
        return { pass: false, reason: "missing businessId in outcome" };
      }
      if (outcome.businessId !== outcome.expectedBusinessId) {
        return {
          pass: false,
          reason: `business_id ${outcome.businessId} !== expected ${outcome.expectedBusinessId}`,
        };
      }
    }
    if (exp.expectBusinessId === "unchanged") {
      if (!outcome.originalBusinessId) {
        return { pass: false, reason: "missing originalBusinessId for unchanged check" };
      }
      if (!outcome.businessId) {
        return { pass: false, reason: "missing businessId after update" };
      }
      if (outcome.businessId !== outcome.originalBusinessId) {
        return {
          pass: false,
          reason: `business_id changed ${outcome.originalBusinessId} → ${outcome.businessId}`,
        };
      }
    }
    if (exp.expectNotesContains) {
      const text = outcome.notes ?? extractNotesFromRows(outcome.rows);
      if (text == null || text === "") {
        return { pass: false, reason: "missing notes content in outcome" };
      }
      if (!String(text).includes(exp.expectNotesContains)) {
        return {
          pass: false,
          reason: `notes "${text}" does not contain "${exp.expectNotesContains}"`,
        };
      }
    }
    return { pass: true };
  }

  if (outcome.ok === true) {
    return { pass: false, reason: "expected rejection but ok=true" };
  }
  if (outcome.ok !== false) {
    return { pass: false, reason: `expected ok=false, got ${outcome.ok}` };
  }
  if (!outcome.errorCode) {
    return { pass: false, reason: "rejection missing errorCode (rowCount 0 alone is not proof)" };
  }
  const code = String(outcome.errorCode);
  const allow = exp.rejectCodes ?? [];
  if (!allow.length) {
    return { pass: false, reason: "contract missing rejectCodes for failure case" };
  }
  if (!allow.some((c) => code.includes(c))) {
    return { pass: false, reason: `error code ${code} not in allowlist ${allow.join(",")}` };
  }
  return { pass: true };
}

/** @param {unknown[] | undefined} rows */
function extractNotesFromRows(rows) {
  if (!rows?.length) return null;
  const first = rows[0];
  if (first && typeof first === "object" && "notes" in first) {
    return /** @type {{ notes?: string }} */ (first).notes ?? null;
  }
  return null;
}

/** @param {string} caseId */
export function notesActorEmails(caseId) {
  const exp = P2_NOTES_EXPECTATIONS[caseId];
  if (!exp?.actors) return [];
  return exp.actors.map((k) => BOOKING_TEST_USERS[k]?.email).filter(Boolean);
}
