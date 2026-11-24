/**
 * Deterministic Booking integration test fixtures (no real PII).
 * Used by seed + integration tests — keep in sync.
 */

/** Protected refs — Booking tests must never target these (incl. legacy test/prod). */
export const BOOKING_PROTECTED_PROJECT_REFS = ["bwxhdoxesqtdqwkxrmom"];

/** Sandbox ref for Booking integration / RLS / E2E in this phase. */
export const BOOKING_SANDBOX_PROJECT_REF = "ahbtpmlrzruwtfcichlg";

/** Hosted Supabase project refs permitted for Booking seed/tests (sandbox only). */
export const BOOKING_ALLOWLISTED_PROJECT_REFS = [BOOKING_SANDBOX_PROJECT_REF];

export const BOOKING_INTEGRATION_MARKER = "artecium-booking-integration-v1";

export const BOOKING_TEST_USERS = {
  ownerA: { email: "booking-owner-a@artecium.test", role: "owner" },
  ownerB: { email: "booking-owner-b@artecium.test", role: "owner" },
  managerA: { email: "booking-manager-a@artecium.test", role: "manager" },
  staffMemberA: { email: "booking-staff-member-a@artecium.test", role: "staff" },
  /** Professional on salon A with no booking_staff.profile_id (Phase 2 P2-05). */
  professionalUnlinkedA: {
    email: "booking-professional-unlinked-a@artecium.test",
    role: "professional",
  },
};

/** Password from env `BOOKING_TEST_PASSWORD` (local or allowlisted remote test project). */
export const BOOKING_TEST_PASSWORD_ENV = "BOOKING_TEST_PASSWORD";

export const SLUGS = {
  businessA: "integration-salon-a",
  businessB: "integration-salon-b",
  inactive: "integration-salon-inactive",
};

/**
 * Membership rows inserted by full integration seed (not auth users).
 * Salon A: owner, manager, staff/professional, professional-unlinked (4).
 * Salon B: owner (1). Inactive: ownerA (1). Total = 6.
 * (Earlier “7” counts conflated subscription INSERTs or duplicate ensureAuthUser loop with memberships.)
 */
export const BOOKING_INTEGRATION_MEMBERSHIP_ROWS = 6;

/** Sam time_off label — incremental fixtures match seed when absent. */
export const PHASE2_SAM_TIME_OFF_LABEL = "Integration time off Sam";

/** Primary notes fixture on business A (P2-15). */
export const PHASE2_NOTES_CUSTOMER_EMAIL = "phase2-notes-fixture-a@artecium.test";

/** Independent customer for P2-21 (avoids PK collision with P2-15/16/22). */
export const PHASE2_NOTES_CUSTOMER_EMAIL_P21 = "phase2-notes-fixture-p21-a@artecium.test";

/** Customer on business B for P2-19 cross-tenant reject. */
export const PHASE2_NOTES_CUSTOMER_EMAIL_B = "phase2-notes-fixture-b@artecium.test";

/** Fixed local dates for slot queries (relative to seed run — tests compute from seed metadata). */
export const SEED_TIMEZONE = "Europe/Lisbon";

/** Prefix for notes rows owned by Phase 2 fixture prep (safe to replace). */
export const PHASE2_NOTES_FIXTURE_NOTE_PREFIX = "phase2-";

/**
 * Sam Provider time_off window aligned to integration seed (anchor = seed Monday UTC midnight).
 * @param {string | Date} anchor — e.g. bk_seed_confirmed starts_at or computed Monday
 */
export function computeSamTimeOffInterval(anchor) {
  const d = anchor instanceof Date ? anchor : new Date(anchor);
  const monday = new Date(d);
  monday.setUTCHours(0, 0, 0, 0);
  const starts = new Date(monday.getTime() + 2 * 86400000);
  const ends = new Date(starts.getTime() + 4 * 3600000);
  return {
    label: PHASE2_SAM_TIME_OFF_LABEL,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
  };
}
