/**
 * Phase 2 RLS (professional scope) — shared constants for local verification scripts.
 */

import fs from "node:fs";
import path from "node:path";

export const MIGRATION_022_FILE = "022_booking_professional_rls_scope.sql";

export const MIGRATION_022_REQUIRED_SNIPPETS = [
  "booking_can_read_full_appointment",
  "booking_is_professional_member",
  "booking_list_member_staff_busy_intervals",
  "booking_list_member_staff_time_off_intervals",
  "booking_member_availability_staff_allowed",
  "booking_customer_internal_notes",
  "booking_customers_id_business_key",
  "booking_customer_internal_notes_customer_business_fkey",
  "booking_trg_customer_internal_notes_business_match",
  "set search_path = ''",
  "booking_customers_member",
  "booking_time_off_availability",
  "limit 2001",
  "interval '31 days'",
  "booking_staff_ids_for_auth_user",
  "Booking read subscriptions",
  "booking_can_manage_business(business_id)",
  "blocked_starts_at",
  "grant execute on function public.booking_can_read_full_appointment",
  "grant execute on function public.booking_is_professional_member",
  "grant execute on function public.booking_list_member_staff_busy_intervals",
  "language plpgsql",
  "volatile",
];

export function extractBusyRpcSql(fullSql) {
  const start = fullSql.indexOf("create or replace function public.booking_list_member_staff_busy_intervals");
  const end = fullSql.indexOf("create or replace function public.booking_list_member_staff_time_off_intervals");
  if (start < 0 || end < 0) return "";
  return fullSql.slice(start, end);
}

export const MIGRATION_022_BUSY_RPC_FORBIDDEN = [
  "guest_email",
  "guest_name",
  "customer_id",
  "public_reference",
  "appointment_id",
  "a.id",
  "status text",
];

/** RPC return must not expose appointment id or status in busy function body return */
export const MIGRATION_022_BUSY_RPC_MUST_NOT_INCLUDE = [
  /returns table\s*\([^)]*\bid\b[^)]*\)/is,
  /return query[\s\S]*?\ba\.status\b[\s\S]*?from _booking_busy_slice/is,
];

export function readMigration022Sql() {
  const filePath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    MIGRATION_022_FILE,
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing migration file: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

/** @typedef {{ id: string; title: string; local: boolean; remote: boolean }} Phase2Case */

/** @type {Phase2Case[]} */
export const PHASE2_RLS_CASES = [
  { id: "P2-01", title: "Professional A cannot SELECT appointments of B", local: false, remote: true },
  { id: "P2-02", title: "Professional A busy RPC for colleagues excludes own staff", local: false, remote: true },
  { id: "P2-03", title: "Busy RPC payload has no PII columns", local: true, remote: true },
  { id: "P2-04", title: "Shared customer visible to A; B appointments not visible", local: false, remote: true },
  { id: "P2-05", title: "Professional without profile_id: 0 appointments", local: true, remote: true },
  { id: "P2-06", title: "Owner/Manager full appointment SELECT", local: false, remote: true },
  { id: "P2-07", title: "Cross-tenant SELECT denied", local: false, remote: true },
  { id: "P2-08", title: "Professional cannot SELECT subscriptions", local: false, remote: true },
  { id: "P2-09", title: "RPC rejects range > 31 days", local: false, remote: true },
  { id: "P2-10", title: "RPC rejects >2000 rows (2001 probe)", local: true, remote: true },
  { id: "P2-11", title: "RPC unauthenticated rejected", local: false, remote: true },
  { id: "P2-12", title: "RPC invalid staff_ids for business", local: false, remote: true },
  { id: "P2-13", title: "Professional cannot read colleague time_off.label via table", local: false, remote: true },
  { id: "P2-14", title: "Dashboard stats scope own_staff (logic)", local: true, remote: false },
  {
    id: "P2-15",
    title: "Internal note INSERT with correct customer (business_id derived by trigger)",
    local: true,
    remote: true,
  },
  {
    id: "P2-16",
    title: "Internal note INSERT with wrong business_id (B) for customer A — trigger sets A; manager succeeds",
    local: true,
    remote: true,
  },
  {
    id: "P2-17",
    title: "Owner/Manager SELECT booking_customer_internal_notes",
    local: true,
    remote: true,
  },
  {
    id: "P2-18",
    title: "Professional SELECT booking_customer_internal_notes denied",
    local: false,
    remote: true,
  },
  {
    id: "P2-19",
    title: "Manager of business A cannot attach note to customer of business B",
    local: true,
    remote: true,
  },
  {
    id: "P2-20",
    title: "listBookingCustomers manage path uses internal notes table",
    local: true,
    remote: false,
  },
  {
    id: "P2-21",
    title: "Notes INSERT with NULL or wrong business_id (trigger derives tenant)",
    local: true,
    remote: true,
  },
  {
    id: "P2-22",
    title: "Notes UPDATE business_id-only cannot bypass trigger",
    local: true,
    remote: true,
  },
  {
    id: "P2-23",
    title: "UNIQUE constraint DO: wrong booking_customers_id_business_key definition fails apply",
    local: true,
    remote: true,
  },
];

/** @type {{ name: string; definer: boolean; executeAuthenticated: boolean; searchPath: string }[]} */
export const MIGRATION_022_SECURITY_DEFINER_FUNCTIONS = [
  {
    name: "booking_member_role_normalized(uuid)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_is_professional_member(uuid)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_staff_ids_for_auth_user(uuid)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_can_read_full_appointment(uuid, uuid)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_can_read_time_off_row(uuid)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_assert_member_availability_request(uuid, timestamptz, timestamptz, uuid[])",
    definer: true,
    executeAuthenticated: false,
    searchPath: "''",
  },
  {
    name: "booking_member_availability_staff_allowed(uuid, uuid, uuid[])",
    definer: true,
    executeAuthenticated: false,
    searchPath: "''",
  },
  {
    name: "booking_list_member_staff_busy_intervals(...)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_list_member_staff_time_off_intervals(...)",
    definer: true,
    executeAuthenticated: true,
    searchPath: "''",
  },
  {
    name: "booking_trg_customer_internal_notes_business_match()",
    definer: false,
    executeAuthenticated: false,
    searchPath: "''",
  },
];
