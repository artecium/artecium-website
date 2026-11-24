/**
 * Public booking idempotency helpers (must stay aligned with SQL in migration 015).
 */

const KEY_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

export function isValidPublicIdempotencyKey(key: string | null | undefined): boolean {
  if (key == null) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  return KEY_PATTERN.test(trimmed);
}

/** Canonical request fingerprint for replay detection (no guest PII). */
export function buildPublicIdempotencyRequestHash(input: {
  serviceId: string;
  staffId: string;
  /** ISO-8601 instant; normalized to UTC milliseconds in hash. */
  startsAtIso: string;
}): string {
  const startsMs = Date.parse(input.startsAtIso);
  if (!Number.isFinite(startsMs)) {
    throw new Error("Invalid startsAtIso");
  }
  const payload = `${input.serviceId}|${input.staffId}|${startsMs}`;
  return payload;
}

/** Node-side SHA-256 hex for tests; production RPC uses pgcrypto digest. */
export async function sha256HexNode(value: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(value, "utf8").digest("hex");
}
