/**
 * Guards for Booking DB scripts (local Supabase or allowlisted remote test project only).
 */

import {
  BOOKING_ALLOWLISTED_PROJECT_REFS,
  BOOKING_PROTECTED_PROJECT_REFS,
  BOOKING_SANDBOX_PROJECT_REF,
} from "./booking-integration-fixtures.mjs";

export const BOOKING_REMOTE_TESTS_ENV = "BOOKING_ALLOW_REMOTE_TESTS";
export const BOOKING_EXPECTED_PROJECT_REF_ENV = "BOOKING_EXPECTED_PROJECT_REF";
export const BOOKING_SANDBOX_ENV_LOADED_ENV = "BOOKING_SANDBOX_ENV_LOADED";

export function assertLocalBookingTestEnabled(flagEnvName) {
  if (process.env[flagEnvName] !== "1") {
    console.log(`Skip: set ${flagEnvName}=1 to run.`);
    process.exit(0);
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return { url, anonKey, serviceKey };
}

/** @param {string} url */
export function extractSupabaseProjectRef(url) {
  if (!url) return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  const hosted = trimmed.match(/^https?:\/\/([a-z0-9]{20})\.supabase\.co$/i);
  if (hosted) return hosted[1].toLowerCase();
  return null;
}

/** @param {string} url */
export function isLocalSupabaseUrl(url) {
  if (!url) return false;
  return (
    /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url.trim()) ||
    url.startsWith("http://127.0.0.1:") ||
    url.startsWith("http://localhost:")
  );
}

/**
 * Validates the Supabase target before any DB access.
 * - Local: 127.0.0.1 / localhost (no remote flag).
 * - Hosted: requires BOOKING_ALLOW_REMOTE_TESTS=1 and project ref on allowlist.
 */
export function assertBookingDatabaseTarget(url) {
  if (!url?.trim()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (isLocalSupabaseUrl(url)) {
    return { kind: "local", projectRef: null };
  }

  const projectRef = extractSupabaseProjectRef(url);
  if (!projectRef) {
    throw new Error(
      "Unsupported Supabase URL. Use local http://127.0.0.1:54321 or https://<project-ref>.supabase.co",
    );
  }

  if (BOOKING_PROTECTED_PROJECT_REFS.includes(projectRef)) {
    throw new Error(
      `BLOCKED: Supabase project "${projectRef}" is protected. Use sandbox ${BOOKING_ALLOWLISTED_PROJECT_REFS[0] ?? "(none)"} or local Supabase only.`,
    );
  }

  if (process.env[BOOKING_REMOTE_TESTS_ENV] !== "1") {
    throw new Error(
      `Remote Booking tests blocked. Set ${BOOKING_REMOTE_TESTS_ENV}=1 and use the allowlisted test project only.`,
    );
  }

  if (!BOOKING_ALLOWLISTED_PROJECT_REFS.includes(projectRef)) {
    throw new Error(
      `Supabase project "${projectRef}" is not allowlisted for Booking tests. Refusing to continue.`,
    );
  }

  const expected = process.env[BOOKING_EXPECTED_PROJECT_REF_ENV]?.trim().toLowerCase();
  if (expected && expected !== projectRef) {
    throw new Error(
      `${BOOKING_EXPECTED_PROJECT_REF_ENV}="${expected}" does not match URL project ref "${projectRef}".`,
    );
  }

  return { kind: "remote", projectRef };
}

/** @deprecated Use assertBookingDatabaseTarget */
export function assertLocalSupabaseUrl(url) {
  assertBookingDatabaseTarget(url);
}

export function assertKeysPresent(env) {
  if (!env.anonKey || !env.serviceKey) {
    throw new Error("Missing anon/publishable or SUPABASE_SERVICE_ROLE_KEY.");
  }
}

/**
 * Remote write scripts: require explicit sandbox env file (--env-file=.env.booking.sandbox.local),
 * allowlisted ref, and BOOKING_EXPECTED_PROJECT_REF matching the sandbox.
 * Local loopback targets skip BOOKING_SANDBOX_ENV_LOADED (docker dev).
 */
export function assertBookingExplicitSandboxEnv() {
  const env = getSupabaseEnv();
  const target = assertBookingDatabaseTarget(env.url);
  assertKeysPresent(env);

  if (target.kind === "local") {
    return { env, target };
  }

  if (process.env[BOOKING_SANDBOX_ENV_LOADED_ENV] !== "1") {
    throw new Error(
      `Missing ${BOOKING_SANDBOX_ENV_LOADED_ENV}=1. Run: node --env-file=.env.booking.sandbox.local <script> (never .env.local or .env.booking.test.local).`,
    );
  }

  const expected = process.env[BOOKING_EXPECTED_PROJECT_REF_ENV]?.trim().toLowerCase();
  if (expected !== BOOKING_SANDBOX_PROJECT_REF) {
    throw new Error(
      `Set ${BOOKING_EXPECTED_PROJECT_REF_ENV}=${BOOKING_SANDBOX_PROJECT_REF} in .env.booking.sandbox.local.`,
    );
  }

  if (target.projectRef !== BOOKING_SANDBOX_PROJECT_REF) {
    throw new Error(
      `Sandbox URL ref must be ${BOOKING_SANDBOX_PROJECT_REF}, got "${target.projectRef}".`,
    );
  }

  return { env, target };
}
