/**
 * Guards for read-only or controlled DDL against a hosted **production** Supabase project.
 * Never allowlisted for integration tests (see booking-integration-fixtures.mjs).
 */

import { BOOKING_ALLOWLISTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";
import {
  BOOKING_EXPECTED_PROJECT_REF_ENV,
  extractSupabaseProjectRef,
  getSupabaseEnv,
  isLocalSupabaseUrl,
} from "./booking-test-guards.mjs";

export const BOOKING_PROD_READONLY_ENV = "BOOKING_PROD_READONLY";
export const BOOKING_PROD_PROJECT_REF_ENV = "BOOKING_PROD_PROJECT_REF";

/**
 * @param {string} url
 */
export function assertBookingProdReadonlyTarget(url) {
  if (process.env[BOOKING_PROD_READONLY_ENV] !== "1") {
    throw new Error(
      `Production probes blocked. Set ${BOOKING_PROD_READONLY_ENV}=1 and use .env.booking.prod.local (never the test env file).`,
    );
  }

  if (!url?.trim()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (isLocalSupabaseUrl(url)) {
    throw new Error("Production read-only probes require a hosted *.supabase.co URL, not local.");
  }

  const projectRef = extractSupabaseProjectRef(url);
  if (!projectRef) {
    throw new Error("Invalid hosted Supabase URL.");
  }

  if (BOOKING_ALLOWLISTED_PROJECT_REFS.includes(projectRef)) {
    throw new Error(
      `Ref "${projectRef}" is the integration-test allowlist. Use .env.booking.test.local instead, not production guards.`,
    );
  }

  const declaredProd = process.env[BOOKING_PROD_PROJECT_REF_ENV]?.trim().toLowerCase();
  if (!declaredProd) {
    throw new Error(
      `Set ${BOOKING_PROD_PROJECT_REF_ENV}=<production-ref> (must match NEXT_PUBLIC_SUPABASE_URL).`,
    );
  }

  if (declaredProd !== projectRef) {
    throw new Error(
      `${BOOKING_PROD_PROJECT_REF_ENV}="${declaredProd}" does not match URL ref "${projectRef}".`,
    );
  }

  const expected = process.env[BOOKING_EXPECTED_PROJECT_REF_ENV]?.trim().toLowerCase();
  if (expected && expected !== projectRef) {
    throw new Error(
      `${BOOKING_EXPECTED_PROJECT_REF_ENV}="${expected}" does not match production ref "${projectRef}".`,
    );
  }

  return { kind: "production", projectRef };
}

export function getBookingProdEnv() {
  return getSupabaseEnv();
}