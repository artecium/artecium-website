/**
 * Phase 5 isolation targets: local Supabase OR explicit cloud sandbox ref.
 * NEVER the protected audit/integration project.
 */

export const PROTECTED_AUDIT_REF = "bwxhdoxesqtdqwkxrmom";

export function isLocalSupabaseUrl(url) {
  if (!url) return false;
  const t = url.trim().replace(/\/+$/, "");
  return (
    /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(t) ||
    t.startsWith("http://127.0.0.1:") ||
    t.startsWith("http://localhost:")
  );
}

export function extractSupabaseProjectRef(url) {
  if (!url) return null;
  const hosted = url.trim().replace(/\/+$/, "").match(/^https?:\/\/([a-z0-9]{20})\.supabase\.co$/i);
  return hosted ? hosted[1].toLowerCase() : null;
}

/**
 * @param {{ requirePhase5Flag?: boolean }} [opts]
 */
export function assertPhase5IsolationTarget(opts = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

  const ref = extractSupabaseProjectRef(url);

  if (ref === PROTECTED_AUDIT_REF) {
    throw new Error(
      `BLOCKED: ref ${PROTECTED_AUDIT_REF} is protected (audit/integration). Use local or PHASE5_SANDBOX_PROJECT_REF.`,
    );
  }

  if (isLocalSupabaseUrl(url)) {
    if (opts.requirePhase5Flag && process.env.PHASE5_CLIENT_ISOLATION !== "1") {
      throw new Error("Set PHASE5_CLIENT_ISOLATION=1");
    }
    return { kind: "local", ref: null };
  }

  const expectedSandbox = process.env.PHASE5_SANDBOX_PROJECT_REF?.trim().toLowerCase();
  if (!expectedSandbox) {
    throw new Error(
      "Cloud target requires PHASE5_SANDBOX_PROJECT_REF (dedicated sandbox, not the audit project).",
    );
  }
  if (expectedSandbox === PROTECTED_AUDIT_REF) {
    throw new Error("PHASE5_SANDBOX_PROJECT_REF cannot equal the protected audit ref.");
  }
  if (ref !== expectedSandbox) {
    throw new Error(
      `URL ref "${ref}" does not match PHASE5_SANDBOX_PROJECT_REF="${expectedSandbox}".`,
    );
  }

  if (opts.requirePhase5Flag && process.env.PHASE5_CLIENT_ISOLATION !== "1") {
    throw new Error("Set PHASE5_CLIENT_ISOLATION=1");
  }

  return { kind: "sandbox", ref };
}

/** @deprecated use assertPhase5IsolationTarget */
export function assertPhase5LocalTarget(opts = {}) {
  return assertPhase5IsolationTarget(opts);
}

export function phase5ProtectedRef() {
  return PROTECTED_AUDIT_REF;
}