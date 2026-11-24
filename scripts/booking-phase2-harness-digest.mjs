/**
 * Canonical cleanup digest (v3) — must match phase2_harness.compute_cleanup_digest in migration 023.
 * Local tests only; no network.
 */

import { createHash } from "node:crypto";

export const DIGEST_ALGORITHM_VERSION = 3;

/** @typedef {'created_this_run'|'pre_existing_untracked_customer'|'pre_existing_untracked_note'|'to_delete_note'|'to_delete_customer'} AuditSection */

/** @typedef {{ section: AuditSection, run_id: string, kind: string|null, fixture_key: string|null, customer_id: string|null, email_normalized: string|null, business_id: string|null, notes: string|null }} AuditRecord */

/** @typedef {{ fixture_key: string, customer_id: string, email_normalized: string, business_id: string }} FixturePair */

const SECTION_ORDER = [
  "created_this_run",
  "pre_existing_untracked_customer",
  "pre_existing_untracked_note",
  "to_delete_note",
  "to_delete_customer",
];

/** @param {string|null|undefined} u */
export function normalizeUuid(u) {
  if (u == null || String(u).trim() === "") return null;
  return String(u).trim().toLowerCase();
}

/** @param {string|null|undefined} e */
export function normalizeEmail(e) {
  if (e == null) return null;
  const t = String(e).trim();
  if (t === "") return null;
  return t.toLowerCase();
}

/** Exact note column bytes for digest — no trim. */
/** @param {string|null|undefined} notes */
export function noteDigestValue(notes) {
  if (notes == null) return null;
  return String(notes);
}

/** @param {string|null|undefined} s */
function jsonStr(s) {
  if (s == null) return "null";
  let out = "";
  for (const ch of String(s)) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (code < 32) out += `\\u${code.toString(16).padStart(4, "0")}`;
    else out += ch;
  }
  return `"${out}"`;
}

/** @param {AuditRecord} r */
function recordCanonicalJson(r) {
  return (
    "{" +
    `"section":${jsonStr(r.section)},` +
    `"run_id":${jsonStr(normalizeUuid(r.run_id))},` +
    `"kind":${r.kind == null ? "null" : jsonStr(r.kind)},` +
    `"fixture_key":${r.fixture_key == null ? "null" : jsonStr(r.fixture_key)},` +
    `"customer_id":${r.customer_id == null ? "null" : jsonStr(normalizeUuid(r.customer_id))},` +
    `"email_normalized":${r.email_normalized == null ? "null" : jsonStr(r.email_normalized)},` +
    `"business_id":${r.business_id == null ? "null" : jsonStr(normalizeUuid(r.business_id))},` +
    `"notes":${r.notes == null ? "null" : jsonStr(r.notes)}` +
    "}"
  );
}

/** @param {FixturePair[]} pairs */
function fixturePairsCanonicalJson(pairs) {
  const sorted = [...pairs].sort((a, b) => a.fixture_key.localeCompare(b.fixture_key));
  const items = sorted.map(
    (p) =>
      "{" +
      `"fixture_key":${jsonStr(p.fixture_key)},` +
      `"customer_id":${jsonStr(normalizeUuid(p.customer_id))},` +
      `"email_normalized":${jsonStr(normalizeEmail(p.email_normalized))},` +
      `"business_id":${jsonStr(normalizeUuid(p.business_id))}` +
      "}",
  );
  return `[${items.join(",")}]`;
}

/** @param {string|null|undefined} v */
function sortKeyNullLast(v) {
  return v == null ? "\uffff" : v;
}

/** @param {string|null|undefined} v — NULLS FIRST for notes */
function sortKeyNullFirst(v) {
  return v == null ? "" : v;
}

/**
 * @param {string} runId
 * @param {FixturePair[]} fixturePairs
 * @param {AuditRecord[]} records
 */
export function buildCanonicalDigestDocument(runId, fixturePairs, records) {
  const runNorm = normalizeUuid(runId);
  const bySection = (sec) =>
    records
      .filter((r) => r.section === sec)
      .sort((a, b) => {
        const kindA = sortKeyNullLast(a.kind);
        const kindB = sortKeyNullLast(b.kind);
        if (kindA !== kindB) return kindA.localeCompare(kindB);
        const fkA = sortKeyNullLast(a.fixture_key);
        const fkB = sortKeyNullLast(b.fixture_key);
        if (fkA !== fkB) return fkA.localeCompare(fkB);
        const cidA = sortKeyNullLast(a.customer_id);
        const cidB = sortKeyNullLast(b.customer_id);
        if (cidA !== cidB) return cidA.localeCompare(cidB);
        const emA = sortKeyNullLast(a.email_normalized);
        const emB = sortKeyNullLast(b.email_normalized);
        if (emA !== emB) return emA.localeCompare(emB);
        const bizA = sortKeyNullLast(a.business_id);
        const bizB = sortKeyNullLast(b.business_id);
        if (bizA !== bizB) return bizA.localeCompare(bizB);
        const notesA = sortKeyNullFirst(a.notes);
        const notesB = sortKeyNullFirst(b.notes);
        return notesA.localeCompare(notesB);
      });

  const recordParts = [];
  for (const sec of SECTION_ORDER) {
    for (const r of bySection(sec)) {
      recordParts.push(
        recordCanonicalJson({
          ...r,
          run_id: runNorm,
          notes: r.notes == null ? null : noteDigestValue(r.notes),
        }),
      );
    }
  }

  return (
    "{" +
    `"digest_algorithm_version":${DIGEST_ALGORITHM_VERSION},` +
    `"run_id":${jsonStr(runNorm)},` +
    `"fixture_pairs":${fixturePairsCanonicalJson(fixturePairs)},` +
    `"records":[${recordParts.join(",")}]` +
    "}"
  );
}

/**
 * @param {string} runId
 * @param {FixturePair[]} fixturePairs
 * @param {AuditRecord[]} records
 */
export function computeCleanupDigestHex(runId, fixturePairs, records) {
  const doc = buildCanonicalDigestDocument(runId, fixturePairs, records);
  return createHash("sha256").update(doc, "utf8").digest("hex");
}
